import Foundation
import AVFoundation
import Photos
import UIKit
import React


/// Production-ready iOS Timelapse Engine
/// Designed for 3-4 hours continuous recording with zero-wait export
///
/// Architecture:
/// - Frame capture at 1fps using AVCaptureVideoDataOutput
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
    internal var sessionManager: TimelapseSessionManager?
    private var segmentManager: TimelapseSegmentManager?
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
    private let bufferThreshold: Int = 2
    
    // Configuration
    private var captureIntervalMs: Double = 6000 // 1 frame every 6s (360x speedup → 1hr = 10s)
    private var outputFps: Int = 60
    private var codec: AVVideoCodecType = .h264
    private var saveToGallery: Bool = true
    private var cameraPosition: AVCaptureDevice.Position = .back

    // Timer position (percentage 0-1)
    private var timerPositionX: CGFloat = 0.85
    private var timerPositionY: CGFloat = 0.75

    // Timer filter type
    private var timerFilter: String = "minimal"

    // Timer scale
    private var timerScale: CGFloat = 1.0

    // Video orientation
    private var videoOrientation: VideoOrientation = .portrait

    // Threading
    private let stateQueue = DispatchQueue(label: "com.lockin.timelapse.state", qos: .userInitiated)

    // Finalization guard to prevent race conditions
    private var isFinalizationInProgress = false
    
    // MARK: - React Native Event Emitter
    
    override init() {
        super.init()
        TimelapseEngine._shared = self

        // Listen for background-triggered segment rotation
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleForceSegmentRotation),
            name: .timelapseForceSegmentRotation,
            object: nil
        )
    }

    @objc private func handleForceSegmentRotation() {
        stateQueue.async { [weak self] in
            guard let self = self, self.state == .recording else { return }
            self.segmentManager?.rotateSegmentNow()
            print("[TimelapseEngine] Forced segment rotation for background entry")
        }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
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

            // Prevent concurrent finalization (e.g., double-tap or background handler race)
            guard !self.isFinalizationInProgress else {
                print("[TimelapseEngine] Finalization already in progress, ignoring duplicate stop")
                rejecter("FINALIZE_IN_PROGRESS", "Finalization is already in progress", nil)
                return
            }
            self.isFinalizationInProgress = true

            // callOnce guard — ensures the promise fires exactly once
            let promiseLock = NSLock()
            var promiseFired = false

            let safeResolve: RCTPromiseResolveBlock = { value in
                promiseLock.lock()
                guard !promiseFired else { promiseLock.unlock(); return }
                promiseFired = true
                promiseLock.unlock()
                resolver(value)
            }
            let safeReject: RCTPromiseRejectBlock = { code, message, error in
                promiseLock.lock()
                guard !promiseFired else { promiseLock.unlock(); return }
                promiseFired = true
                promiseLock.unlock()
                rejecter(code, message, error)
            }

            // 25s timeout safety net (fires before JS's 30s timeout)
            let timeoutWork = DispatchWorkItem { [weak self] in
                print("[TimelapseEngine] stopTimelapse timed out after 25s")
                safeReject("STOP_TIMEOUT", "Stop timelapse timed out", nil)
                self?.stateQueue.async {
                    self?.state = .error
                    self?.isFinalizationInProgress = false
                    self?.cleanup()
                }
            }
            DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + 25, execute: timeoutWork)

            self.state = .finalizing

            // Guard sessionManager nil — if cleanup() already ran, reject immediately
            guard let sessionManager = self.sessionManager else {
                print("[TimelapseEngine] sessionManager is nil at stop")
                self.state = .error
                self.isFinalizationInProgress = false
                timeoutWork.cancel()
                safeReject("SESSION_NIL", "Session manager was deallocated", nil)
                self.cleanup()
                return
            }

            // Stop capture: flush buffered frames on captureQueue, then finalize
            // preStop runs before stopRunning() so the session is still active
            sessionManager.stopCapture(preStop: { [weak self] in
                self?.flushFrameBuffer()
            }, completion: { [weak self] in
                guard let self = self else {
                    timeoutWork.cancel()
                    safeReject("ENGINE_DEALLOCATED", "TimelapseEngine deallocated during stop", nil)
                    return
                }

                // Check for nil segment manager - reject promise if it doesn't exist
                guard let segmentManager = self.segmentManager else {
                    print("[TimelapseEngine] Segment manager is nil, cannot finalize")
                    self.stateQueue.async {
                        self.state = .error
                        self.isFinalizationInProgress = false
                    }
                    timeoutWork.cancel()
                    safeReject("ENCODER_NIL", "Segment manager was not initialized", nil)
                    self.cleanup()
                    return
                }

                // Finalize segments and concatenate — safe now that capture has stopped
                segmentManager.finalize { [weak self] result in
                    guard let self = self else {
                        timeoutWork.cancel()
                        safeReject("ENGINE_DEALLOCATED", "TimelapseEngine deallocated during finalization", nil)
                        return
                    }

                    switch result {
                    case .success(let outputURL):
                        if self.saveToGallery {
                            self.photoLibraryManager?.saveToGallery(outputURL) { saveResult in
                                switch saveResult {
                                case .success(let assetId):
                                    self.stateQueue.async {
                                        self.state = .idle
                                        self.isFinalizationInProgress = false
                                    }
                                    let response: [String: Any] = [
                                        "uri": outputURL.absoluteString,
                                        "assetId": assetId,
                                        "frameCount": self.frameCount,
                                        "durationSeconds": self.getRecordingDuration()
                                    ]
                                    self.sendEvent(withName: "onTimelapseComplete", body: response)
                                    timeoutWork.cancel()
                                    safeResolve(response)
                                    self.cleanup()

                                case .failure(let error):
                                    self.stateQueue.async {
                                        self.state = .error
                                        self.isFinalizationInProgress = false
                                    }
                                    timeoutWork.cancel()
                                    safeReject("GALLERY_SAVE_FAILED", error.localizedDescription, error)
                                    self.cleanup()
                                }
                            }
                        } else {
                            self.stateQueue.async {
                                self.state = .idle
                                self.isFinalizationInProgress = false
                            }
                            let response: [String: Any] = [
                                "uri": outputURL.absoluteString,
                                "frameCount": self.frameCount,
                                "durationSeconds": self.getRecordingDuration()
                            ]
                            self.sendEvent(withName: "onTimelapseComplete", body: response)
                            timeoutWork.cancel()
                            safeResolve(response)
                            self.cleanup()
                        }

                    case .failure(let error):
                        self.stateQueue.async {
                            self.state = .error
                            self.isFinalizationInProgress = false
                        }
                        timeoutWork.cancel()
                        safeReject("FINALIZE_FAILED", error.localizedDescription, error)
                        self.cleanup()
                    }
                }
            })
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
        // CallKit removed per Apple Guideline 5.0 (MIIT requirements for China).
        // Call detection was a UX guard, not a core feature.
        resolver(false)
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
        if let posX = options["timerPositionX"] as? Double {
            timerPositionX = CGFloat(posX)
        }
        if let posY = options["timerPositionY"] as? Double {
            timerPositionY = CGFloat(posY)
        }
        if let filter = options["timerFilter"] as? String {
            timerFilter = filter
        }
        if let scale = options["timerScale"] as? Double {
            timerScale = CGFloat(max(1.0, min(scale, 2.5)))
        }
        if let orientationStr = options["orientation"] as? String {
            videoOrientation = VideoOrientation.from(orientationStr)
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
        
        // Initialize segment manager (crash-resilient segmented recording)
        print("[TimelapseEngine] Initializing segment manager with orientation: \(videoOrientation.rawValue)")
        segmentManager = try TimelapseSegmentManager(
            width: videoOrientation.outputWidth,
            height: videoOrientation.outputHeight,
            fps: outputFps,
            codec: codec
        )
        segmentManager?.delegate = self
        print("[TimelapseEngine] Segment manager initialized successfully")
        
        // Initialize frame processor with encoder callback
        print("[TimelapseEngine] Initializing frame processor...")
        frameProcessor = TimelapseFrameProcessor(
            captureIntervalMs: captureIntervalMs,
            timerPosition: CGPoint(x: timerPositionX, y: timerPositionY),
            timerFilter: timerFilter,
            timerScale: timerScale,
            orientation: videoOrientation
        )
        frameProcessor?.recordingStartTime = CFAbsoluteTimeGetCurrent()
        frameProcessor?.onFrameReady = { [weak self] pixelBuffer, timestamp in
            self?.processFrame(pixelBuffer, timestamp: timestamp)
        }
        print("[TimelapseEngine] Frame processor initialized")
        
        // Initialize session manager
        // IMPORTANT: We must use the convenience init that takes a position parameter
        // The default init() does NOT setup the capture session!
        print("[TimelapseEngine] Initializing session manager with position: \(cameraPosition == .back ? "back" : "front"), orientation: \(videoOrientation.rawValue)...")
        sessionManager = try TimelapseSessionManager(position: cameraPosition, orientation: videoOrientation)
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

                    // When we have enough frames, encode all except first (skip first)
                    if frameBuffer.count >= bufferThreshold {
                        isBufferingPhase = false

                        // Encode frames starting at index 1 (skip index 0)
                        for i in 1..<frameBuffer.count {
                            let (bufferedPixelBuffer, _) = frameBuffer[i]
                            let presentationTime = CMTime(
                                value: frameCount * Int64(600 / outputFps),
                                timescale: 600
                            )
                            try segmentManager?.appendFrame(bufferedPixelBuffer, presentationTime: presentationTime)
                            frameCount += 1
                        }

                        // Clear buffer
                        frameBuffer.removeAll()

                        // Emit progress
                        if frameCount % 2 == 0 || frameCount == bufferThreshold - 1 {
                            emitProgressEvent()
                        }
                    }
                } else {
                    // Normal streaming mode
                    let presentationTime = CMTime(
                        value: frameCount * Int64(600 / outputFps),
                        timescale: 600
                    )
                    try segmentManager?.appendFrame(pixelBuffer, presentationTime: presentationTime)
                    frameCount += 1

                    if frameCount % 2 == 0 {
                        emitProgressEvent()
                    }
                }
            } catch {
                emitError("Frame encoding failed: \(error.localizedDescription)")
            }
        }
    }
    
    /// Flush any buffered frames to the encoder before stopping.
    /// Must be called on captureQueue (via preStop) so it doesn't race with processFrame.
    private func flushFrameBuffer() {
        guard isBufferingPhase, !frameBuffer.isEmpty else { return }

        isBufferingPhase = false

        // If only 1 frame in buffer, encode it (don't skip index 0 — short recordings need every frame)
        let startIndex = frameBuffer.count >= bufferThreshold ? 1 : 0

        for i in startIndex..<frameBuffer.count {
            let (bufferedPixelBuffer, _) = frameBuffer[i]
            let presentationTime = CMTime(
                value: frameCount * Int64(600 / outputFps),
                timescale: 600
            )
            do {
                try segmentManager?.appendFrame(bufferedPixelBuffer, presentationTime: presentationTime)
                frameCount += 1
            } catch {
                print("[TimelapseEngine] flushFrameBuffer failed at frame \(i): \(error)")
            }
        }

        frameBuffer.removeAll()
        print("[TimelapseEngine] Flushed frame buffer (\(frameCount) total frames)")
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
    
    // MARK: - Crash Recovery API

    @objc func checkForRecoverableRecordings(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.global(qos: .userInitiated).async {
            // Also clean up stale sessions (> 7 days)
            TimelapseCrashRecoveryManager.cleanupStaleSessionsIfNeeded()

            let sessions = TimelapseCrashRecoveryManager.findRecoverableSessions()
            let result = sessions.map { session -> [String: Any] in
                return [
                    "sessionId": session.sessionId,
                    "startedAt": session.startedAt,
                    "segmentCount": session.segmentCount,
                    "estimatedFrames": session.estimatedFrames,
                    "estimatedDurationSeconds": session.estimatedDurationSeconds,
                ]
            }
            resolver(result)
        }
    }

    @objc func recoverRecording(_ sessionId: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        TimelapseCrashRecoveryManager.recover(sessionId: sessionId) { result in
            switch result {
            case .success(let url):
                resolver([
                    "uri": url.absoluteString,
                    "sessionId": sessionId,
                ])
            case .failure(let error):
                rejecter("RECOVERY_FAILED", error.localizedDescription, error)
            }
        }
    }

    @objc func dismissRecovery(_ sessionId: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        TimelapseCrashRecoveryManager.dismiss(sessionId: sessionId)
        resolver(["success": true])
    }

    private func cleanup() {
        stabilityManager?.stopMonitoring()
        stabilityManager = nil

        backgroundHandler?.endBackgroundTask()
        backgroundHandler = nil

        sessionManager = nil
        segmentManager = nil
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

            // Prevent race with user-initiated stop or background handler
            guard !self.isFinalizationInProgress else {
                print("[TimelapseEngine] Stability stop but finalization already in progress")
                return
            }
            self.isFinalizationInProgress = true

            self.state = .finalizing
            self.emitError("Recording stopped due to system error: \(error.localizedDescription)")

            // Guard sessionManager nil
            guard let sessionManager = self.sessionManager else {
                self.isFinalizationInProgress = false
                self.cleanup()
                return
            }

            // Stop capture first, flush buffer, then attempt to save partial recording
            sessionManager.stopCapture(preStop: { [weak self] in
                self?.flushFrameBuffer()
            }, completion: { [weak self] in
                guard let self = self else { return }

                // Guard segmentManager nil
                guard let segmentManager = self.segmentManager else {
                    self.stateQueue.async {
                        self.isFinalizationInProgress = false
                    }
                    self.cleanup()
                    return
                }

                segmentManager.finalize { [weak self] _ in
                    guard let self = self else { return }
                    self.stateQueue.async {
                        self.isFinalizationInProgress = false
                    }
                    self.cleanup()
                }
            })
        }
    }
}

