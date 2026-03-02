import Foundation
import AVFoundation
import UIKit

/// Manages AVCaptureSession for timelapse frame capture
/// Optimized for long-duration recording with minimal resource usage
class TimelapseSessionManager: NSObject {
    
    // MARK: - Shared Session Access
    
    /// Static reference to the current active capture session
    /// Used by TimelapsePreviewView to display the camera feed
    static var sharedSession: AVCaptureSession? {
        return _sharedSessionManager?.captureSession
    }
    
    private static weak var _sharedSessionManager: TimelapseSessionManager?
    
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

    // Video orientation
    private var videoOrientation: VideoOrientation = .portrait

    /// Static reference to current video orientation for preview views
    static var currentOrientation: VideoOrientation {
        return _sharedSessionManager?.videoOrientation ?? .portrait
    }

    // MARK: - Initialization
    
    override init() {
        super.init()
        print("[TimelapseSessionManager] Default init() called - WARNING: This does not setup capture session!")
    }
    
    convenience init(position: AVCaptureDevice.Position = .back, orientation: VideoOrientation = .portrait) throws {
        self.init()
        print("[TimelapseSessionManager] convenience init(position:orientation:) called with position: \(position == .back ? "back" : "front"), orientation: \(orientation.rawValue)")
        self.cameraPosition = position
        self.videoOrientation = orientation
        try setupSession()
        
        // Set as shared session manager for preview views
        TimelapseSessionManager._sharedSessionManager = self
        
        // Notify preview views that session is available
        NotificationCenter.default.post(name: NSNotification.Name("TimelapseSessionUpdated"), object: nil)
        
        print("[TimelapseSessionManager] Session setup completed successfully")
    }
    
    deinit {
        // Clear shared reference if this is the current shared manager
        if TimelapseSessionManager._sharedSessionManager === self {
            TimelapseSessionManager._sharedSessionManager = nil
            // Notify preview views that session is gone
            NotificationCenter.default.post(name: NSNotification.Name("TimelapseSessionUpdated"), object: nil)
        }
    }
    
    // MARK: - Session Setup
    
    private func setupSession() throws {
        print("[TimelapseSessionManager] setupSession() starting...")
        let session = AVCaptureSession()
        
        // Use photo preset for highest quality stills
        // This gives us the best quality for timelapse frames
        session.sessionPreset = .photo
        print("[TimelapseSessionManager] AVCaptureSession created with .photo preset")
        
        // Configure for background operation
        session.automaticallyConfiguresApplicationAudioSession = false
        
        // Get camera device
        print("[TimelapseSessionManager] Looking for camera at position: \(cameraPosition == .back ? "back" : "front")")
        guard let device = getCamera(position: cameraPosition) else {
            print("[TimelapseSessionManager] ERROR: Camera not available at position: \(cameraPosition == .back ? "back" : "front")")
            throw TimelapseError.cameraNotAvailable
        }
        currentDevice = device
        print("[TimelapseSessionManager] Found camera device: \(device.localizedName)")
        
        // Configure device for optimal timelapse capture
        try configureDevice(device)
        print("[TimelapseSessionManager] Device configured successfully")
        
        // Add camera input
        print("[TimelapseSessionManager] Creating AVCaptureDeviceInput...")
        let input = try AVCaptureDeviceInput(device: device)
        guard session.canAddInput(input) else {
            print("[TimelapseSessionManager] ERROR: Cannot add input to session")
            throw TimelapseError.cannotAddInput
        }
        session.addInput(input)
        print("[TimelapseSessionManager] Input added to session")
        
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
            print("[TimelapseSessionManager] ERROR: Cannot add output to session")
            throw TimelapseError.cannotAddOutput
        }
        session.addOutput(output)
        print("[TimelapseSessionManager] Output added to session")
        
        // Configure video connection for the specified orientation
        if let connection = output.connection(with: .video) {
            let angle = videoOrientation.videoRotationAngle
            print("[TimelapseSessionManager] Configuring video connection with rotation angle: \(angle) for orientation: \(videoOrientation.rawValue)")

            if #available(iOS 17.0, *) {
                if connection.isVideoRotationAngleSupported(angle) {
                    connection.videoRotationAngle = angle
                } else {
                    // Fallback to legacy orientation if rotation angle not supported
                    print("[TimelapseSessionManager] Warning: Rotation angle \(angle) not supported, using legacy videoOrientation")
                    if connection.isVideoOrientationSupported {
                        connection.videoOrientation = videoOrientation.avVideoOrientation
                    }
                }
            } else {
                if connection.isVideoOrientationSupported {
                    connection.videoOrientation = videoOrientation.avVideoOrientation
                }
            }

            // Enable video stabilization if available
            if connection.isVideoStabilizationSupported {
                connection.preferredVideoStabilizationMode = .auto
            }

            // Mirror front camera so the output matches real-world orientation
            if self.cameraPosition == .front && connection.isVideoMirroringSupported {
                connection.isVideoMirrored = true
            }
        }
        
        self.captureSession = session
        self.videoOutput = output
        print("[TimelapseSessionManager] setupSession() completed - captureSession is now initialized")
    }
    
    private func getCamera(position: AVCaptureDevice.Position) -> AVCaptureDevice? {
        // Use only the physical 1x wide-angle camera to avoid virtual multi-camera
        // devices where zoomFactor=1.0 maps to the ultra-wide (0.5x) lens
        let discoverySession = AVCaptureDevice.DiscoverySession(
            deviceTypes: [.builtInWideAngleCamera],
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
        print("[TimelapseSessionManager] startCapture() called")
        print("[TimelapseSessionManager] captureSession is \(captureSession == nil ? "NIL" : "initialized")")
        
        guard let session = captureSession else {
            print("[TimelapseSessionManager] ERROR: Capture session is nil - throwing sessionNotInitialized")
            throw TimelapseError.sessionNotInitialized
        }
        
        // Configure audio session for background operation
        print("[TimelapseSessionManager] Configuring audio session...")
        try configureAudioSession()
        print("[TimelapseSessionManager] Audio session configured")
        
        // Start on background queue
        print("[TimelapseSessionManager] Starting capture session on background queue...")
        captureQueue.async {
            if !session.isRunning {
                print("[TimelapseSessionManager] Starting session.startRunning()...")
                session.startRunning()
                print("[TimelapseSessionManager] session.startRunning() completed")
            } else {
                print("[TimelapseSessionManager] Session was already running")
            }
        }
    }
    
    func stopCapture(completion: (() -> Void)? = nil) {
        stopCapture(preStop: nil, completion: completion)
    }

    /// Stop capture with an optional closure that runs on captureQueue *before* stopRunning().
    /// This lets callers flush buffered frames while the session is still active.
    func stopCapture(preStop: (() -> Void)?, completion: (() -> Void)?) {
        print("[TimelapseSessionManager] stopCapture() called")
        captureQueue.async { [weak self] in
            // Execute pre-stop work (e.g. flush frame buffer) while session is still running
            preStop?()

            print("[TimelapseSessionManager] Stopping capture session...")
            self?.captureSession?.stopRunning()
            print("[TimelapseSessionManager] Capture session stopped")
            completion?()
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

        if enabled {
            try device.setTorchModeOn(level: AVCaptureDevice.maxAvailableTorchLevel)
        } else {
            device.torchMode = .off
        }
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
