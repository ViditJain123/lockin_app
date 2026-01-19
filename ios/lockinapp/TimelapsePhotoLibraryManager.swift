import Foundation
import Photos

/// Manages saving timelapse videos to the Photos library
class TimelapsePhotoLibraryManager {
    
    // MARK: - Types
    
    enum SaveError: LocalizedError {
        case permissionDenied
        case saveFailed(String)
        case assetNotFound
        
        var errorDescription: String? {
            switch self {
            case .permissionDenied:
                return "Photo library access denied"
            case .saveFailed(let message):
                return "Failed to save video: \(message)"
            case .assetNotFound:
                return "Saved asset not found"
            }
        }
    }
    
    // MARK: - Properties
    
    private var savedAssetIdentifier: String?
    
    // MARK: - Public Methods
    
    /// Check and request photo library permission
    func checkPermission(completion: @escaping (Bool) -> Void) {
        let status = PHPhotoLibrary.authorizationStatus(for: .addOnly)
        
        switch status {
        case .authorized, .limited:
            completion(true)
            
        case .notDetermined:
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { newStatus in
                DispatchQueue.main.async {
                    completion(newStatus == .authorized || newStatus == .limited)
                }
            }
            
        default:
            completion(false)
        }
    }
    
    /// Save video to Photos library
    func saveToGallery(_ videoURL: URL, completion: @escaping (Result<String, Error>) -> Void) {
        checkPermission { [weak self] granted in
            guard granted else {
                completion(.failure(SaveError.permissionDenied))
                return
            }
            
            self?.performSave(videoURL, completion: completion)
        }
    }
    
    // MARK: - Private Methods
    
    private func performSave(_ videoURL: URL, completion: @escaping (Result<String, Error>) -> Void) {
        var localIdentifier: String?
        
        PHPhotoLibrary.shared().performChanges({
            // Create video asset
            let request = PHAssetCreationRequest.forAsset()
            request.addResource(with: .video, fileURL: videoURL, options: nil)
            
            // Set creation date
            request.creationDate = Date()
            
            // Get the placeholder for the asset ID
            localIdentifier = request.placeholderForCreatedAsset?.localIdentifier
            
        }) { [weak self] success, error in
            DispatchQueue.main.async {
                if success, let identifier = localIdentifier {
                    self?.savedAssetIdentifier = identifier
                    print("[PhotoLibrary] Video saved with identifier: \(identifier)")
                    
                    // Clean up temp file
                    self?.cleanupTempFile(videoURL)
                    
                    completion(.success(identifier))
                } else {
                    let saveError = error ?? SaveError.saveFailed("Unknown error")
                    print("[PhotoLibrary] Save failed: \(saveError.localizedDescription)")
                    completion(.failure(saveError))
                }
            }
        }
    }
    
    private func cleanupTempFile(_ url: URL) {
        // Only clean up files in temp directory
        guard url.path.contains(FileManager.default.temporaryDirectory.path) else {
            return
        }
        
        do {
            try FileManager.default.removeItem(at: url)
            print("[PhotoLibrary] Cleaned up temp file: \(url.lastPathComponent)")
        } catch {
            print("[PhotoLibrary] Failed to clean up temp file: \(error)")
        }
    }
    
    // MARK: - Asset Retrieval
    
    /// Get the saved asset for sharing or display
    func getSavedAsset(completion: @escaping (PHAsset?) -> Void) {
        guard let identifier = savedAssetIdentifier else {
            completion(nil)
            return
        }
        
        let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil)
        completion(fetchResult.firstObject)
    }
    
    /// Get file URL for the saved asset (for sharing)
    func getAssetURL(completion: @escaping (URL?) -> Void) {
        getSavedAsset { asset in
            guard let asset = asset else {
                completion(nil)
                return
            }
            
            let options = PHVideoRequestOptions()
            options.version = .current
            options.deliveryMode = .highQualityFormat
            
            PHImageManager.default().requestAVAsset(forVideo: asset, options: options) { avAsset, _, _ in
                DispatchQueue.main.async {
                    if let urlAsset = avAsset as? AVURLAsset {
                        completion(urlAsset.url)
                    } else {
                        completion(nil)
                    }
                }
            }
        }
    }
}
