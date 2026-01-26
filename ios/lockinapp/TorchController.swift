import Foundation
import AVFoundation
import React

/// Native torch controller that works in both recording and non-recording states.
/// - When NOT recording: Controls torch directly via AVCaptureDevice
/// - When recording: Delegates to TimelapseSessionManager (since it owns the capture device)
@objc(TorchController)
class TorchController: NSObject {

    // MARK: - Singleton

    @objc static let shared = TorchController()

    // MARK: - State

    private var torchEnabled: Bool = false

    // MARK: - Private Methods

    /// Get the back camera device (only back camera has torch)
    private func getBackCamera() -> AVCaptureDevice? {
        let deviceTypes: [AVCaptureDevice.DeviceType] = [
            .builtInWideAngleCamera,
            .builtInDualCamera,
            .builtInTripleCamera
        ]

        let discoverySession = AVCaptureDevice.DiscoverySession(
            deviceTypes: deviceTypes,
            mediaType: .video,
            position: .back
        )

        return discoverySession.devices.first
    }

    /// Check if TimelapseEngine is currently recording
    private func isRecording() -> Bool {
        guard let engine = try? getTimelapseEngine() else {
            return false
        }
        return engine.state == .recording
    }

    /// Get TimelapseEngine instance safely
    private func getTimelapseEngine() throws -> TimelapseEngine {
        return TimelapseEngine.shared
    }

    // MARK: - Public API

    /// Set torch on or off
    /// Returns true if successful, false otherwise
    @objc func setTorch(_ enabled: Bool) -> Bool {
        torchEnabled = enabled

        // If recording, delegate to TimelapseSessionManager via TimelapseEngine
        if isRecording() {
            do {
                let engine = try getTimelapseEngine()
                try engine.sessionManager?.setTorch(enabled: enabled)
                print("[TorchController] Set torch via TimelapseSessionManager: \(enabled)")
                return true
            } catch {
                print("[TorchController] Failed to set torch via session manager: \(error)")
                return false
            }
        }

        // Not recording - control torch directly
        guard let device = getBackCamera(), device.hasTorch else {
            print("[TorchController] No torch available on device")
            return false
        }

        do {
            try device.lockForConfiguration()
            defer { device.unlockForConfiguration() }

            if enabled {
                try device.setTorchModeOn(level: AVCaptureDevice.maxAvailableTorchLevel)
            } else {
                device.torchMode = .off
            }

            print("[TorchController] Set torch directly: \(enabled)")
            return true
        } catch {
            print("[TorchController] Failed to set torch: \(error)")
            return false
        }
    }

    /// Get current torch state
    @objc func getTorchState() -> Bool {
        // If recording, check from session manager
        if isRecording() {
            guard let device = getBackCamera() else {
                return false
            }
            return device.torchMode == .on
        }

        // Not recording - check device directly
        guard let device = getBackCamera() else {
            return false
        }
        return device.torchMode == .on
    }

    /// Check if device has torch capability
    @objc func hasTorch() -> Bool {
        guard let device = getBackCamera() else {
            return false
        }
        return device.hasTorch
    }

    /// Turn off torch (convenience method for cleanup)
    @objc func turnOffTorch() {
        _ = setTorch(false)
    }
}

// MARK: - React Native Module

@objc(TorchControllerModule)
class TorchControllerModule: NSObject {

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc func setTorch(_ enabled: Bool,
                        resolver: @escaping RCTPromiseResolveBlock,
                        rejecter: @escaping RCTPromiseRejectBlock) {
        let success = TorchController.shared.setTorch(enabled)
        resolver(success)
    }

    @objc func getTorchState(_ resolver: @escaping RCTPromiseResolveBlock,
                             rejecter: @escaping RCTPromiseRejectBlock) {
        let state = TorchController.shared.getTorchState()
        resolver(state)
    }

    @objc func hasTorch(_ resolver: @escaping RCTPromiseResolveBlock,
                        rejecter: @escaping RCTPromiseRejectBlock) {
        let has = TorchController.shared.hasTorch()
        resolver(has)
    }

    @objc func turnOffTorch(_ resolver: @escaping RCTPromiseResolveBlock,
                            rejecter: @escaping RCTPromiseRejectBlock) {
        TorchController.shared.turnOffTorch()
        resolver(true)
    }
}
