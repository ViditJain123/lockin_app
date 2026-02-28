import Foundation
import AVFoundation

/// Scans for orphaned timelapse sessions on app launch and provides recovery/dismissal.
class TimelapseCrashRecoveryManager {

    struct RecoverableSession {
        let sessionId: String
        let startedAt: String
        let segmentCount: Int
        let estimatedFrames: Int
        let estimatedDurationSeconds: Double
        let fps: Int
    }

    /// Scan for recoverable sessions from previous crashes/force-quits.
    static func findRecoverableSessions() -> [RecoverableSession] {
        let baseDir = TimelapseSegmentManager.sessionsBaseDir
        let fm = FileManager.default

        guard fm.fileExists(atPath: baseDir.path) else { return [] }

        var results: [RecoverableSession] = []

        guard let sessionDirs = try? fm.contentsOfDirectory(at: baseDir, includingPropertiesForKeys: nil) else {
            return []
        }

        for sessionDir in sessionDirs {
            guard sessionDir.hasDirectoryPath || (try? sessionDir.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true else {
                continue
            }

            let manifestURL = sessionDir.appendingPathComponent("manifest.json")
            guard let data = try? Data(contentsOf: manifestURL),
                  let manifest = try? JSONDecoder().decode(TimelapseSegmentManager.Manifest.self, from: data) else {
                continue
            }

            // Count finalized segments that still exist on disk
            let finalizedSegments = manifest.segments.filter { segment in
                segment.status == "finalized" &&
                fm.fileExists(atPath: sessionDir.appendingPathComponent(segment.fileName).path)
            }

            // Check if the last "recording" segment is partially readable (fragmented MP4)
            let lastRecording = manifest.segments.last { $0.status == "recording" }
            var recoverableFromPartial = false
            if let partial = lastRecording {
                let partialURL = sessionDir.appendingPathComponent(partial.fileName)
                if fm.fileExists(atPath: partialURL.path) {
                    let asset = AVURLAsset(url: partialURL)
                    let duration = CMTimeGetSeconds(asset.duration)
                    if duration > 0 {
                        recoverableFromPartial = true
                    }
                }
            }

            let totalRecoverableSegments = finalizedSegments.count + (recoverableFromPartial ? 1 : 0)

            guard totalRecoverableSegments > 0 else { continue }

            let totalFrames = finalizedSegments.reduce(0) { $0 + $1.frameCount }
            let fps = manifest.fps > 0 ? manifest.fps : 60

            results.append(RecoverableSession(
                sessionId: manifest.sessionId,
                startedAt: manifest.startedAt,
                segmentCount: totalRecoverableSegments,
                estimatedFrames: totalFrames,
                estimatedDurationSeconds: Double(totalFrames) / Double(fps),
                fps: fps
            ))
        }

        return results
    }

    /// Recover a session by concatenating its available segments.
    static func recover(sessionId: String, completion: @escaping (Result<URL, Error>) -> Void) {
        let sessionDir = TimelapseSegmentManager.sessionsBaseDir.appendingPathComponent(sessionId)
        let manifestURL = sessionDir.appendingPathComponent("manifest.json")
        let fm = FileManager.default

        guard let data = try? Data(contentsOf: manifestURL),
              let manifest = try? JSONDecoder().decode(TimelapseSegmentManager.Manifest.self, from: data) else {
            completion(.failure(NSError(domain: "TimelapseCrashRecovery", code: 1, userInfo: [NSLocalizedDescriptionKey: "Manifest not found"])))
            return
        }

        // Collect all usable segment URLs
        var segmentURLs: [URL] = []

        for segment in manifest.segments.sorted(by: { $0.index < $1.index }) {
            let url = sessionDir.appendingPathComponent(segment.fileName)
            guard fm.fileExists(atPath: url.path) else { continue }

            if segment.status == "finalized" {
                segmentURLs.append(url)
            } else if segment.status == "recording" {
                // Check if partially readable thanks to movieFragmentInterval
                let asset = AVURLAsset(url: url)
                if CMTimeGetSeconds(asset.duration) > 0 {
                    segmentURLs.append(url)
                    print("[CrashRecovery] Including partial segment \(segment.fileName)")
                }
            }
        }

        guard !segmentURLs.isEmpty else {
            completion(.failure(NSError(domain: "TimelapseCrashRecovery", code: 2, userInfo: [NSLocalizedDescriptionKey: "No recoverable segments"])))
            return
        }

        let outputURL = fm.temporaryDirectory.appendingPathComponent("recovered_\(sessionId).mp4")

        TimelapseSegmentConcatenator.concatenate(segmentURLs: segmentURLs, outputURL: outputURL) { result in
            if case .success = result {
                // Clean up session directory after successful recovery
                try? fm.removeItem(at: sessionDir)
                print("[CrashRecovery] Recovered \(segmentURLs.count) segments for session \(sessionId)")
            }
            completion(result)
        }
    }

    /// Dismiss a recoverable session (delete its data).
    static func dismiss(sessionId: String) {
        let sessionDir = TimelapseSegmentManager.sessionsBaseDir.appendingPathComponent(sessionId)
        try? FileManager.default.removeItem(at: sessionDir)
        print("[CrashRecovery] Dismissed session \(sessionId)")
    }

    /// Remove sessions older than 7 days as a safety net.
    static func cleanupStaleSessionsIfNeeded() {
        let baseDir = TimelapseSegmentManager.sessionsBaseDir
        let fm = FileManager.default
        let staleThreshold: TimeInterval = 7 * 24 * 3600  // 7 days

        guard let sessionDirs = try? fm.contentsOfDirectory(at: baseDir, includingPropertiesForKeys: [.creationDateKey]) else {
            return
        }

        let cutoff = Date().addingTimeInterval(-staleThreshold)

        for sessionDir in sessionDirs {
            if let attrs = try? fm.attributesOfItem(atPath: sessionDir.path),
               let created = attrs[.creationDate] as? Date,
               created < cutoff {
                try? fm.removeItem(at: sessionDir)
                print("[CrashRecovery] Removed stale session: \(sessionDir.lastPathComponent)")
            }
        }
    }
}
