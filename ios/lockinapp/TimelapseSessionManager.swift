import Foundation
import AVFoundation
import UIKit

/// Manages AVCaptureSession for timelapse frame capture
/// Optimized for long-duration recording with minimal resource usage
class TimelapseSessionManager: NSObject {
    
    // MARK: - Properties
    
    private var captureSession: AVCaptureSession?
    private var videoOutput: AVCaptureVideoDataOutput?
    private var currentDevice: AVCaptureDevice?
    
    // Frame processor delegate
    weak var frameProcessor: TimelapseFrameProcessor?
    
    // Dedicated capture queue
    private let captureQueue = DispatchQueue(
        label: "com.lockin.timelapse.capture",
        qos: .userInitiated,
        attributes: [],
        autoreleaseFrequency: .workItem  // Critical for memory management
    )
    
    // Camera settings
    private var cameraPosition: AVCaptureDevice.Position = .back
    
    // MARK: - Initialization
    
    override init() {
        super.init()
    }
    
    convenience init(position: AVCaptureDevice.Position = .back) throws {
        self.init()
        self.cameraPosition = position
        try setupSession()
    }
    
    // MARK: - Session Setup
    
    private func setupSession() throws {
        let session = AVCaptureSession()
        
        // Use photo preset for highest quality stills
        // This gives us the best quality for timelapse frames
        session.sessionPreset = .photo
        
        // Configure for background operation
        session.automaticallyConfiguresApplicationAudioSession = false
        
        // Get camera device
        guard let device = getCamera(position: cameraPosition) else {
            throw TimelapseError.cameraNotAvailable
        }
        currentDevice = device
        
        // Configure device for optimal timelapse capture
        try configureDevice(device)
        
        // Add camera input
        let input = try AVCaptureDeviceInput(device: device)
        guard session.canAddInput(input) else {
            throw TimelapseError.cannotAddInput
        }
        session.addInput(input)
        
        // Configure video output for frame capture
        let output = AVCaptureVideoDataOutput()
        
        // Use BGRA for compatibility with Metal and CoreImage
        output.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]
        
        // Don't queue frames - we only need 2fps, drop the rest
        output.alwaysDiscardsLateVideoFrames = true
        
        // Set delegate on capture queue
        output.setSampleBufferDelegate(self, queue: captureQueue)
        
        guard session.canAddOutput(output) else {
            throw TimelapseError.cannotAddOutput
        }
        session.addOutput(output)
        
        // Configure video connection for portrait orientation
        if let connection = output.connection(with: .video) {
            // Lock to portrait orientation for consistent framing
            if connection.isVideoRotationAngleSupported(90) {
                connection.videoRotationAngle = 90
            }
            
            // Enable video stabilization if available
            if connection.isVideoStabilizationSupported {
                connection.preferredVideoStabilizationMode = .auto
            }
        }
        
