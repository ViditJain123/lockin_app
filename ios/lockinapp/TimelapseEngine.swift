import Foundation
import AVFoundation
import Photos
import UIKit
import React
import CallKit

/// Production-ready iOS Timelapse Engine
/// Designed for 3-4 hours continuous recording with zero-wait export
///
/// Architecture:
/// - Frame capture at 2fps using AVCaptureVideoDataOutput
/// - Real-time encoding to H.264/HEVC at 60fps using AVAssetWriter
/// - Single-frame memory model (never accumulates frames)
/// - Background task support for screen lock scenarios
/// - Direct save to Photos library on stop
@objc(TimelapseEngine)
class TimelapseEngine: RCTEventEmitter {
    
    // MARK: - Singleton
    
    private static var _shared: TimelapseEngine?
    @objc static var shared: TimelapseEngine {
        guard let instance = _shared else {
            fatalError("TimelapseEngine not initialized. Call from React Native first.")
        }
        return instance
    }
    
    // MARK: - Call Detection
    
    private let callObserver = CXCallObserver()
    
    // MARK: - State Machine
    
    enum State: String {
        case idle = "idle"
        case preparing = "preparing"
        case recording = "recording"
        case finalizing = "finalizing"
        case error = "error"
    }
    
    // MARK: - Properties
    
    private(set) var state: State = .idle
    private var sessionManager: TimelapseSessionManager?
    private var encoder: TimelapseEncoder?
    private var frameProcessor: TimelapseFrameProcessor?
    private var stabilityManager: TimelapseStabilityManager?
    private var backgroundHandler: TimelapseBackgroundHandler?
    private var photoLibraryManager: TimelapsePhotoLibraryManager?
    
    // Recording stats
    private var frameCount: Int64 = 0
    private var recordingStartTime: Date?

    // Frame buffering for first-frame removal
    private var frameBuffer: [(CVPixelBuffer, CMTime)] = []
    private var isBufferingPhase: Bool = true
    private let bufferThreshold: Int = 5
    
    // Configuration
    private var captureIntervalMs: Double = 500 // 2fps default
    private var outputFps: Int = 60
    private var codec: AVVideoCodecType = .h264
    private var saveToGallery: Bool = true
    private var cameraPosition: AVCaptureDevice.Position = .back
    private var targetVideoSeconds: Double = 30 // Target video duration for adaptive capture
    
    // Threading
    private let stateQueue = DispatchQueue(label: "com.lockin.timelapse.state", qos: .userInitiated)
    
    // MARK: - React Native Event Emitter
    
    override init() {
        super.init()
        TimelapseEngine._shared = self
    }
    
    @objc override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc override func supportedEvents() -> [String] {
        return ["onTimelapseProgress", "onTimelapseError", "onTimelapseComplete"]
    }
    
    // MARK: - Public API
    
    /// Start timelapse recording with configuration options
    @objc func startTimelapse(_ options: NSDictionary, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        stateQueue.async { [weak self] in
            guard let self = self else { return }
            
            guard self.state == .idle else {
                rejecter("ALREADY_RECORDING", "Timelapse recording is already in progress", nil)
                return
            }
            
            self.state = .preparing
            
            // Parse options
            self.parseOptions(options)
            
            // Check camera permission
            self.checkCameraPermission { granted in
                if !granted {
                    self.state = .idle
                    rejecter("CAMERA_DENIED", "Camera permission is required for timelapse recording", nil)
                    return
                }
                
                // Initialize components
                do {
                    try self.initializeRecording()
                    self.state = .recording
                    self.recordingStartTime = Date()
                    resolver(["success": true])
                } catch {
                    self.state = .error
                    self.cleanup()
                    rejecter("INIT_FAILED", error.localizedDescription, error)
                }
            }
        }
    }
    
