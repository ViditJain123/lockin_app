import Foundation
import CoreGraphics
import UIKit

/// Timer filter types matching React Native definitions
enum TimerFilterType: String {
    case minimal = "minimal"
    case dateStamp = "dateStamp"
}

/// Renders branded frame overlay for timelapse videos.
/// Draws timer, gradient, and branding directly onto camera frames using CoreGraphics.
class TimelapseFrameOverlay {

    // MARK: - Configuration

    private let frameWidth: CGFloat
    private let frameHeight: CGFloat

    /// Timer position (percentage 0-1)
    private let timerPosition: CGPoint

    /// Timer filter type
    private let filterType: TimerFilterType

    /// Timer scale (1.0 = default, max 2.5)
    private let timerScale: CGFloat

    /// Horizontal padding for bounds clamping
    private let horizontalPadding: CGFloat = 40

    /// Timer box design - base values before timerScale
    private let baseTimerBoxPaddingH: CGFloat = 35
    private let baseTimerBoxPaddingV: CGFloat = 23
    private let baseTimerBoxCornerRadius: CGFloat = 23
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

    private var cachedGradientOverlay: CGImage?

    /// Logo image for dateStamp filter
    private lazy var logoImage: UIImage? = {
        return UIImage(named: "logo-no-bg-cropped")
    }()

    // MARK: - Initialization

    init(timerPosition: CGPoint = CGPoint(x: 0.85, y: 0.75),
         filterType: String = "minimal",
         timerScale: CGFloat = 1.0,
         frameWidth: Int,
         frameHeight: Int) {
        self.timerPosition = timerPosition
        self.filterType = TimerFilterType(rawValue: filterType) ?? .minimal
        self.timerScale = max(1.0, min(timerScale, 2.5))
        self.frameWidth = CGFloat(frameWidth)
        self.frameHeight = CGFloat(frameHeight)

        // Pre-render static gradient
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

        context.clear(CGRect(origin: .zero, size: size))
        drawBottomGradient(in: context, size: size)

        if let image = UIGraphicsGetImageFromCurrentImageContext()?.cgImage {
            cachedGradientOverlay = image
        }

        UIGraphicsEndImageContext()
    }

    private func drawBottomGradient(in context: CGContext, size: CGSize) {
        let gradientColors = [
            UIColor.black.withAlphaComponent(0.5).cgColor,
            UIColor.black.withAlphaComponent(0.0).cgColor
        ]

        let colorSpace = CGColorSpaceCreateDeviceRGB()
        guard let gradient = CGGradient(
            colorsSpace: colorSpace,
            colors: gradientColors as CFArray,
            locations: [0.0, 1.0]
        ) else { return }

        let startPoint = CGPoint(x: size.width / 2, y: size.height)
        let endPoint = CGPoint(x: size.width / 2, y: size.height / 2)

        context.drawLinearGradient(gradient, start: startPoint, end: endPoint, options: [])
    }

    // MARK: - Timer Box Position

    private func getTimerBoxPosition(boxWidth: CGFloat, boxHeight: CGFloat) -> CGPoint {
        let centerX = timerPosition.x * frameWidth
        let centerY = timerPosition.y * frameHeight

        let boxX = centerX - boxWidth / 2
        let boxY = centerY - boxHeight / 2

        let clampedX = max(horizontalPadding, min(boxX, frameWidth - boxWidth - horizontalPadding))
        let clampedY = max(horizontalPadding, min(boxY, frameHeight - boxHeight - horizontalPadding))

        return CGPoint(x: clampedX, y: clampedY)
    }

    // MARK: - Font Helper

    private func timerFont(size: CGFloat) -> UIFont {
        return UIFont(name: "Menlo-Bold", size: size)
            ?? UIFont.monospacedSystemFont(ofSize: size, weight: .bold)
    }

    // MARK: - Minimal Filter

    private func renderMinimalFilter(_ seconds: Int) -> CGImage? {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        let secs = seconds % 60
        let timerString = String(format: "%02d:%02d:%02d", hours, minutes, secs)

        let size = CGSize(width: frameWidth, height: frameHeight)

        UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
        guard UIGraphicsGetCurrentContext() != nil else {
            UIGraphicsEndImageContext()
            return nil
        }

        let font = timerFont(size: timerFontSize)
        let brandFont = timerFont(size: brandFontSize)

        let timerAttributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: UIColor.white
        ]

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

        let timerSize = (timerString as NSString).size(withAttributes: timerAttributes)
        let lockinSize = (lockinText as NSString).size(withAttributes: lockinAttributes)
        let clubSize = (clubText as NSString).size(withAttributes: clubAttributes)
        let brandTotalWidth = lockinSize.width + clubSize.width
        let brandHeight = max(lockinSize.height, clubSize.height)

        let contentWidth = max(timerSize.width, brandTotalWidth)
        let contentHeight = timerSize.height + 8 + brandHeight
        let boxWidth = contentWidth + timerBoxPaddingH * 2
        let boxHeight = contentHeight + timerBoxPaddingV * 2

        let boxPosition = getTimerBoxPosition(boxWidth: boxWidth, boxHeight: boxHeight)

        // Draw box background
        let boxRect = CGRect(x: boxPosition.x, y: boxPosition.y, width: boxWidth, height: boxHeight)
        let boxPath = UIBezierPath(roundedRect: boxRect, cornerRadius: timerBoxCornerRadius)
        UIColor.black.withAlphaComponent(0.5).setFill()
        boxPath.fill()

