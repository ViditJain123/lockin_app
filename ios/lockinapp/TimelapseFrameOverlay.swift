import Foundation
import CoreImage
import CoreGraphics
import UIKit

/// Renders branded frame overlay for timelapse videos
/// Includes: bottom gradient, logo on left and horizontal timer at user-specified position
class TimelapseFrameOverlay {

    // MARK: - Configuration

    /// Frame dimensions (must match encoder output)
    private let frameWidth: CGFloat = 1080
    private let frameHeight: CGFloat = 1920

    /// Logo configuration - height-based sizing to preserve aspect ratio
    private let logoMaxHeight: CGFloat = 60
    private let horizontalPadding: CGFloat = 80

    /// Timer configuration - horizontal display (HH:MM:SS)
    private let timerFontSize: CGFloat = 60

    /// Timer position (normalized 0-1 coordinates)
    private let timerPositionX: CGFloat  // 0=left, 1=right
    private let timerPositionY: CGFloat  // 0=top, 1=bottom
    
    // MARK: - Cached Assets
    
    private var cachedLogoImage: CGImage?
    private var cachedOverlayWithoutTimer: CGImage?
    private let ciContext: CIContext
    
    // MARK: - Initialization

    init(timerPositionX: CGFloat = 0.9, timerPositionY: CGFloat = 0.75) {
        self.timerPositionX = timerPositionX
        self.timerPositionY = timerPositionY

        // Create Metal-accelerated CIContext
        if let metalDevice = MTLCreateSystemDefaultDevice() {
            self.ciContext = CIContext(mtlDevice: metalDevice, options: [
                .cacheIntermediates: false,
                .priorityRequestLow: false
            ])
        } else {
            self.ciContext = CIContext(options: [.cacheIntermediates: false])
        }

        // Load and cache logo
        loadLogo()

        // Pre-render static overlay parts
        renderStaticOverlay()
    }
    
    // MARK: - Logo Loading
    
    private func loadLogo() {
        // Try the cropped no-background version first
        if let logoUIImage = UIImage(named: "logo-no-bg-cropped") {
            cachedLogoImage = logoUIImage.cgImage
            print("[TimelapseFrameOverlay] Logo loaded: logo-no-bg-cropped")
            return
        }

        // Fallback to Logo from xcassets
        if let logoUIImage = UIImage(named: "Logo") {
            cachedLogoImage = logoUIImage.cgImage
            print("[TimelapseFrameOverlay] Logo loaded from xcassets")
            return
        }

        print("[TimelapseFrameOverlay] Warning: Could not load logo image")
    }
    
    // MARK: - Static Overlay Rendering

    private func renderStaticOverlay() {
        let size = CGSize(width: frameWidth, height: frameHeight)

        UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
        guard let context = UIGraphicsGetCurrentContext() else {
            UIGraphicsEndImageContext()
            return
        }

        // Clear background (transparent)
        context.clear(CGRect(origin: .zero, size: size))

        // Draw bottom gradient (black transparent to transparent)
        drawBottomGradient(in: context, size: size)

        // Draw logo at 3/4 height on left side
        drawLogo(in: context, size: size)

        // Get the rendered image
        if let image = UIGraphicsGetImageFromCurrentImageContext()?.cgImage {
            cachedOverlayWithoutTimer = image
            print("[TimelapseFrameOverlay] Static overlay cached successfully")
        }

        UIGraphicsEndImageContext()
    }

    private func drawBottomGradient(in context: CGContext, size: CGSize) {
        // Gradient from bottom (black with low opacity) to middle (transparent)
        let gradientColors = [
            UIColor.black.withAlphaComponent(0.5).cgColor,  // Bottom - subtle black
            UIColor.black.withAlphaComponent(0.0).cgColor   // Middle - fully transparent
        ]

        let colorSpace = CGColorSpaceCreateDeviceRGB()
        guard let gradient = CGGradient(
            colorsSpace: colorSpace,
            colors: gradientColors as CFArray,
            locations: [0.0, 1.0]
        ) else { return }

        // Gradient covers bottom half of the screen
        let startPoint = CGPoint(x: size.width / 2, y: size.height)  // Bottom
        let endPoint = CGPoint(x: size.width / 2, y: size.height / 2)  // Middle

        context.drawLinearGradient(
            gradient,
            start: startPoint,
            end: endPoint,
            options: []
        )
    }