    /// Stop timelapse recording and finalize video
    @objc func stopTimelapse(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        stateQueue.async { [weak self] in
            guard let self = self else { return }
            
            guard self.state == .recording else {
                rejecter("NOT_RECORDING", "No timelapse recording in progress", nil)
                return
            }
            
            self.state = .finalizing
            
            // Stop capture
            self.sessionManager?.stopCapture()
            
            // Finalize encoder
            self.encoder?.finalize { [weak self] result in
                guard let self = self else { return }
                
                switch result {
                case .success(let outputURL):
                    if self.saveToGallery {
                        self.photoLibraryManager?.saveToGallery(outputURL) { saveResult in
                            switch saveResult {
                            case .success(let assetId):
                                self.state = .idle
                                let response: [String: Any] = [
                                    "uri": outputURL.absoluteString,
                                    "assetId": assetId,
                                    "frameCount": self.frameCount,
                                    "durationSeconds": self.getRecordingDuration()
                                ]
                                self.sendEvent(withName: "onTimelapseComplete", body: response)
                                resolver(response)
                                self.cleanup()
                                
                            case .failure(let error):
                                self.state = .error
                                rejecter("GALLERY_SAVE_FAILED", error.localizedDescription, error)
                                self.cleanup()
                            }
                        }
                    } else {
                        self.state = .idle
                        let response: [String: Any] = [
                            "uri": outputURL.absoluteString,
                            "frameCount": self.frameCount,
                            "durationSeconds": self.getRecordingDuration()
                        ]
                        self.sendEvent(withName: "onTimelapseComplete", body: response)
                        resolver(response)
                        self.cleanup()
                    }
                    
                case .failure(let error):
                    self.state = .error
                    rejecter("FINALIZE_FAILED", error.localizedDescription, error)
                    self.cleanup()
                }
            }
        }
    }
    
    /// Get current recording state
    @objc func getRecordingState(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        stateQueue.async { [weak self] in
            guard let self = self else { return }
            
            let response: [String: Any] = [
                "state": self.state.rawValue,
                "isRecording": self.state == .recording,
                "frameCount": self.frameCount,
                "durationSeconds": self.getRecordingDuration(),
                "estimatedOutputDuration": self.getEstimatedOutputDuration()
            ]
            resolver(response)
        }
    }
    
    /// Check if there's a phone call in progress
    @objc func isCallInProgress(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        let hasActiveCall = callObserver.calls.contains { call in
            // Check if any call is in a connected state (not ended or outgoing)
            return !call.hasEnded && (call.hasConnected || call.isOutgoing)
        }
        resolver(hasActiveCall)
    }
    
    // MARK: - Private Methods
    
    private func parseOptions(_ options: NSDictionary) {
        if let interval = options["captureIntervalMs"] as? Double {
            captureIntervalMs = interval
        }
        if let fps = options["outputFps"] as? Int {
            outputFps = fps
        }
        if let codecStr = options["codec"] as? String {
            codec = codecStr == "hevc" ? .hevc : .h264
        }
        if let save = options["saveToGallery"] as? Bool {
            saveToGallery = save
        }
        if let positionStr = options["cameraPosition"] as? String {
            cameraPosition = positionStr == "front" ? .front : .back
        }
        if let target = options["targetVideoSeconds"] as? Double {
            targetVideoSeconds = target
        }
    }
    
