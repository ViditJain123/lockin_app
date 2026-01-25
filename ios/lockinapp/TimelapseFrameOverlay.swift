import Foundation
import CoreImage
import CoreGraphics
import UIKit

/// Timer filter types matching React Native definitions
enum TimerFilterType: String {
    case minimal = "minimal"
    case dateStamp = "dateStamp"
}

/// Renders branded frame overlay for timelapse videos
/// Includes: bottom gradient and boxed timer with "LOCKIN CLUB" branding
class TimelapseFrameOverlay {

    // MARK: - Configuration

    /// Frame dimensions (must match encoder output)
    private let frameWidth: CGFloat = 1080
    private let frameHeight: CGFloat = 1920

    /// Timer position (percentage 0-1)
    private let timerPosition: CGPoint

    /// Timer filter type
    private let filterType: TimerFilterType

    /// Timer scale (1.0 = default, max 2.5)
    private let timerScale: CGFloat

    /// Horizontal padding for bounds clamping
    private let horizontalPadding: CGFloat = 40

    /// Timer box design (scaled from React Native ~2.88x) - base values before timerScale
    private let baseTimerBoxPaddingH: CGFloat = 35
    private let baseTimerBoxPaddingV: CGFloat = 23
    private let baseTimerBoxCornerRadius: CGFloat = 23
    private let baseTimerBoxBorderWidth: CGFloat = 6
    private let baseTimerFontSize: CGFloat = 60
    private let baseBrandFontSize: CGFloat = 32
    private let baseLogoHeight: CGFloat = 50

    // Computed scaled values
    private var timerBoxPaddingH: CGFloat { baseTimerBoxPaddingH * timerScale }
    private var timerBoxPaddingV: CGFloat { baseTimerBoxPaddingV * timerScale }
    private var timerBoxCornerRadius: CGFloat { baseTimerBoxCornerRadius * timerScale }
    private var timerFontSize: CGFloat { baseTimerFontSize * timerScale }
    private var brandFontSize: CGFloat { baseBrandFontSize * timerScale }
    private var logoHeight: CGFloat { baseLogoHeight * timerScale }

    /// Colors
    private let brandRedColor = UIColor(red: 1.0, green: 0.231, blue: 0.361, alpha: 1.0) // #FF3B5C

    // MARK: - Cached Assets

    private var cachedOverlayWithoutTimer: CGImage?
    private let ciContext: CIContext

    /// Logo image for dateStamp filter
    private lazy var logoImage: UIImage? = {
        return UIImage(named: "logo-no-bg-cropped")
    }()

    // MARK: - Initialization

