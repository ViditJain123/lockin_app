import Foundation
import AVFoundation
import VideoToolbox

/// Real-time video encoder using AVAssetWriter
/// Optimized for continuous encoding with zero-wait finalization
class TimelapseEncoder {
    
    // MARK: - Properties
    
    private let outputURL: URL
    private let width: Int
    private let height: Int
    private let fps: Int
    private let codec: AVVideoCodecType
    
    private var assetWriter: AVAssetWriter?
    private var videoInput: AVAssetWriterInput?
    private var pixelBufferAdaptor: AVAssetWriterInputPixelBufferAdaptor?
    
    // Encoding queue
    private let encodingQueue = DispatchQueue(
        label: "com.lockin.timelapse.encoding",
        qos: .userInitiated,
        autoreleaseFrequency: .workItem
    )
    
    // State
    private var isWriting = false
    private var framesWritten: Int64 = 0

    // Thread-safe finalization guard
    private let finalizationLock = DispatchQueue(label: "com.lockin.timelapse.finalization")
    private var isFinalizationInProgress = false
    
    // MARK: - Initialization
    
    init(outputURL: URL, width: Int, height: Int, fps: Int, codec: AVVideoCodecType) throws {
        self.outputURL = outputURL
        self.width = width
        self.height = height
        self.fps = fps
        self.codec = codec
        
        try setupAssetWriter()
    }
    
    private func setupAssetWriter() throws {
        // Remove existing file if present
        try? FileManager.default.removeItem(at: outputURL)
        
        // Create asset writer
        let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
        
        // Configure video settings
        // Using hardware encoder for efficiency
        let videoSettings: [String: Any] = [
            AVVideoCodecKey: codec,
            AVVideoWidthKey: width,
            AVVideoHeightKey: height,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: calculateBitrate(),
                AVVideoExpectedSourceFrameRateKey: fps,
                AVVideoMaxKeyFrameIntervalKey: fps * 2,  // Keyframe every 2 seconds
                AVVideoProfileLevelKey: codec == .hevc ? 
                    kVTProfileLevel_HEVC_Main_AutoLevel as String : 
                    AVVideoProfileLevelH264HighAutoLevel,
                AVVideoAllowFrameReorderingKey: false  // Reduce latency
            ]
        ]
        
        // Create video input
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
        input.expectsMediaDataInRealTime = true  // Critical for live encoding
        input.performsMultiPassEncodingIfSupported = false  // No multi-pass, we're live
        
        // Create pixel buffer adaptor with pool
        let sourceAttributes: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey as String: width,
            kCVPixelBufferHeightKey as String: height,
            kCVPixelBufferMetalCompatibilityKey as String: true
        ]
        
        let adaptor = AVAssetWriterInputPixelBufferAdaptor(
            assetWriterInput: input,
            sourcePixelBufferAttributes: sourceAttributes
        )
        
        // Add input to writer
        guard writer.canAdd(input) else {
            throw TimelapseError.cannotAddOutput
        }
        writer.add(input)
        
        self.assetWriter = writer
        self.videoInput = input
        self.pixelBufferAdaptor = adaptor
        
        // Start writing session
        guard writer.startWriting() else {
            throw TimelapseError.encoderFailed(writer.error?.localizedDescription ?? "Unknown error")
        }
        writer.startSession(atSourceTime: .zero)
        isWriting = true
    }
    
    /// Calculate appropriate bitrate for timelapse
    /// Lower than normal video since we have static scenes
    private func calculateBitrate() -> Int {
        // For 1080x1920 @ 60fps timelapse, aim for ~4 Mbps
        // This is lower than normal video because timelapse has less motion
        // and static scenes compress very efficiently
        let pixelCount = width * height
        let baseBitrate = 4_000_000  // 4 Mbps for 1080p (reduced from 8 Mbps)
        
        if pixelCount > 1920 * 1080 {
            return baseBitrate * 2  // 8 Mbps for higher res
        }
        return baseBitrate
    }
    
    // MARK: - Frame Appending
    
    /// Append a frame to the video
    /// This method is thread-safe and designed for continuous encoding
    func appendFrame(_ pixelBuffer: CVPixelBuffer, presentationTime: CMTime) throws {
        guard isWriting else {
            throw TimelapseError.encoderNotReady
        }
        
        guard let input = videoInput, let adaptor = pixelBufferAdaptor else {
            throw TimelapseError.encoderNotReady
        }
        
        // Check writer status
        guard let writer = assetWriter, writer.status == .writing else {
            if let error = assetWriter?.error {
                throw TimelapseError.encoderFailed(error.localizedDescription)
            }
            throw TimelapseError.encoderFailed("Writer not in writing state")
        }
        
        // Wait for input to be ready
        // Use a short timeout to avoid blocking
        var attempts = 0
        while !input.isReadyForMoreMediaData && attempts < 10 {
            Thread.sleep(forTimeInterval: 0.001)  // 1ms
            attempts += 1
        }
        
        guard input.isReadyForMoreMediaData else {
            // Drop frame if encoder isn't ready
            // This is rare and acceptable for timelapse
            print("[TimelapseEncoder] Dropping frame - encoder not ready")
            return
        }
        
        // Append frame
        let success = adaptor.append(pixelBuffer, withPresentationTime: presentationTime)
        
        if success {
            framesWritten += 1
        } else {
            print("[TimelapseEncoder] Failed to append frame")
        }
    }
    
    // MARK: - Finalization
    
    /// Finalize the video file
    /// This should complete nearly instantly since we've been encoding in real-time
    /// Thread-safe: prevents double finalization from concurrent calls
    func finalize(completion: @escaping (Result<URL, Error>) -> Void) {
        // Thread-safe check and set of finalization flag
        var shouldProceed = false
        finalizationLock.sync {
            if !isFinalizationInProgress && isWriting {
                isFinalizationInProgress = true
                shouldProceed = true
            }
        }

        guard shouldProceed else {
            print("[TimelapseEncoder] Finalization already in progress or encoder not writing")
            completion(.failure(TimelapseError.encoderNotReady))
            return
        }

        isWriting = false

        guard let writer = assetWriter, let input = videoInput else {
            finalizationLock.sync { isFinalizationInProgress = false }
            completion(.failure(TimelapseError.encoderNotReady))
            return
        }

        // Mark input as finished
        input.markAsFinished()

        // Finish writing
        writer.finishWriting { [weak self] in
            guard let self = self else { return }

            // Reset finalization flag
            self.finalizationLock.sync { self.isFinalizationInProgress = false }

            switch writer.status {
            case .completed:
                print("[TimelapseEncoder] Finalized: \(self.framesWritten) frames")
                completion(.success(self.outputURL))

            case .failed:
                let error = writer.error ?? TimelapseError.encoderFailed("Unknown error")
                completion(.failure(error))

            case .cancelled:
                completion(.failure(TimelapseError.encoderFailed("Writing cancelled")))

            default:
                completion(.failure(TimelapseError.encoderFailed("Unexpected state: \(writer.status.rawValue)")))
            }
        }
    }
    
    /// Cancel encoding and clean up
    func cancel() {
        isWriting = false
        assetWriter?.cancelWriting()
        try? FileManager.default.removeItem(at: outputURL)
    }
    
    // MARK: - Stats
    
    var frameCount: Int64 {
        return framesWritten
    }
    
    var estimatedDurationSeconds: Double {
        return Double(framesWritten) / Double(fps)
    }
}
