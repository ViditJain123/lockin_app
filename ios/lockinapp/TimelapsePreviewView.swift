import Foundation
import AVFoundation
import UIKit
import React

/// Native camera preview view that displays the timelapse capture session
/// This allows the camera preview to continue during timelapse recording
class TimelapsePreviewView: UIView {
    
    private var previewLayer: AVCaptureVideoPreviewLayer?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .black
        setupPreviewLayer()
        setupObservers()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        backgroundColor = .black
        setupPreviewLayer()
        setupObservers()
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    private func setupPreviewLayer() {
        // Create preview layer
        let layer = AVCaptureVideoPreviewLayer()
        layer.videoGravity = .resizeAspectFill
        layer.frame = bounds
        
        self.layer.addSublayer(layer)
        self.previewLayer = layer
        
        print("[TimelapsePreviewView] Preview layer created")
    }
    
    private func setupObservers() {
        // Listen for session updates
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleSessionUpdate),
            name: NSNotification.Name("TimelapseSessionUpdated"),
            object: nil
        )
    }
    
    @objc private func handleSessionUpdate(_ notification: Notification) {
        DispatchQueue.main.async { [weak self] in
            self?.updateSession()
        }
    }
    
    func updateSession() {
        // Get the shared session from TimelapseSessionManager
        if let session = TimelapseSessionManager.sharedSession {
            print("[TimelapsePreviewView] Connecting to shared capture session")
            previewLayer?.session = session
            
            // Configure the connection for portrait after session is set
            if let connection = previewLayer?.connection {
                if #available(iOS 17.0, *) {
                    if connection.isVideoRotationAngleSupported(90) {
                        connection.videoRotationAngle = 90
                    }
                } else {
                    if connection.isVideoOrientationSupported {
                        connection.videoOrientation = .portrait
                    }
                }
            }
        } else {
            print("[TimelapsePreviewView] No shared session available")
            previewLayer?.session = nil
        }
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        previewLayer?.frame = bounds
        CATransaction.commit()
    }
    
    /// Connect to a capture session
    func setSession(_ session: AVCaptureSession?) {
        DispatchQueue.main.async { [weak self] in
            self?.previewLayer?.session = session
            print("[TimelapsePreviewView] Session set: \(session != nil ? "connected" : "disconnected")")
        }
    }
}

/// React Native View Manager for TimelapsePreviewView
@objc(TimelapsePreviewViewManager)
class TimelapsePreviewViewManager: RCTViewManager {
    
    override func view() -> UIView! {
        let previewView = TimelapsePreviewView()
        // Immediately try to connect to any existing session
        previewView.updateSession()
        return previewView
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // Override the module name to match what React Native expects
    @objc override static func moduleName() -> String! {
        return "TimelapsePreviewView"
    }
}