        self.captureSession = session
        self.videoOutput = output
    }
    
    private func getCamera(position: AVCaptureDevice.Position) -> AVCaptureDevice? {
        // Prefer wide angle camera for timelapse
        let deviceTypes: [AVCaptureDevice.DeviceType] = [
            .builtInWideAngleCamera,
            .builtInDualCamera,
            .builtInTripleCamera
        ]
        
        let discoverySession = AVCaptureDevice.DiscoverySession(
            deviceTypes: deviceTypes,
            mediaType: .video,
            position: position
        )
        
        return discoverySession.devices.first
    }
    
    private func configureDevice(_ device: AVCaptureDevice) throws {
        try device.lockForConfiguration()
        defer { device.unlockForConfiguration() }
        
        // Set to wide format for portrait 9:16
        // Find format that gives us 1080x1920 or better
        if let bestFormat = findBestFormat(for: device) {
            device.activeFormat = bestFormat
        }
        
        // Lock exposure and white balance for consistent timelapse
        if device.isExposureModeSupported(.continuousAutoExposure) {
            device.exposureMode = .continuousAutoExposure
        }
        
        if device.isWhiteBalanceModeSupported(.continuousAutoWhiteBalance) {
            device.whiteBalanceMode = .continuousAutoWhiteBalance
        }
        
        // Enable low-light boost if available
        if device.isLowLightBoostSupported {
            device.automaticallyEnablesLowLightBoostWhenAvailable = true
        }
    }
    
    private func findBestFormat(for device: AVCaptureDevice) -> AVCaptureDevice.Format? {
        // We want portrait 9:16, so look for 1080x1920 or 1440x2560 or similar
        // In landscape terms (how camera reports): 1920x1080, 2560x1440
        
        let targetWidth: Int32 = 1920
        let targetHeight: Int32 = 1080
        
        var bestFormat: AVCaptureDevice.Format?
        var bestScore: Int32 = 0
        
        for format in device.formats {
            let dimensions = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
            
            // Score based on how close to our target
            // Prefer formats at or above our target
            if dimensions.width >= targetWidth && dimensions.height >= targetHeight {
                let score = dimensions.width * dimensions.height
                
                // Don't go too high (4K is overkill and wastes battery)
                if score < 4096 * 2160 && score > bestScore {
                    bestScore = score
                    bestFormat = format
                }
            }
        }
        
        return bestFormat
    }
    
    // MARK: - Capture Control
    
    func startCapture() throws {
        guard let session = captureSession else {
            throw TimelapseError.sessionNotInitialized
        }
        
        // Configure audio session for background operation
        try configureAudioSession()
        
        // Start on background queue
        captureQueue.async {
            if !session.isRunning {
                session.startRunning()
            }
        }
    }
    
    func stopCapture() {
        captureQueue.async { [weak self] in
            self?.captureSession?.stopRunning()
        }
    }
    
    private func configureAudioSession() throws {
        // Configure audio session to allow background operation
        // Even though we're not recording audio, this enables background capture
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.playAndRecord, mode: .videoRecording, options: [.mixWithOthers, .allowBluetooth])
        try audioSession.setActive(true)
    }
    
    // MARK: - Camera Controls
    
    func switchCamera() throws {
        guard let session = captureSession else { return }
        
        let newPosition: AVCaptureDevice.Position = (cameraPosition == .back) ? .front : .back
        
        guard let newDevice = getCamera(position: newPosition) else {
            throw TimelapseError.cameraNotAvailable
        }
        
        session.beginConfiguration()
        defer { session.commitConfiguration() }
        
        // Remove existing input
        if let currentInput = session.inputs.first as? AVCaptureDeviceInput {
            session.removeInput(currentInput)
        }
        
        // Add new input
        let newInput = try AVCaptureDeviceInput(device: newDevice)
        if session.canAddInput(newInput) {
            session.addInput(newInput)
            cameraPosition = newPosition
            currentDevice = newDevice
            try configureDevice(newDevice)
        }
    }
    
    func setTorch(enabled: Bool) throws {
        guard let device = currentDevice, device.hasTorch else { return }
        
        try device.lockForConfiguration()
        defer { device.unlockForConfiguration() }
        
        device.torchMode = enabled ? .on : .off
    }
}

// MARK: - AVCaptureVideoDataOutputSampleBufferDelegate

extension TimelapseSessionManager: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        // Delegate to frame processor
        // The frame processor handles timing and sampling
        frameProcessor?.processSampleBuffer(sampleBuffer)
    }
    
    func captureOutput(_ output: AVCaptureOutput, didDrop sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        // Frame dropped - this is expected and fine for timelapse
        // We only need 2fps, camera runs at 30fps
    }
}

// MARK: - Errors

enum TimelapseError: LocalizedError {
    case cameraNotAvailable
    case cannotAddInput
    case cannotAddOutput
    case sessionNotInitialized
    case encoderNotReady
    case encoderFailed(String)
    case photoLibraryDenied
    case diskFull
    
    var errorDescription: String? {
        switch self {
        case .cameraNotAvailable:
            return "Camera is not available"
        case .cannotAddInput:
            return "Cannot add camera input to session"
        case .cannotAddOutput:
            return "Cannot add video output to session"
        case .sessionNotInitialized:
            return "Capture session not initialized"
        case .encoderNotReady:
            return "Video encoder is not ready"
        case .encoderFailed(let message):
            return "Video encoder failed: \(message)"
        case .photoLibraryDenied:
            return "Photo library access denied"
        case .diskFull:
            return "Disk is full"
        }
    }
}
