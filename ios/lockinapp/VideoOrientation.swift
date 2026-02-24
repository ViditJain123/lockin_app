import Foundation
import AVFoundation

/// Centralized video orientation configuration
/// Maps device orientation to output dimensions and rotation angles
enum VideoOrientation: String {
    case portrait = "portrait"
    case landscapeLeft = "landscapeLeft"   // Home button on left (device rotated clockwise)
    case landscapeRight = "landscapeRight" // Home button on right (device rotated counter-clockwise)

    // MARK: - Output Dimensions

    /// Output video width for encoder
    var outputWidth: Int {
        switch self {
        case .portrait:
            return 1080
        case .landscapeLeft, .landscapeRight:
            return 1920
        }
    }

    /// Output video height for encoder
    var outputHeight: Int {
        switch self {
        case .portrait:
            return 1920
        case .landscapeLeft, .landscapeRight:
            return 1080
        }
    }

    // MARK: - Rotation Angles

    /// Video rotation angle for AVCaptureConnection (iOS 17+)
    /// This rotates the captured frames to match the device orientation
    var videoRotationAngle: CGFloat {
        switch self {
        case .portrait:
            return 90
        case .landscapeLeft:
            return 180
        case .landscapeRight:
            return 0
        }
    }

    /// Legacy AVCaptureVideoOrientation for pre-iOS 17
    var avVideoOrientation: AVCaptureVideoOrientation {
        switch self {
        case .portrait:
            return .portrait
        case .landscapeLeft:
            return .landscapeLeft
        case .landscapeRight:
            return .landscapeRight
        }
    }

    // MARK: - Aspect Ratio

    /// Target aspect ratio for cropping
    var targetAspectRatio: CGFloat {
        switch self {
        case .portrait:
            return 9.0 / 16.0
        case .landscapeLeft, .landscapeRight:
            return 16.0 / 9.0
        }
    }

    // MARK: - Factory

    /// Create VideoOrientation from string (e.g., from React Native)
    static func from(_ string: String) -> VideoOrientation {
        switch string.lowercased() {
        case "landscapeleft", "landscape-left", "landscape_left":
            return .landscapeLeft
        case "landscaperight", "landscape-right", "landscape_right":
            return .landscapeRight
        case "portrait":
            return .portrait
        default:
            return .portrait
        }
    }
}
