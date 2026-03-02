import Foundation
import AVFoundation

/// Lossless concatenation of multiple MP4 segments into a single output file.
/// Uses AVMutableComposition + AVAssetExportSession with `.passthrough` preset (no re-encoding).
class TimelapseSegmentConcatenator {

    enum ConcatenationError: Error, LocalizedError {
        case noSegments
        case noVideoTrack(URL)
        case exportFailed(String)
        case exportCancelled
        case exportTimedOut

        var errorDescription: String? {
            switch self {
            case .noSegments:
                return "No segments to concatenate"
            case .noVideoTrack(let url):
                return "No video track in segment: \(url.lastPathComponent)"
            case .exportFailed(let reason):
                return "Export failed: \(reason)"
            case .exportCancelled:
                return "Export was cancelled"
            case .exportTimedOut:
                return "Export timed out"
            }
        }
    }

    /// Concatenate ordered segment files into a single MP4.
    /// Source segment files are deleted on success to avoid 2x storage peak.
    /// - Parameters:
    ///   - segmentURLs: Ordered list of finalized segment file URLs
    ///   - outputURL: Destination URL for the concatenated file
    ///   - completion: Result with the output URL on success
    static func concatenate(
        segmentURLs: [URL],
        outputURL: URL,
        completion: @escaping (Result<URL, Error>) -> Void
    ) {
        guard !segmentURLs.isEmpty else {
            completion(.failure(ConcatenationError.noSegments))
            return
        }

        // Single segment — move (not copy) to avoid any storage duplication
        if segmentURLs.count == 1 {
            do {
                try? FileManager.default.removeItem(at: outputURL)
                try FileManager.default.moveItem(at: segmentURLs[0], to: outputURL)
                completion(.success(outputURL))
            } catch {
                completion(.failure(error))
            }
            return
        }

        // Load tracks asynchronously to avoid blocking on fragmented MP4s
        let loadGroup = DispatchGroup()
        let loadQueue = DispatchQueue(label: "com.lockin.timelapse.trackLoading", qos: .userInitiated)

        struct SegmentTrackInfo {
            let asset: AVURLAsset
            let track: AVAssetTrack
            let duration: CMTime
        }

        var loadedSegments: [SegmentTrackInfo] = []
        let loadLock = NSLock()

        for segmentURL in segmentURLs {
            // Don't request precise duration — it causes expensive scanning on fragmented MP4s
            let asset = AVURLAsset(url: segmentURL)

            loadGroup.enter()

            if #available(iOS 15.0, *) {
                // Async track + duration loading (iOS 15+)
                Task {
                    do {
                        let tracks = try await asset.loadTracks(withMediaType: .video)
                        let duration = try await asset.load(.duration)
                        if let track = tracks.first {
                            loadLock.lock()
                            loadedSegments.append(SegmentTrackInfo(asset: asset, track: track, duration: duration))
                            loadLock.unlock()
                        } else {
                            print("[SegmentConcatenator] No video track in \(segmentURL.lastPathComponent)")
                        }
                    } catch {
                        print("[SegmentConcatenator] Failed to load tracks for \(segmentURL.lastPathComponent): \(error)")
                    }
                    loadGroup.leave()
                }
            } else {
                // Fallback: synchronous loading on background queue
                loadQueue.async {
                    if let track = asset.tracks(withMediaType: .video).first {
                        let duration = asset.duration
                        loadLock.lock()
                        loadedSegments.append(SegmentTrackInfo(asset: asset, track: track, duration: duration))
                        loadLock.unlock()
                    } else {
                        print("[SegmentConcatenator] No video track in \(segmentURL.lastPathComponent)")
                    }
                    loadGroup.leave()
                }
            }
        }

        loadGroup.notify(queue: .global(qos: .userInitiated)) {
            // Sort by original order (segmentURLs order)
            let urlOrder = Dictionary(uniqueKeysWithValues: segmentURLs.enumerated().map { ($1.absoluteString, $0) })
            let sortedSegments = loadedSegments.sorted {
                (urlOrder[$0.asset.url.absoluteString] ?? 0) < (urlOrder[$1.asset.url.absoluteString] ?? 0)
            }

            let composition = AVMutableComposition()

            guard let compositionTrack = composition.addMutableTrack(
                withMediaType: .video,
                preferredTrackID: kCMPersistentTrackID_Invalid
            ) else {
                completion(.failure(ConcatenationError.exportFailed("Failed to create composition track")))
                return
            }

            var insertionTime = CMTime.zero

            for info in sortedSegments {
                do {
                    try compositionTrack.insertTimeRange(
                        CMTimeRange(start: .zero, duration: info.duration),
                        of: info.track,
                        at: insertionTime
                    )
                    insertionTime = CMTimeAdd(insertionTime, info.duration)
                } catch {
                    print("[SegmentConcatenator] Failed to insert segment \(info.asset.url.lastPathComponent): \(error)")
                    continue
                }
            }

            guard CMTimeGetSeconds(insertionTime) > 0 else {
                completion(.failure(ConcatenationError.noSegments))
                return
            }

            // Remove existing output file
            try? FileManager.default.removeItem(at: outputURL)

            guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetPassthrough) else {
                completion(.failure(ConcatenationError.exportFailed("Failed to create export session")))
                return
            }

            exporter.outputURL = outputURL
            exporter.outputFileType = .mp4

            print("[SegmentConcatenator] Concatenating \(segmentURLs.count) segments, total duration: \(CMTimeGetSeconds(insertionTime))s")

            // Export with 60s timeout
            let completionLock = NSLock()
            var completionCalled = false

            let callOnce: (Result<URL, Error>) -> Void = { result in
                completionLock.lock()
                guard !completionCalled else {
                    completionLock.unlock()
                    return
                }
                completionCalled = true
                completionLock.unlock()
                completion(result)
            }

            let timeoutWork = DispatchWorkItem {
                print("[SegmentConcatenator] Export timed out after 60s — cancelling")
                exporter.cancelExport()
                callOnce(.failure(ConcatenationError.exportTimedOut))
            }
            DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + 60, execute: timeoutWork)

            exporter.exportAsynchronously {
                timeoutWork.cancel()

                switch exporter.status {
                case .completed:
                    // Delete source segments immediately to free storage
                    for segmentURL in segmentURLs {
                        try? FileManager.default.removeItem(at: segmentURL)
                    }
                    print("[SegmentConcatenator] Concatenation complete, deleted \(segmentURLs.count) source segments")
                    callOnce(.success(outputURL))

                case .failed:
                    let errorMsg = exporter.error?.localizedDescription ?? "Unknown error"
                    callOnce(.failure(ConcatenationError.exportFailed(errorMsg)))

                case .cancelled:
                    callOnce(.failure(ConcatenationError.exportCancelled))

                default:
                    callOnce(.failure(ConcatenationError.exportFailed("Unexpected export status: \(exporter.status.rawValue)")))
                }
            }
        }
    }
}