    private func checkCameraPermission(completion: @escaping (Bool) -> Void) {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            completion(true)
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    completion(granted)
                }
            }
        default:
            completion(false)
        }
    }
    
    private func initializeRecording() throws {
        print("[TimelapseEngine] initializeRecording() started")
        
        // Reset state
        frameCount = 0
        
        // Initialize stability manager first (for monitoring)
        print("[TimelapseEngine] Initializing stability manager...")
        stabilityManager = TimelapseStabilityManager()
        stabilityManager?.delegate = self
        stabilityManager?.startMonitoring()
        print("[TimelapseEngine] Stability manager initialized")
        
        // Initialize background handler
        print("[TimelapseEngine] Initializing background handler...")
        backgroundHandler = TimelapseBackgroundHandler()
        backgroundHandler?.delegate = self
        backgroundHandler?.startBackgroundTask()
        print("[TimelapseEngine] Background handler initialized")
        
        // Initialize photo library manager
        print("[TimelapseEngine] Initializing photo library manager...")
        photoLibraryManager = TimelapsePhotoLibraryManager()
        print("[TimelapseEngine] Photo library manager initialized")
        
        // Create output URL
        let outputURL = generateOutputURL()
        print("[TimelapseEngine] Output URL: \(outputURL.absoluteString)")
        
        // Initialize encoder
        print("[TimelapseEngine] Initializing encoder...")
        encoder = try TimelapseEncoder(
            outputURL: outputURL,
            width: 1080,
            height: 1920,
            fps: outputFps,
            codec: codec
        )
        print("[TimelapseEngine] Encoder initialized successfully")
        
        // Initialize frame processor with encoder callback
        print("[TimelapseEngine] Initializing frame processor...")
        frameProcessor = TimelapseFrameProcessor(
            captureIntervalMs: captureIntervalMs,
            targetVideoSeconds: targetVideoSeconds,
            outputFps: outputFps
        )
        frameProcessor?.recordingStartTime = CFAbsoluteTimeGetCurrent()
        frameProcessor?.onFrameReady = { [weak self] pixelBuffer, timestamp in
            self?.processFrame(pixelBuffer, timestamp: timestamp)
        }
        print("[TimelapseEngine] Frame processor initialized")
        
        // Initialize session manager
        // IMPORTANT: We must use the convenience init that takes a position parameter
        // The default init() does NOT setup the capture session!
        print("[TimelapseEngine] Initializing session manager with position: \(cameraPosition == .back ? "back" : "front")...")
        sessionManager = try TimelapseSessionManager(position: cameraPosition)
        print("[TimelapseEngine] Session manager initialized, setting frame processor...")
        sessionManager?.frameProcessor = frameProcessor
        print("[TimelapseEngine] Frame processor assigned to session manager")
        
        // Start capture
        print("[TimelapseEngine] Starting capture...")
        try sessionManager?.startCapture()
        print("[TimelapseEngine] Capture started successfully")
        print("[TimelapseEngine] initializeRecording() completed successfully")
    }
    
    private func processFrame(_ pixelBuffer: CVPixelBuffer, timestamp: CMTime) {
        // CRITICAL: This runs on capture queue
        // Frame must be processed and released immediately

        autoreleasepool {
            do {
                if isBufferingPhase {
                    // Copy pixel buffer for retention in buffer
                    var copiedBuffer: CVPixelBuffer?
                    let status = CVPixelBufferCreate(
                        kCFAllocatorDefault,
                        CVPixelBufferGetWidth(pixelBuffer),
                        CVPixelBufferGetHeight(pixelBuffer),
                        CVPixelBufferGetPixelFormatType(pixelBuffer),
                        nil,
                        &copiedBuffer
                    )

                    if status == kCVReturnSuccess, let buffer = copiedBuffer {
                        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
                        CVPixelBufferLockBaseAddress(buffer, [])

                        let src = CVPixelBufferGetBaseAddress(pixelBuffer)
                        let dst = CVPixelBufferGetBaseAddress(buffer)
                        let size = CVPixelBufferGetDataSize(pixelBuffer)
                        memcpy(dst, src, size)

                        CVPixelBufferUnlockBaseAddress(buffer, [])
                        CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)

                        frameBuffer.append((buffer, timestamp))
                    }

                    // When we have 5 frames, encode frames 2-5 (skip first)
                    if frameBuffer.count >= bufferThreshold {
                        isBufferingPhase = false

                        // Encode frames at indices 1-4 (skip index 0)
                        for i in 1..<frameBuffer.count {
                            let (bufferedPixelBuffer, _) = frameBuffer[i]
                            let presentationTime = CMTime(
                                value: frameCount * Int64(600 / outputFps),
                                timescale: 600
                            )
                            try encoder?.appendFrame(bufferedPixelBuffer, presentationTime: presentationTime)
                            frameCount += 1
                        }

                        // Clear buffer
                        frameBuffer.removeAll()

                        // Emit progress
                        if frameCount % 10 == 0 || frameCount == bufferThreshold - 1 {
                            emitProgressEvent()
                        }
                    }
                } else {
                    // Normal streaming mode
                    let presentationTime = CMTime(
                        value: frameCount * Int64(600 / outputFps),
                        timescale: 600
                    )
                    try encoder?.appendFrame(pixelBuffer, presentationTime: presentationTime)
                    frameCount += 1

                    if frameCount % 10 == 0 {
                        emitProgressEvent()
                    }
                }
            } catch {
                emitError("Frame encoding failed: \(error.localizedDescription)")
            }
        }
    }
    
    private func emitProgressEvent() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            let progress: [String: Any] = [
                "frameCount": self.frameCount,
                "durationSeconds": self.getRecordingDuration(),
                "estimatedOutputDuration": self.getEstimatedOutputDuration()
            ]
            self.sendEvent(withName: "onTimelapseProgress", body: progress)
        }
    }
    
    private func emitError(_ message: String) {
        DispatchQueue.main.async { [weak self] in
            self?.sendEvent(withName: "onTimelapseError", body: ["message": message])
        }
    }
    
    private func getRecordingDuration() -> Double {
        guard let startTime = recordingStartTime else { return 0 }
        return Date().timeIntervalSince(startTime)
    }
    
    private func getEstimatedOutputDuration() -> Double {
        // 2fps capture with 30x speedup to 60fps
        // Real duration / (outputFps / 2)
        return Double(frameCount) / Double(outputFps)
    }
    
    private func generateOutputURL() -> URL {
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = "timelapse_\(Int(Date().timeIntervalSince1970)).mp4"
        return tempDir.appendingPathComponent(fileName)
    }
    
    private func cleanup() {
        stabilityManager?.stopMonitoring()
        stabilityManager = nil

        backgroundHandler?.endBackgroundTask()
        backgroundHandler = nil

        sessionManager = nil
        encoder = nil
        frameProcessor = nil
        photoLibraryManager = nil

        frameCount = 0
        recordingStartTime = nil

        // Reset frame buffer
        frameBuffer.removeAll()
        isBufferingPhase = true
    }
}