        // Draw timer text (centered)
        let timerX = boxPosition.x + (boxWidth - timerSize.width) / 2
        let timerY = boxPosition.y + timerBoxPaddingV
        (timerString as NSString).draw(
            in: CGRect(x: timerX, y: timerY, width: timerSize.width, height: timerSize.height),
            withAttributes: timerAttributes
        )

        // Draw brand text (centered, below timer)
        let brandY = timerY + timerSize.height + 8
        let brandX = boxPosition.x + (boxWidth - brandTotalWidth) / 2
        (lockinText as NSString).draw(
            in: CGRect(x: brandX, y: brandY, width: lockinSize.width, height: lockinSize.height),
            withAttributes: lockinAttributes
        )
        (clubText as NSString).draw(
            in: CGRect(x: brandX + lockinSize.width, y: brandY, width: clubSize.width, height: clubSize.height),
            withAttributes: clubAttributes
        )

        let image = UIGraphicsGetImageFromCurrentImageContext()?.cgImage
        UIGraphicsEndImageContext()
        return image
    }

    // MARK: - DateStamp Filter

    private func renderDateStampFilter(_ seconds: Int) -> CGImage? {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        let secs = seconds % 60
        let timerString = String(format: "%02d:%02d:%02d", hours, minutes, secs)

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "d MMM, yyyy"
        let dateString = dateFormatter.string(from: Date())

        let size = CGSize(width: frameWidth, height: frameHeight)

        UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
        guard UIGraphicsGetCurrentContext() != nil else {
            UIGraphicsEndImageContext()
            return nil
        }

        let font = timerFont(size: timerFontSize)
        let dateFont = timerFont(size: brandFontSize)

        let timerAttributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: UIColor.white
        ]
        let dateAttributes: [NSAttributedString.Key: Any] = [
            .font: dateFont,
            .foregroundColor: UIColor.white
        ]

        let timerSize = (timerString as NSString).size(withAttributes: timerAttributes)
        let dateSize = (dateString as NSString).size(withAttributes: dateAttributes)

        let logoW: CGFloat = logoImage != nil ? (logoImage!.size.width / logoImage!.size.height) * logoHeight : logoHeight
        let spacing: CGFloat = 8
        let contentWidth = max(timerSize.width, max(dateSize.width, logoW))
        let contentHeight = timerSize.height + spacing + dateSize.height + spacing + logoHeight

        // Right-aligned positioning
        let rightEdge = timerPosition.x * frameWidth + contentWidth / 2
        let clampedRightEdge = min(rightEdge, frameWidth - horizontalPadding)
        let contentX = clampedRightEdge - contentWidth

        let centerY = timerPosition.y * frameHeight
        let contentTopY = centerY - contentHeight / 2
        let clampedTopY = max(horizontalPadding, min(contentTopY, frameHeight - contentHeight - horizontalPadding))

        // Timer (right-aligned)
        let timerX = contentX + (contentWidth - timerSize.width)
        (timerString as NSString).draw(
            in: CGRect(x: timerX, y: clampedTopY, width: timerSize.width, height: timerSize.height),
            withAttributes: timerAttributes
        )

        // Date (right-aligned, below timer)
        let dateY = clampedTopY + timerSize.height + spacing
        let dateX = contentX + (contentWidth - dateSize.width)
        (dateString as NSString).draw(
            in: CGRect(x: dateX, y: dateY, width: dateSize.width, height: dateSize.height),
            withAttributes: dateAttributes
        )

        // Logo (right-aligned, below date)
        if let logo = logoImage {
            let logoY = dateY + dateSize.height + spacing
            let logoX = contentX + (contentWidth - logoW)
            logo.draw(in: CGRect(x: logoX, y: logoY, width: logoW, height: logoHeight))
        }

        let image = UIGraphicsGetImageFromCurrentImageContext()?.cgImage
        UIGraphicsEndImageContext()
        return image
    }

    // MARK: - Aspect-fill helper

    private func aspectFillRect(imageSize: CGSize, targetSize: CGSize) -> CGRect {
        let widthRatio = targetSize.width / imageSize.width
        let heightRatio = targetSize.height / imageSize.height
        let scale = max(widthRatio, heightRatio)
        let scaledW = imageSize.width * scale
        let scaledH = imageSize.height * scale
        let x = (targetSize.width - scaledW) / 2
        let y = (targetSize.height - scaledH) / 2
        return CGRect(x: x, y: y, width: scaledW, height: scaledH)
    }

    // MARK: - Public API

    /// Apply overlay (gradient + timer) to a camera frame
    func applyOverlay(to image: UIImage, elapsedSeconds: Int) -> UIImage {
        let size = CGSize(width: frameWidth, height: frameHeight)

        UIGraphicsBeginImageContextWithOptions(size, true, 1.0)
        defer { UIGraphicsEndImageContext() }

        // Draw the camera frame aspect-filled into the target rect so a 4:3
        // capture isn't horizontally squished into a 9:16 output.
        let cameraRect = aspectFillRect(imageSize: image.size, targetSize: size)
        image.draw(in: cameraRect)

        // Draw cached gradient overlay
        if let gradient = cachedGradientOverlay {
            UIImage(cgImage: gradient).draw(in: CGRect(origin: .zero, size: size))
        }

        // Render and draw timer
        let timerImage: CGImage?
        switch filterType {
        case .minimal:
            timerImage = renderMinimalFilter(elapsedSeconds)
        case .dateStamp:
            timerImage = renderDateStampFilter(elapsedSeconds)
        }

        if let timer = timerImage {
            UIImage(cgImage: timer).draw(in: CGRect(origin: .zero, size: size))
        }

        return UIGraphicsGetImageFromCurrentImageContext() ?? image
    }
}
