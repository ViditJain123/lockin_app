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

    /// Video orientation (determines frame dimensions)
    private let videoOrientation: VideoOrientation

    /// Frame dimensions (computed from orientation)
    private var frameWidth: CGFloat { CGFloat(videoOrientation.outputWidth) }
    private var frameHeight: CGFloat { CGFloat(videoOrientation.outputHeight) }

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

    // MARK: - Pre-computed Fixed Box Dimensions (minimal filter)

    /// Fixed box dimensions that never change frame-to-frame
    private var fixedBoxWidth: CGFloat = 0
    private var fixedBoxHeight: CGFloat = 0

    /// Cached fonts (created once, reused every frame)
    private var cachedTimerFont: UIFont!
    private var cachedBrandFont: UIFont!

    /// Cached attribute dictionaries
    private var cachedTimerAttributes: [NSAttributedString.Key: Any] = [:]
    private var cachedLockinAttributes: [NSAttributedString.Key: Any] = [:]
    private var cachedClubAttributes: [NSAttributedString.Key: Any] = [:]

    /// Cached brand text metrics (minimal filter)
    private var cachedBrandTotalWidth: CGFloat = 0
    private var cachedBrandHeight: CGFloat = 0
    private var cachedContentHeight: CGFloat = 0

    // MARK: - Pre-computed Fixed DateStamp Dimensions

    /// Fixed content width for dateStamp (prevents right-aligned jitter)
    private var fixedDateStampContentWidth: CGFloat = 0
    private var fixedDateStampContentHeight: CGFloat = 0

    /// Cached date text attributes
    private var cachedDateAttributes: [NSAttributedString.Key: Any] = [:]

    /// Cached logo width
    private var cachedLogoWidth: CGFloat = 0

    /// Cached timer line height (shared by both filters)
    private var cachedTimerLineHeight: CGFloat = 0

    // MARK: - Initialization

    init(timerPosition: CGPoint = CGPoint(x: 0.85, y: 0.75), filterType: String = "minimal", timerScale: CGFloat = 1.0, orientation: VideoOrientation = .portrait) {
        self.timerPosition = timerPosition
        self.filterType = TimerFilterType(rawValue: filterType) ?? .minimal
        self.timerScale = max(1.0, min(timerScale, 2.5))
        self.videoOrientation = orientation

        // Create Metal-accelerated CIContext
        if let metalDevice = MTLCreateSystemDefaultDevice() {
            self.ciContext = CIContext(mtlDevice: metalDevice, options: [
                .cacheIntermediates: false,
                .priorityRequestLow: false
            ])
        } else {
            self.ciContext = CIContext(options: [.cacheIntermediates: false])
        }

        print("[TimelapseFrameOverlay] Initialized with orientation: \(orientation.rawValue), dimensions: \(frameWidth)x\(frameHeight)")

        // Pre-compute fixed box dimensions for minimal filter
        computeFixedBoxDimensions()

        // Pre-render static overlay parts
        renderStaticOverlay()
    }

    // MARK: - Fixed Box Dimension Computation

    /// Pre-compute the fixed timer box dimensions by measuring each digit individually.
    /// This ensures the box never resizes frame-to-frame despite proportional font widths.
    private func computeFixedBoxDimensions() {
        // Create and cache fonts
        cachedTimerFont = UIFont(name: "Quicksand-SemiBold", size: timerFontSize)
            ?? UIFont.monospacedDigitSystemFont(ofSize: timerFontSize, weight: .semibold)
        cachedBrandFont = UIFont(name: "Quicksand-SemiBold", size: brandFontSize)
            ?? UIFont.systemFont(ofSize: brandFontSize, weight: .semibold)

        // Cache attribute dictionaries
        cachedTimerAttributes = [
            .font: cachedTimerFont!,
            .foregroundColor: UIColor.white
        ]
        cachedLockinAttributes = [
            .font: cachedBrandFont!,
            .foregroundColor: UIColor.white
        ]
        cachedClubAttributes = [
            .font: cachedBrandFont!,
            .foregroundColor: brandRedColor
        ]

        // Measure each digit 0-9 to find the widest one
        var maxDigitWidth: CGFloat = 0
        for digit in 0...9 {
            let digitStr = "\(digit)" as NSString
            let digitWidth = digitStr.size(withAttributes: cachedTimerAttributes).width
            maxDigitWidth = max(maxDigitWidth, digitWidth)
        }

        // Measure colon width
        let colonWidth = (":" as NSString).size(withAttributes: cachedTimerAttributes).width

        // Max timer width: 6 digits + 2 colons (HH:MM:SS)
        let maxTimerWidth = 6 * maxDigitWidth + 2 * colonWidth

        // Measure timer line height from a reference string
        cachedTimerLineHeight = ("00:00:00" as NSString).size(withAttributes: cachedTimerAttributes).height

        // Measure brand text (minimal filter)
        let lockinSize = ("LOCKIN " as NSString).size(withAttributes: cachedLockinAttributes)
        let clubSize = ("CLUB" as NSString).size(withAttributes: cachedClubAttributes)
        cachedBrandTotalWidth = lockinSize.width + clubSize.width
        cachedBrandHeight = max(lockinSize.height, clubSize.height)

        // Content height: timer + spacing + brand (minimal filter)
        cachedContentHeight = cachedTimerLineHeight + 8 + cachedBrandHeight

        // Fixed box dimensions (minimal filter)
        let contentWidth = max(maxTimerWidth, cachedBrandTotalWidth)
        fixedBoxWidth = contentWidth + timerBoxPaddingH * 2
        fixedBoxHeight = cachedContentHeight + timerBoxPaddingV * 2

        // --- DateStamp filter fixed dimensions ---

        // Cache date attributes (same font as brand)
        cachedDateAttributes = [
            .font: cachedBrandFont!,
            .foregroundColor: UIColor.white
        ]

        // Measure date text (use a representative long date for max width)
        // The actual date doesn't change during a recording, but measure a wide sample
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "d MMM, yyyy"
        let currentDateString = dateFormatter.string(from: Date())
        let dateSize = (currentDateString as NSString).size(withAttributes: cachedDateAttributes)

        // Cache logo width
        if let logo = logoImage {
            cachedLogoWidth = (logo.size.width / logo.size.height) * logoHeight
        } else {
            cachedLogoWidth = logoHeight
        }

        // Fixed content width for dateStamp: use maxTimerWidth instead of per-frame timerSize.width
        fixedDateStampContentWidth = max(maxTimerWidth, max(dateSize.width, cachedLogoWidth))

        // Fixed content height for dateStamp
        let spacing: CGFloat = 8
        fixedDateStampContentHeight = cachedTimerLineHeight + spacing + dateSize.height + spacing + logoHeight

        print("[TimelapseFrameOverlay] Fixed box dimensions: \(fixedBoxWidth) x \(fixedBoxHeight), dateStamp content: \(fixedDateStampContentWidth) x \(fixedDateStampContentHeight)")
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

        // Use pre-computed fixed box dimensions (constant every frame)
        let boxPosition = getTimerBoxPosition(boxWidth: fixedBoxWidth, boxHeight: fixedBoxHeight)

        // Draw box background (semi-transparent black with 50% opacity) - NO border
        let boxRect = CGRect(x: boxPosition.x, y: boxPosition.y, width: fixedBoxWidth, height: fixedBoxHeight)
        let boxPath = UIBezierPath(roundedRect: boxRect, cornerRadius: timerBoxCornerRadius)

        // Fill with semi-transparent black
        UIColor.black.withAlphaComponent(0.5).setFill()
        boxPath.fill()

        // Measure the actual timer string for centering (NOT for box sizing)
        let timerSize = (timerString as NSString).size(withAttributes: cachedTimerAttributes)

        // Draw timer text centered horizontally within the fixed box, using its natural size
        let timerX = boxPosition.x + (fixedBoxWidth - timerSize.width) / 2
        let timerY = boxPosition.y + timerBoxPaddingV
        let timerRect = CGRect(x: timerX, y: timerY, width: timerSize.width, height: timerSize.height)
        (timerString as NSString).draw(in: timerRect, withAttributes: cachedTimerAttributes)

        // Draw brand text centered horizontally within the fixed box, below timer
        let brandY = timerY + timerSize.height + 8
        let brandX = boxPosition.x + (fixedBoxWidth - cachedBrandTotalWidth) / 2

        // Measure brand parts for drawing rects (use cached attributes)
        let lockinSize = ("LOCKIN " as NSString).size(withAttributes: cachedLockinAttributes)
        let clubSize = ("CLUB" as NSString).size(withAttributes: cachedClubAttributes)

        // Draw "LOCKIN " in white
        let lockinRect = CGRect(x: brandX, y: brandY, width: lockinSize.width, height: lockinSize.height)
        ("LOCKIN " as NSString).draw(in: lockinRect, withAttributes: cachedLockinAttributes)

        // Draw "CLUB" in red
        let clubRect = CGRect(x: brandX + lockinSize.width, y: brandY, width: clubSize.width, height: clubSize.height)
        ("CLUB" as NSString).draw(in: clubRect, withAttributes: cachedClubAttributes)

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

        // Use pre-computed fixed content dimensions for stable positioning
        let contentWidth = fixedDateStampContentWidth
        let contentHeight = fixedDateStampContentHeight
        let spacing: CGFloat = 8

        // Calculate position - right-aligned based on timerPosition (using fixed width)
        let rightEdge = timerPosition.x * frameWidth + contentWidth / 2
        let clampedRightEdge = min(rightEdge, frameWidth - horizontalPadding)
        let contentX = clampedRightEdge - contentWidth

        // Vertical position centered on timerPosition.y (using fixed height)
        let centerY = timerPosition.y * frameHeight
        let contentTopY = centerY - contentHeight / 2
        let clampedTopY = max(horizontalPadding, min(contentTopY, frameHeight - contentHeight - horizontalPadding))

        // Measure actual text sizes for right-aligned drawing within the fixed content area
        let timerSize = (timerString as NSString).size(withAttributes: cachedTimerAttributes)
        let dateSize = (dateString as NSString).size(withAttributes: cachedDateAttributes)

        // Draw timer text (right-aligned within fixed content width)
        let timerX = contentX + (contentWidth - timerSize.width)
        let timerY = clampedTopY
        let timerRect = CGRect(x: timerX, y: timerY, width: timerSize.width, height: timerSize.height)
        (timerString as NSString).draw(in: timerRect, withAttributes: cachedTimerAttributes)

        // Draw date text (right-aligned within fixed content width, below timer)
        let dateY = timerY + cachedTimerLineHeight + spacing
        let dateX = contentX + (contentWidth - dateSize.width)
        let dateRect = CGRect(x: dateX, y: dateY, width: dateSize.width, height: dateSize.height)
        (dateString as NSString).draw(in: dateRect, withAttributes: cachedDateAttributes)

        // Draw logo (right-aligned within fixed content width, below date)
        if let logo = logoImage {
            let logoY = dateY + dateSize.height + spacing
            let logoX = contentX + (contentWidth - cachedLogoWidth)
            let logoRect = CGRect(x: logoX, y: logoY, width: cachedLogoWidth, height: logoHeight)
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