    /// Get the Y position - centered vertically on left edge
    private func getOverlayYPosition() -> CGFloat {
        return frameHeight * 0.5
    }

    private func drawLogo(in context: CGContext, size: CGSize) {
        guard let logo = cachedLogoImage else { return }

        // Calculate dimensions preserving aspect ratio
        let imageWidth = CGFloat(logo.width)
        let imageHeight = CGFloat(logo.height)
        let aspectRatio = imageWidth / imageHeight

        // Scale to fit within maxHeight while preserving aspect ratio
        let logoHeight = logoMaxHeight
        let logoWidth = logoHeight * aspectRatio

        // Position logo at 3/4 height on the left side
        let logoY = getOverlayYPosition() - logoHeight / 2
        let logoX: CGFloat = 0  // Flush to left edge

        let logoRect = CGRect(x: logoX, y: logoY, width: logoWidth, height: logoHeight)

        // Draw logo (flip context for CGImage)
        context.saveGState()
        context.translateBy(x: 0, y: size.height)
        context.scaleBy(x: 1, y: -1)

        let flippedLogoRect = CGRect(
            x: logoRect.origin.x,
            y: size.height - logoRect.origin.y - logoRect.height,
            width: logoRect.width,
            height: logoRect.height
        )
        context.draw(logo, in: flippedLogoRect)
        context.restoreGState()
    }
    
    // MARK: - Timer Rendering

    private func renderTimerText(_ seconds: Int) -> CGImage? {
        // Calculate hours, minutes, and seconds from total seconds (HH:MM:SS format)
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        let secs = seconds % 60

        // Format as horizontal: HH:MM:SS
        let timerString = String(format: "%02d:%02d:%02d", hours, minutes, secs)

        let size = CGSize(width: frameWidth, height: frameHeight)

        UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
        guard let context = UIGraphicsGetCurrentContext() else {
            UIGraphicsEndImageContext()
            return nil
        }

        // Clear background
        context.clear(CGRect(origin: .zero, size: size))

        // Configure text attributes - center aligned since we position the timer explicitly
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .center

        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.monospacedDigitSystemFont(ofSize: timerFontSize, weight: .semibold),
            .foregroundColor: UIColor.white,
            .paragraphStyle: paragraphStyle
        ]

        // Calculate timer size for centering
        let timerWidth: CGFloat = 250  // Approximate width of HH:MM:SS text
        let timerHeight: CGFloat = timerFontSize + 10

        // Calculate timer position from normalized coordinates (center the timer pill)
        let timerX = (timerPositionX * frameWidth) - (timerWidth / 2)
        let timerY = (timerPositionY * frameHeight) - (timerHeight / 2)

        // Clamp to screen bounds with padding
        let clampedX = max(horizontalPadding, min(frameWidth - timerWidth - horizontalPadding, timerX))
        let clampedY = max(horizontalPadding, min(frameHeight - timerHeight - horizontalPadding, timerY))

        let timerRect = CGRect(x: clampedX, y: clampedY, width: timerWidth, height: timerHeight)

        // Draw the timer text
        (timerString as NSString).draw(in: timerRect, withAttributes: attributes)

        let image = UIGraphicsGetImageFromCurrentImageContext()?.cgImage
        UIGraphicsEndImageContext()

        return image
    }
    
    // MARK: - Public API
    
    /// Apply overlay to a frame with the given elapsed time
    /// - Parameters:
    ///   - image: The camera frame as CIImage
    ///   - elapsedSeconds: Recording elapsed time in seconds
    /// - Returns: Frame with overlay composited
    func applyOverlay(to image: CIImage, elapsedSeconds: Int) -> CIImage {
        var result = image
        
        // Composite static overlay (gradient + logo)
        if let staticOverlay = cachedOverlayWithoutTimer {
            let overlayCI = CIImage(cgImage: staticOverlay)
            result = overlayCI.composited(over: result)
        }
        
        // Composite timer text (rendered fresh each time with current elapsed seconds)
        if let timerImage = renderTimerText(elapsedSeconds) {
            let timerCI = CIImage(cgImage: timerImage)
            result = timerCI.composited(over: result)
        }
        
        return result
    }
}