// MARK: - Stability Manager Delegate

extension TimelapseEngine: TimelapseStabilityManagerDelegate {
    func stabilityManager(_ manager: TimelapseStabilityManager, didEncounterWarning warning: TimelapseStabilityManager.Warning) {
        switch warning {
        case .lowMemory:
            emitError("Low memory warning - recording may be affected")
        case .thermalCritical:
            emitError("Device is overheating - consider stopping recording")
        case .diskSpaceLow:
            emitError("Low disk space - recording may stop soon")
        }
    }
    
    func stabilityManager(_ manager: TimelapseStabilityManager, shouldStopDueToError error: Error) {
        stateQueue.async { [weak self] in
            guard let self = self, self.state == .recording else { return }
            
            self.state = .error
            self.emitError("Recording stopped due to system error: \(error.localizedDescription)")
            
            // Attempt to save partial recording
            self.encoder?.finalize { _ in
                self.cleanup()
            }
        }
    }
}

// MARK: - Background Handler Delegate

extension TimelapseEngine: TimelapseBackgroundHandlerDelegate {
    func backgroundHandlerTaskExpiring(_ handler: TimelapseBackgroundHandler) {
        stateQueue.async { [weak self] in
            guard let self = self, self.state == .recording else { return }
            
            self.emitError("Background time expiring - finalizing recording")
            
            // Force finalize
            self.state = .finalizing
            self.sessionManager?.stopCapture()
            self.encoder?.finalize { [weak self] result in
                switch result {
                case .success(let url):
                    self?.photoLibraryManager?.saveToGallery(url) { _ in
                        self?.cleanup()
                    }
                case .failure:
                    self?.cleanup()
                }
            }
        }
    }
}
