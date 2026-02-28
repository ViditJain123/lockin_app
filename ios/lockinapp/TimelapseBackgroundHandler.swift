import Foundation
import UIKit

/// Manages background task for continued recording when app is backgrounded
protocol TimelapseBackgroundHandlerDelegate: AnyObject {
    func backgroundHandlerTaskExpiring(_ handler: TimelapseBackgroundHandler)
}

class TimelapseBackgroundHandler {
    
    // MARK: - Properties
    
    weak var delegate: TimelapseBackgroundHandlerDelegate?
    
    private var backgroundTaskID: UIBackgroundTaskIdentifier = .invalid
    private var isActive = false
    
    // MARK: - Initialization
    
    init() {
        setupNotifications()
    }
    
    private func setupNotifications() {
        // Observe app lifecycle
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillResignActive),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
    }
    
    // MARK: - Background Task Management
    
    /// Start a background task to extend recording time when app is backgrounded
    func startBackgroundTask() {
        guard !isActive else { return }
        isActive = true
        
        print("[BackgroundHandler] Starting background task management")
    }
    
    /// End the background task
    func endBackgroundTask() {
        isActive = false
        
        if backgroundTaskID != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskID)
            backgroundTaskID = .invalid
            print("[BackgroundHandler] Ended background task")
        }
    }
    
    // MARK: - App Lifecycle
    
    @objc private func appWillResignActive() {
        print("[BackgroundHandler] App will resign active")
    }
    
    @objc private func appDidBecomeActive() {
        print("[BackgroundHandler] App did become active")
        
        // End any existing background task since we're in foreground
        if backgroundTaskID != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskID)
            backgroundTaskID = .invalid
        }
    }
    
    @objc private func appDidEnterBackground() {
        guard isActive else { return }

        // Trigger immediate segment rotation so the current segment is finalized
        // before the app may be killed in the background
        NotificationCenter.default.post(name: .timelapseForceSegmentRotation, object: nil)

        print("[BackgroundHandler] App entered background - starting background task")
        
        // Start background task to extend our execution time
        backgroundTaskID = UIApplication.shared.beginBackgroundTask(withName: "TimelapseRecording") { [weak self] in
            // Background time is about to expire
            print("[BackgroundHandler] Background task expiring!")
            self?.handleBackgroundTaskExpiring()
        }
        
        if backgroundTaskID == .invalid {
            print("[BackgroundHandler] Failed to start background task")
        } else {
            // Log remaining time
            let remaining = UIApplication.shared.backgroundTimeRemaining
            print("[BackgroundHandler] Background time remaining: \(remaining) seconds")
        }
    }
    
    @objc private func appWillEnterForeground() {
        print("[BackgroundHandler] App will enter foreground")
    }
    
    private func handleBackgroundTaskExpiring() {
        // Notify delegate to finalize recording
        delegate?.backgroundHandlerTaskExpiring(self)
        
        // End the task
        if backgroundTaskID != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskID)
            backgroundTaskID = .invalid
        }
    }
    
    // MARK: - Cleanup
    
    deinit {
        NotificationCenter.default.removeObserver(self)
        endBackgroundTask()
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let timelapseForceSegmentRotation = Notification.Name("timelapseForceSegmentRotation")
}

// MARK: - Background Capability Notes
/*
 iOS Background Recording Limitations:
 
 1. Default background time: ~30 seconds (iOS 17+: ~5 minutes with "audio" mode)
 2. With "audio" background mode: Extended time while audio session is active
 3. Location services can extend background time indefinitely but drain battery
 
 Our Strategy:
 - Use "audio" background mode with silent audio session
 - AVCaptureSession continues in background with audio mode
 - Background task extends processing time for encoding
 
 Realistic Behavior:
 - Recording continues when screen locks (audio mode)
 - Recording continues when switching apps briefly
 - If app is terminated, recording stops (no way around this)
 - We finalize gracefully before background time expires
 
 For true 4-hour uninterrupted recording:
 - User should keep app in foreground
 - Disable auto-lock in Settings
 - Keep device plugged in
 
 These are iOS platform limitations, not our code limitations.
*/
