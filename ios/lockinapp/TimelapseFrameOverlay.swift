import Foundation
import CoreImage
import CoreGraphics
import UIKit

/// Renders branded frame overlay for timelapse videos
/// Includes: black frame (square outer, rounded inner), left trapezium with logo and vertical timer
class TimelapseFrameOverlay {
    
    // MARK: - Configuration
    
    /// Frame dimensions (must match encoder output)
    private let frameWidth: CGFloat = 1080
    private let frameHeight: CGFloat = 1920
    
    /// Frame border configuration - THICKER
    private let borderWidth: CGFloat = 48
    private let innerCornerRadius: CGFloat = 64  // Only inner box has radius
    
    /// Trapezoid configuration - wider on left (at edge), narrower on right (inward)
    private let trapezoidLeftWidth: CGFloat = 320         // Vertical span of left edge (wider = more slant)
    private let trapezoidRightWidth: CGFloat = 140        // Horizontal depth into screen
    private let trapezoidHeight: CGFloat = 430            // Total height
    private let trapezoidCornerRadius: CGFloat = 0
    
    /// Logo configuration - sized for trapezoid
    private let logoSize: CGFloat = 140
    private let logoTopPadding: CGFloat = 30

    /// Timer configuration - vertical display (MM over SS) - sized for trapezoid
    private let timerFontSize: CGFloat = 56
    private let timerLineSpacing: CGFloat = 8
    
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
        
        // Draw rectangle panel on the left (centered vertically) - no border frame
        drawTrapezium(in: context, size: size)
        
        // Draw logo in trapezium
        drawLogo(in: context, size: size)
        
        // Get the rendered image
        if let image = UIGraphicsGetImageFromCurrentImageContext()?.cgImage {
            cachedOverlayWithoutTimer = image
            print("[TimelapseFrameOverlay] Static overlay cached successfully")
        }
        
