import Foundation
import AVFoundation

/// Delegate for segment lifecycle events
protocol TimelapseSegmentManagerDelegate: AnyObject {
    func segmentManager(_ manager: TimelapseSegmentManager, didCompleteSegment index: Int)
    func segmentManager(_ manager: TimelapseSegmentManager, didFailWithError error: Error)
}

/// Manages segmented recording for crash-resilient timelapse.
/// Sits between TimelapseEngine and TimelapseEncoder.
/// Creates a new segment every ~3 minutes of wall-clock time.
/// Each segment is independently finalized and playable.
class TimelapseSegmentManager {

    // MARK: - Types

    struct SegmentInfo: Codable {
        var index: Int
        var fileName: String
        var frameCount: Int
        var status: String  // "recording" | "finalized" | "failed"
    }

    struct Manifest: Codable {
        var sessionId: String
        var startedAt: String
        var width: Int
        var height: Int
        var fps: Int
        var codec: String
        var segments: [SegmentInfo]
        var totalFrameCount: Int
    }

    // MARK: - Properties

    weak var delegate: TimelapseSegmentManagerDelegate?

    private let sessionId: String
    private let sessionDir: URL
    private let width: Int
    private let height: Int
    private let fps: Int
    private let codec: AVVideoCodecType

    private var currentEncoder: TimelapseEncoder?
    private var currentSegmentIndex: Int = 0
    private var currentSegmentFrameCount: Int = 0
    private var currentSegmentStartTime: Date = Date()

    private var manifest: Manifest
    private var totalFrameCount: Int = 0

    /// Lock to prevent frame drops during rotation
    private let rotationLock = NSLock()

    /// Wall-clock seconds before rotating to a new segment
    private let segmentDurationSeconds: TimeInterval = 180  // 3 minutes

    /// Serial queue for manifest writes and async finalization
    private let managerQueue = DispatchQueue(label: "com.lockin.timelapse.segmentManager", qos: .userInitiated)

    /// Tracks in-flight segment finalizations from rotateSegment() so finalize() can wait for them
    private let pendingFinalizationGroup = DispatchGroup()

    // MARK: - Class Methods

    /// Base directory for all timelapse sessions
    static var sessionsBaseDir: URL {
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        return appSupport.appendingPathComponent("timelapse_sessions", isDirectory: true)
    }

    // MARK: - Initialization

    /// Initialize a new segmented recording session.
    init(width: Int, height: Int, fps: Int, codec: AVVideoCodecType) throws {
        self.width = width
        self.height = height
        self.fps = fps
        self.codec = codec

        // Generate unique session ID
        let timestamp = Int(Date().timeIntervalSince1970)
        let random = String(format: "%08x", arc4random())
        self.sessionId = "session_\(timestamp)_\(random)"

        // Create session directory
        self.sessionDir = Self.sessionsBaseDir.appendingPathComponent(sessionId, isDirectory: true)
        try FileManager.default.createDirectory(at: sessionDir, withIntermediateDirectories: true)

        // Initialize manifest
        let formatter = ISO8601DateFormatter()
        self.manifest = Manifest(
            sessionId: sessionId,
            startedAt: formatter.string(from: Date()),
            width: width,
            height: height,
            fps: fps,
            codec: codec == .hevc ? "hevc" : "h264",
            segments: [],
            totalFrameCount: 0
        )

        // Create first segment encoder
        self.currentEncoder = try createEncoder(forSegmentIndex: 0)
        self.currentSegmentStartTime = Date()

        // Add initial segment to manifest
        let segmentInfo = SegmentInfo(
            index: 0,
            fileName: segmentFileName(for: 0),
            frameCount: 0,
            status: "recording"
        )
        manifest.segments.append(segmentInfo)
        writeManifest()

        print("[SegmentManager] Session \(sessionId) started in \(sessionDir.path)")
    }

    // MARK: - Frame Appending

