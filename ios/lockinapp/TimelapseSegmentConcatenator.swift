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

        let composition = AVMutableComposition()

        guard let compositionTrack = composition.addMutableTrack(
            withMediaType: .video,
            preferredTrackID: kCMPersistentTrackID_Invalid
        ) else {
            completion(.failure(ConcatenationError.exportFailed("Failed to create composition track")))
            return
        }

        var insertionTime = CMTime.zero

        for segmentURL in segmentURLs {
            let asset = AVURLAsset(url: segmentURL, options: [AVURLAssetPreferPreciseDurationAndTimingKey: true])

            guard let videoTrack = asset.tracks(withMediaType: .video).first else {
                print("[SegmentConcatenator] Skipping segment with no video track: \(segmentURL.lastPathComponent)")
                continue
            }

            let duration = asset.duration

            do {
                try compositionTrack.insertTimeRange(
                    CMTimeRange(start: .zero, duration: duration),
                    of: videoTrack,
                    at: insertionTime
                )
                insertionTime = CMTimeAdd(insertionTime, duration)
            } catch {
                print("[SegmentConcatenator] Failed to insert segment \(segmentURL.lastPathComponent): \(error)")
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

        exporter.exportAsynchronously {
            switch exporter.status {
            case .completed:
                // Delete source segments immediately to free storage
                for segmentURL in segmentURLs {
                    try? FileManager.default.removeItem(at: segmentURL)
                }
                print("[SegmentConcatenator] Concatenation complete, deleted \(segmentURLs.count) source segments")
                completion(.success(outputURL))

            case .failed:
                let errorMsg = exporter.error?.localizedDescription ?? "Unknown error"
                completion(.failure(ConcatenationError.exportFailed(errorMsg)))

            case .cancelled:
                completion(.failure(ConcatenationError.exportCancelled))

            default:
                completion(.failure(ConcatenationError.exportFailed("Unexpected export status: \(exporter.status.rawValue)")))
            }
        }
    }
}