        UIGraphicsEndImageContext()
    }
    
    private func drawFrameBorder(in context: CGContext, size: CGSize) {
        context.setFillColor(UIColor.black.cgColor)
        
        // Outer rect - SQUARE corners (edge to edge)
        let outerRect = CGRect(origin: .zero, size: size)
        let outerPath = UIBezierPath(rect: outerRect)  // Square corners
        
        // Inner rect - ROUNDED corners (content area)
        let innerRect = CGRect(
            x: borderWidth,
            y: borderWidth,
            width: size.width - borderWidth * 2,
            height: size.height - borderWidth * 2
        )
        let innerPath = UIBezierPath(roundedRect: innerRect, cornerRadius: innerCornerRadius)
        
        // Use even-odd fill to create hollow effect
        outerPath.append(innerPath)
        outerPath.usesEvenOddFillRule = true
        
        context.addPath(outerPath.cgPath)
        context.fillPath(using: .evenOdd)
    }
    
    private func drawTrapezium(in context: CGContext, size: CGSize) {
        context.setFillColor(UIColor.black.withAlphaComponent(0.4).cgColor)

        // Calculate trapezoid position - centered vertically on left side
        let centerY = size.height / 2
        let topY = centerY - trapezoidHeight / 2
        let bottomY = centerY + trapezoidHeight / 2

        // Trapezoid shape: WIDER on left (at screen edge), NARROWER on right (facing inward)
        // The right edge is shorter, so top-right and bottom-right are indented
        let rightIndent = (trapezoidLeftWidth - trapezoidRightWidth) / 2  // Will be negative, flip the logic
        let widerWidth = trapezoidLeftWidth    // Left side (at edge) is wider
        let narrowerWidth = trapezoidRightWidth // Right side (inward) is narrower
        let indent = (widerWidth - narrowerWidth) / 2

        // Points (going clockwise from top-left)
        let topLeft = CGPoint(x: 0, y: topY)                              // Full height at left edge
        let topRight = CGPoint(x: narrowerWidth, y: topY + indent)        // Indented from top
        let bottomRight = CGPoint(x: narrowerWidth, y: bottomY - indent)  // Indented from bottom
        let bottomLeft = CGPoint(x: 0, y: bottomY)                        // Full height at left edge

        let path = UIBezierPath()
        let r = trapezoidCornerRadius

        // Start from top-left (after corner - but left edge is at x=0, so no left rounding needed)
        path.move(to: CGPoint(x: topLeft.x, y: topLeft.y))

        // Top slanted edge to top-right corner
        path.addLine(to: CGPoint(x: topRight.x - r, y: topRight.y - r * 0.5))

        // Top-right corner (curved)
        path.addQuadCurve(
            to: CGPoint(x: topRight.x, y: topRight.y + r),
            controlPoint: topRight
        )

        // Right edge straight down
        path.addLine(to: CGPoint(x: bottomRight.x, y: bottomRight.y - r))

        // Bottom-right corner (curved)
        path.addQuadCurve(
            to: CGPoint(x: bottomRight.x - r, y: bottomRight.y + r * 0.5),
            controlPoint: bottomRight
        )

        // Bottom slanted edge to bottom-left
        path.addLine(to: CGPoint(x: bottomLeft.x, y: bottomLeft.y))

        // Left edge back up to start (straight, flush with screen edge)
        path.addLine(to: CGPoint(x: topLeft.x, y: topLeft.y))
        path.close()

        context.addPath(path.cgPath)
        context.fillPath()
    }
    
    /// Calculate the center X of the trapezoid for positioning content
    private func getTrapezoidCenterX() -> CGFloat {
        // Horizontal center of trapezoid (spans from x=0 to x=trapezoidRightWidth)
        return trapezoidRightWidth / 2
    }

    /// Calculate the Y position for the trapezoid center
    private func getTrapezoidCenterY() -> CGFloat {
        return frameHeight / 2
    }
    
    private func drawLogo(in context: CGContext, size: CGSize) {
        guard let logo = cachedLogoImage else { return }

        // Calculate total content height (logo + spacing + timer lines)
        let timerHeight = (timerFontSize + timerLineSpacing) * 2
        let spacingBetweenLogoAndTimer: CGFloat = 10
        let totalContentHeight = logoSize + spacingBetweenLogoAndTimer + timerHeight

        // Calculate logo position (centered both horizontally and vertically in trapezoid)
        let trapezoidCenterY = getTrapezoidCenterY()
        let trapezoidCenterX = getTrapezoidCenterX()

        // Vertically center the entire content block (logo + timer)
        let contentStartY = trapezoidCenterY - totalContentHeight / 2

        let logoX = trapezoidCenterX - logoSize / 2
        let logoY = contentStartY

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
        // Calculate minutes and seconds from total seconds (MM:SS format)
        let minutes = seconds / 60
        let secs = seconds % 60
        
        // Format as two lines: MM on top, SS below
        let minutesString = String(format: "%02d", minutes)
        let secondsString = String(format: "%02d", secs)
        
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
        paragraphStyle.alignment = .center
        
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.monospacedDigitSystemFont(ofSize: timerFontSize, weight: .bold),
            .foregroundColor: UIColor.white,
            .paragraphStyle: paragraphStyle
        ]
        
        // Calculate timer position (below logo, centered in trapezoid)
        let trapezoidCenterX = getTrapezoidCenterX()
        let trapezoidCenterY = getTrapezoidCenterY()

        // Calculate total content height to center everything
        let timerHeight = (timerFontSize + timerLineSpacing) * 2
        let spacingBetweenLogoAndTimer: CGFloat = 10
        let totalContentHeight = logoSize + spacingBetweenLogoAndTimer + timerHeight

        // Vertically center the entire content block (logo + timer)
        let contentStartY = trapezoidCenterY - totalContentHeight / 2
        let timerStartY = contentStartY + logoSize + spacingBetweenLogoAndTimer

        // Use trapezoid center X for horizontal centering
        let timerWidth: CGFloat = trapezoidCenterX * 2
        let lineHeight = timerFontSize + timerLineSpacing
        
        // Draw minutes (MM)
        let minutesRect = CGRect(x: 0, y: timerStartY, width: timerWidth, height: lineHeight)
        (minutesString as NSString).draw(in: minutesRect, withAttributes: attributes)
        
        // Draw seconds (SS) below minutes
        let secondsRect = CGRect(x: 0, y: timerStartY + lineHeight, width: timerWidth, height: lineHeight)
        (secondsString as NSString).draw(in: secondsRect, withAttributes: attributes)
        
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
        
        // Composite static overlay (frame + trapezium + logo)
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