    init(timerPosition: CGPoint = CGPoint(x: 0.85, y: 0.75), filterType: String = "minimal", timerScale: CGFloat = 1.0) {
        self.timerPosition = timerPosition
        self.filterType = TimerFilterType(rawValue: filterType) ?? .minimal
        self.timerScale = max(1.0, min(timerScale, 2.5))

        // Create Metal-accelerated CIContext
        if let metalDevice = MTLCreateSystemDefaultDevice() {
            self.ciContext = CIContext(mtlDevice: metalDevice, options: [
                .cacheIntermediates: false,
                .priorityRequestLow: false
            ])
        } else {
            self.ciContext = CIContext(options: [.cacheIntermediates: false])
        }

        // Pre-render static overlay parts
        renderStaticOverlay()
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

    // MARK: - Timer Box Position

    /// Calculate timer box position based on user's draggable position
    private func getTimerBoxPosition(boxWidth: CGFloat, boxHeight: CGFloat) -> CGPoint {
        // Convert percentage to pixel position (center-based)
        let centerX = timerPosition.x * frameWidth
        let centerY = timerPosition.y * frameHeight

        // Calculate top-left corner
        let boxX = centerX - boxWidth / 2
        let boxY = centerY - boxHeight / 2

        // Clamp to frame bounds with padding
        let clampedX = max(horizontalPadding, min(boxX, frameWidth - boxWidth - horizontalPadding))
        let clampedY = max(horizontalPadding, min(boxY, frameHeight - boxHeight - horizontalPadding))

        return CGPoint(x: clampedX, y: clampedY)
    }

    // MARK: - Timer Rendering

    private func renderTimerText(_ seconds: Int) -> CGImage? {
        switch filterType {
        case .minimal:
            return renderMinimalFilter(seconds)
        case .dateStamp:
            return renderDateStampFilter(seconds)
        }
    }

    // MARK: - Minimal Filter (Timer + LOCKIN CLUB, with background, no border)

    private func renderMinimalFilter(_ seconds: Int) -> CGImage? {
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

        // Configure timer text attributes
        let timerFont = UIFont(name: "Quicksand-SemiBold", size: timerFontSize)
            ?? UIFont.monospacedDigitSystemFont(ofSize: timerFontSize, weight: .semibold)

        let timerAttributes: [NSAttributedString.Key: Any] = [
            .font: timerFont,
            .foregroundColor: UIColor.white
        ]

        // Configure brand text attributes
        let brandFont = UIFont(name: "Quicksand-SemiBold", size: brandFontSize)
            ?? UIFont.systemFont(ofSize: brandFontSize, weight: .semibold)

        // Measure text sizes
        let timerSize = (timerString as NSString).size(withAttributes: timerAttributes)

        // "LOCKIN " in white + "CLUB" in red
        let lockinText = "LOCKIN "
        let clubText = "CLUB"

        let lockinAttributes: [NSAttributedString.Key: Any] = [
            .font: brandFont,
            .foregroundColor: UIColor.white
        ]
        let clubAttributes: [NSAttributedString.Key: Any] = [
            .font: brandFont,
            .foregroundColor: brandRedColor
        ]

        let lockinSize = (lockinText as NSString).size(withAttributes: lockinAttributes)
        let clubSize = (clubText as NSString).size(withAttributes: clubAttributes)
        let brandTotalWidth = lockinSize.width + clubSize.width
        let brandHeight = max(lockinSize.height, clubSize.height)

        // Calculate box dimensions
        let contentWidth = max(timerSize.width, brandTotalWidth)
        let contentHeight = timerSize.height + 8 + brandHeight // 8pt spacing between timer and brand
        let boxWidth = contentWidth + timerBoxPaddingH * 2
        let boxHeight = contentHeight + timerBoxPaddingV * 2

        // Get position for the timer box
        let boxPosition = getTimerBoxPosition(boxWidth: boxWidth, boxHeight: boxHeight)

        // Draw box background (semi-transparent black with 50% opacity) - NO border
        let boxRect = CGRect(x: boxPosition.x, y: boxPosition.y, width: boxWidth, height: boxHeight)
        let boxPath = UIBezierPath(roundedRect: boxRect, cornerRadius: timerBoxCornerRadius)

        // Fill with semi-transparent black
        UIColor.black.withAlphaComponent(0.5).setFill()
        boxPath.fill()

        // Draw timer text (centered horizontally in box)
        let timerX = boxPosition.x + (boxWidth - timerSize.width) / 2
        let timerY = boxPosition.y + timerBoxPaddingV
        let timerRect = CGRect(x: timerX, y: timerY, width: timerSize.width, height: timerSize.height)
        (timerString as NSString).draw(in: timerRect, withAttributes: timerAttributes)

        // Draw brand text (centered horizontally in box, below timer)
        let brandY = timerY + timerSize.height + 8
        let brandX = boxPosition.x + (boxWidth - brandTotalWidth) / 2

        // Draw "LOCKIN " in white
        let lockinRect = CGRect(x: brandX, y: brandY, width: lockinSize.width, height: lockinSize.height)
        (lockinText as NSString).draw(in: lockinRect, withAttributes: lockinAttributes)

        // Draw "CLUB" in red
        let clubRect = CGRect(x: brandX + lockinSize.width, y: brandY, width: clubSize.width, height: clubSize.height)
        (clubText as NSString).draw(in: clubRect, withAttributes: clubAttributes)

        let image = UIGraphicsGetImageFromCurrentImageContext()?.cgImage
        UIGraphicsEndImageContext()

        return image
    }

    // MARK: - DateStamp Filter (Timer + Date + Logo, right-aligned, no background)

    private func renderDateStampFilter(_ seconds: Int) -> CGImage? {
        // Calculate hours, minutes, and seconds from total seconds (HH:MM:SS format)
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        let secs = seconds % 60

        // Format timer as HH:MM:SS
        let timerString = String(format: "%02d:%02d:%02d", hours, minutes, secs)

        // Format date as "d MMM, yyyy" (e.g., "13 Dec, 2026")
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "d MMM, yyyy"
        let dateString = dateFormatter.string(from: Date())

        let size = CGSize(width: frameWidth, height: frameHeight)

        UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
        guard let context = UIGraphicsGetCurrentContext() else {
            UIGraphicsEndImageContext()
            return nil
        }

        // Clear background
        context.clear(CGRect(origin: .zero, size: size))

        // Configure timer text attributes (slightly larger for dateStamp)
        let timerFont = UIFont(name: "Quicksand-SemiBold", size: timerFontSize)
            ?? UIFont.monospacedDigitSystemFont(ofSize: timerFontSize, weight: .semibold)

        let timerAttributes: [NSAttributedString.Key: Any] = [
            .font: timerFont,
            .foregroundColor: UIColor.white
        ]

        // Configure date text attributes
        let dateFont = UIFont(name: "Quicksand-SemiBold", size: brandFontSize)
            ?? UIFont.systemFont(ofSize: brandFontSize, weight: .semibold)

        let dateAttributes: [NSAttributedString.Key: Any] = [
            .font: dateFont,
            .foregroundColor: UIColor.white
        ]

        // Measure text sizes
        let timerSize = (timerString as NSString).size(withAttributes: timerAttributes)
        let dateSize = (dateString as NSString).size(withAttributes: dateAttributes)

        // Logo dimensions (scale to fit) - using computed logoHeight which includes timerScale
        let logoWidth: CGFloat = logoImage != nil ? (logoImage!.size.width / logoImage!.size.height) * logoHeight : logoHeight

        // Calculate total content dimensions
        let contentWidth = max(timerSize.width, max(dateSize.width, logoWidth))
        let spacing: CGFloat = 8
        let contentHeight = timerSize.height + spacing + dateSize.height + spacing + logoHeight

        // Calculate position - right-aligned based on timerPosition
        // timerPosition.x represents center, but dateStamp is right-aligned
        let rightEdge = timerPosition.x * frameWidth + contentWidth / 2
        let clampedRightEdge = min(rightEdge, frameWidth - horizontalPadding)
        let contentX = clampedRightEdge - contentWidth

        // Vertical position centered on timerPosition.y
        let centerY = timerPosition.y * frameHeight
        let contentTopY = centerY - contentHeight / 2
        let clampedTopY = max(horizontalPadding, min(contentTopY, frameHeight - contentHeight - horizontalPadding))

        // Draw timer text (right-aligned)
        let timerX = contentX + (contentWidth - timerSize.width)
        let timerY = clampedTopY
        let timerRect = CGRect(x: timerX, y: timerY, width: timerSize.width, height: timerSize.height)
        (timerString as NSString).draw(in: timerRect, withAttributes: timerAttributes)

        // Draw date text (right-aligned, below timer)
        let dateY = timerY + timerSize.height + spacing
        let dateX = contentX + (contentWidth - dateSize.width)
        let dateRect = CGRect(x: dateX, y: dateY, width: dateSize.width, height: dateSize.height)
        (dateString as NSString).draw(in: dateRect, withAttributes: dateAttributes)

        // Draw logo (right-aligned, below date)
        if let logo = logoImage {
            let logoY = dateY + dateSize.height + spacing
            let logoX = contentX + (contentWidth - logoWidth)
            let logoRect = CGRect(x: logoX, y: logoY, width: logoWidth, height: logoHeight)
            logo.draw(in: logoRect)
        }

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

        // Composite static overlay (gradient only)
        if let staticOverlay = cachedOverlayWithoutTimer {
            let overlayCI = CIImage(cgImage: staticOverlay)
            result = overlayCI.composited(over: result)
        }

        // Composite timer box (rendered fresh each time with current elapsed seconds)
        if let timerImage = renderTimerText(elapsedSeconds) {
            let timerCI = CIImage(cgImage: timerImage)
            result = timerCI.composited(over: result)
        }

        return result
    }
}