    /// Append a frame, automatically rotating segments when needed.
    func appendFrame(_ pixelBuffer: CVPixelBuffer, presentationTime: CMTime) throws {
        rotationLock.lock()

        // Check if we need to rotate
        let elapsed = Date().timeIntervalSince(currentSegmentStartTime)
        if elapsed >= segmentDurationSeconds && currentSegmentFrameCount > 0 {
            rotationLock.unlock()
            try rotateSegment()
            rotationLock.lock()
        }

        guard let encoder = currentEncoder else {
            rotationLock.unlock()
            throw TimelapseError.encoderNotReady
        }

        // Presentation time resets to zero for each segment
        let segmentTime = CMTime(
            value: Int64(currentSegmentFrameCount) * Int64(600 / fps),
            timescale: 600
        )

        do {
            try encoder.appendFrame(pixelBuffer, presentationTime: segmentTime)
            currentSegmentFrameCount += 1
            totalFrameCount += 1
        } catch {
            rotationLock.unlock()
            throw error
        }

        rotationLock.unlock()
    }

    // MARK: - Segment Rotation

    /// Rotate to a new segment. Creates new encoder before finalizing old one (no frame drops).
    private func rotateSegment() throws {
        rotationLock.lock()

        let oldEncoder = currentEncoder
        let oldIndex = currentSegmentIndex
        let oldFrameCount = currentSegmentFrameCount

        let newIndex = currentSegmentIndex + 1

        // Create new encoder FIRST (so frames can continue flowing)
        let newEncoder: TimelapseEncoder
        do {
            newEncoder = try createEncoder(forSegmentIndex: newIndex)
        } catch {
            rotationLock.unlock()
            throw error
        }

        // Swap — new frames go to new encoder
        currentEncoder = newEncoder
        currentSegmentIndex = newIndex
        currentSegmentFrameCount = 0
        currentSegmentStartTime = Date()

        // Add new segment to manifest
        let newSegmentInfo = SegmentInfo(
            index: newIndex,
            fileName: segmentFileName(for: newIndex),
            frameCount: 0,
            status: "recording"
        )
        manifest.segments.append(newSegmentInfo)

        rotationLock.unlock()

        // Finalize old encoder asynchronously (non-blocking)
        let group = pendingFinalizationGroup
        group.enter()
        managerQueue.async { [weak self] in
            guard let self = self else {
                group.leave()
                return
            }

            guard let encoder = oldEncoder else {
                group.leave()
                return
            }

            encoder.finalize { [weak self] result in
                _ = encoder  // prevent premature deallocation — keep strong ref until completion fires
                defer { group.leave() }
                guard let self = self else { return }

                switch result {
                case .success:
                    // Update manifest: mark old segment as finalized
                    self.rotationLock.lock()
                    if oldIndex < self.manifest.segments.count {
                        self.manifest.segments[oldIndex].status = "finalized"
                        self.manifest.segments[oldIndex].frameCount = oldFrameCount
                        self.manifest.totalFrameCount = self.totalFrameCount
                    }
                    self.rotationLock.unlock()
                    self.writeManifest()

                    print("[SegmentManager] Segment \(oldIndex) finalized (\(oldFrameCount) frames)")
                    self.delegate?.segmentManager(self, didCompleteSegment: oldIndex)

                case .failure(let error):
                    // Mark as failed
                    self.rotationLock.lock()
                    if oldIndex < self.manifest.segments.count {
                        self.manifest.segments[oldIndex].status = "failed"
                        self.manifest.segments[oldIndex].frameCount = oldFrameCount
                    }
                    self.rotationLock.unlock()
                    self.writeManifest()

                    print("[SegmentManager] Segment \(oldIndex) finalization failed: \(error)")
                    self.delegate?.segmentManager(self, didFailWithError: error)
                }
            }
        }
    }

    /// Force an immediate segment rotation (e.g., when entering background).
    func rotateSegmentNow() {
        do {
            try rotateSegment()
        } catch {
            print("[SegmentManager] Failed to rotate segment on demand: \(error)")
        }
    }

    // MARK: - Finalization