// MARK: - Background Handler Delegate

extension TimelapseEngine: TimelapseBackgroundHandlerDelegate {
    func backgroundHandlerTaskExpiring(_ handler: TimelapseBackgroundHandler) {
        stateQueue.async { [weak self] in
            guard let self = self, self.state == .recording else { return }

            // Prevent race condition with user-initiated stop
            guard !self.isFinalizationInProgress else {
                print("[TimelapseEngine] Background task expiring but finalization already in progress")
                return
            }
            self.isFinalizationInProgress = true

            self.emitError("Background time expiring - finalizing recording")

            // Force finalize
            self.state = .finalizing

            // Guard sessionManager nil
            guard let sessionManager = self.sessionManager else {
                self.isFinalizationInProgress = false
                self.cleanup()
                return
            }

            sessionManager.stopCapture(preStop: { [weak self] in
                self?.flushFrameBuffer()
            }, completion: { [weak self] in
                guard let self = self else { return }

                // Check for nil segment manager
                guard let segmentManager = self.segmentManager else {
                    print("[TimelapseEngine] Segment manager is nil during background expiry")
                    self.stateQueue.async {
                        self.isFinalizationInProgress = false
                    }
                    self.cleanup()
                    return
                }

                segmentManager.finalize { [weak self] result in
                    guard let self = self else { return }
                    self.stateQueue.async {
                        self.isFinalizationInProgress = false
                    }
                    switch result {
                    case .success(let url):
                        self.photoLibraryManager?.saveToGallery(url) { _ in
                            self.cleanup()
                        }
                    case .failure:
                        self.cleanup()
                    }
                }
            })
        }
    }
}

// MARK: - Segment Manager Delegate

extension TimelapseEngine: TimelapseSegmentManagerDelegate {
    func segmentManager(_ manager: TimelapseSegmentManager, didCompleteSegment index: Int) {
        print("[TimelapseEngine] Segment \(index) completed successfully")
    }

    func segmentManager(_ manager: TimelapseSegmentManager, didFailWithError error: Error) {
        emitError("Segment error: \(error.localizedDescription)")
    }
}
