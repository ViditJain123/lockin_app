import Foundation
import CoreImage
import CoreGraphics
import UIKit

/// Renders branded frame overlay for timelapse videos
/// Includes: bottom gradient, logo on left and horizontal timer on right at 3/4 height
class TimelapseFrameOverlay {

    // MARK: - Configuration

    /// Frame dimensions (must match encoder output)
    private let frameWidth: CGFloat = 1080
    private let frameHeight: CGFloat = 1920

    /// Logo configuration
    private let logoSize: CGFloat = 200
    private let horizontalPadding: CGFloat = 80

    /// Timer configuration - horizontal display (HH:MM:SS)
    private let timerFontSize: CGFloat = 60
    
    // MARK: - Cached Assets
    
    private var cachedLogoImage: CGImage?
    private var cachedOverlayWithoutTimer: CGImage?
    private let ciContext: CIContext
    
    // MARK: - Initialization
    
    init() {
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
        // Try to load from xcassets
        if let logoUIImage = UIImage(named: "Logo") {
            cachedLogoImage = logoUIImage.cgImage
            print("[TimelapseFrameOverlay] Logo loaded from xcassets")
            return
        }
        
        // Fallback: try to load from bundle
        if let path = Bundle.main.path(forResource: "logo", ofType: "jpg"),
           let logoUIImage = UIImage(contentsOfFile: path) {
            cachedLogoImage = logoUIImage.cgImage
            print("[TimelapseFrameOverlay] Logo loaded from bundle")
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

    /// Get the Y position at 3/4 height (1/4 from bottom)
    private func getOverlayYPosition() -> CGFloat {
        return frameHeight * 0.75
    }

    private func drawLogo(in context: CGContext, size: CGSize) {
        guard let logo = cachedLogoImage else { return }

        // Position logo at 3/4 height on the left side
        let logoY = getOverlayYPosition() - logoSize / 2
        let logoX = horizontalPadding

        let logoRect = CGRect(x: logoX, y: logoY, width: logoSize, height: logoSize)

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

        // Configure text attributes
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .right

        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont(name: "Quicksand-SemiBold", size: timerFontSize)
                ?? UIFont.monospacedDigitSystemFont(ofSize: timerFontSize, weight: .semibold),
            .foregroundColor: UIColor.white,
            .paragraphStyle: paragraphStyle
        ]

        // Calculate timer position (right side at 3/4 height)
        let timerY = getOverlayYPosition() - timerFontSize / 2
        let timerWidth = frameWidth - horizontalPadding * 2
        let timerRect = CGRect(x: horizontalPadding, y: timerY, width: timerWidth, height: timerFontSize + 10)

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