    /// Finalize the recording: finalize last segment, then concatenate all into one file.
    func finalize(completion: @escaping (Result<URL, Error>) -> Void) {
        rotationLock.lock()
        let encoder = currentEncoder
        let lastIndex = currentSegmentIndex
        let lastFrameCount = currentSegmentFrameCount
        currentEncoder = nil
        rotationLock.unlock()

        guard let encoder = encoder else {
            completion(.failure(TimelapseError.encoderNotReady))
            return
        }

        // Finalize the last (current) segment
        encoder.finalize { [weak self] result in
            guard let self = self else {
                // SegmentManager deallocated — still call completion so promise chain doesn't hang
                completion(.failure(TimelapseError.encoderFailed("Segment manager deallocated during finalization")))
                return
            }

            switch result {
            case .success:
                self.rotationLock.lock()
                if lastIndex < self.manifest.segments.count {
                    self.manifest.segments[lastIndex].status = "finalized"
                    self.manifest.segments[lastIndex].frameCount = lastFrameCount
                    self.manifest.totalFrameCount = self.totalFrameCount
                }
                self.rotationLock.unlock()
                self.writeManifest()

                print("[SegmentManager] Last segment \(lastIndex) finalized (\(lastFrameCount) frames)")

                // Wait for any in-flight segment finalizations from rotateSegment()
                // before collecting finalized segments for concatenation
                self.pendingFinalizationGroup.notify(queue: self.managerQueue) {
                    self.concatenateSegments(completion: completion)
                }

            case .failure(let error):
                self.rotationLock.lock()
                if lastIndex < self.manifest.segments.count {
                    self.manifest.segments[lastIndex].status = "failed"
                    self.manifest.segments[lastIndex].frameCount = lastFrameCount
                }
                self.rotationLock.unlock()
                self.writeManifest()

                // Wait for pending, then try to concatenate whatever we have
                self.pendingFinalizationGroup.notify(queue: self.managerQueue) {
                    let finalizedCount = self.manifest.segments.filter { $0.status == "finalized" }.count
                    if finalizedCount > 0 {
                        print("[SegmentManager] Last segment failed, but concatenating \(finalizedCount) finalized segments")
                        self.concatenateSegments(completion: completion)
                        return
                    }
                    completion(.failure(error))
                }
            }
        }
    }

    /// Cancel all segments and clean up.
    func cancel() {
        rotationLock.lock()
        currentEncoder?.cancel()
        currentEncoder = nil
        rotationLock.unlock()

        cleanupSessionDir()
    }

    // MARK: - Concatenation

    private func concatenateSegments(completion: @escaping (Result<URL, Error>) -> Void) {
        // Collect finalized segment URLs in order
        let finalizedSegments = manifest.segments
            .filter { $0.status == "finalized" }
            .sorted { $0.index < $1.index }
            .map { sessionDir.appendingPathComponent($0.fileName) }
            .filter { FileManager.default.fileExists(atPath: $0.path) }

        guard !finalizedSegments.isEmpty else {
            completion(.failure(TimelapseSegmentConcatenator.ConcatenationError.noSegments))
            return
        }

        // Output to tmp directory (JS will copy to documentDirectory/videos/)
        let outputURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("timelapse_\(Int(Date().timeIntervalSince1970)).mp4")

        TimelapseSegmentConcatenator.concatenate(segmentURLs: finalizedSegments, outputURL: outputURL) { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .success:
                // Clean up session directory after successful concatenation
                self.cleanupSessionDir()

            case .failure:
                // Keep session dir for potential recovery
                break
            }

            completion(result)
        }
    }

    // MARK: - Helpers

    private func segmentFileName(for index: Int) -> String {
        return String(format: "segment_%03d.mp4", index)
    }

    private func createEncoder(forSegmentIndex index: Int) throws -> TimelapseEncoder {
        let url = sessionDir.appendingPathComponent(segmentFileName(for: index))
        return try TimelapseEncoder(outputURL: url, width: width, height: height, fps: fps, codec: codec)
    }

    private func writeManifest() {
        managerQueue.async { [weak self] in
            guard let self = self else { return }

            self.rotationLock.lock()
            let manifestCopy = self.manifest
            self.rotationLock.unlock()

            do {
                let data = try JSONEncoder().encode(manifestCopy)
                let manifestURL = self.sessionDir.appendingPathComponent("manifest.json")
                try data.write(to: manifestURL, options: .atomic)
            } catch {
                print("[SegmentManager] Failed to write manifest: \(error)")
            }
        }
    }

    private func cleanupSessionDir() {
        do {
            try FileManager.default.removeItem(at: sessionDir)
            print("[SegmentManager] Cleaned up session directory: \(sessionId)")
        } catch {
            print("[SegmentManager] Failed to clean up session dir: \(error)")
        }
    }

    // MARK: - Stats

    var frameCount: Int64 {
        return Int64(totalFrameCount)
    }

    var estimatedDurationSeconds: Double {
        return Double(totalFrameCount) / Double(fps)
    }

    var currentSessionId: String {
        return sessionId
    }

    var currentSessionDir: URL {
        return sessionDir
    }
}
