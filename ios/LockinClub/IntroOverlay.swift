import Foundation
import CoreGraphics
import UIKit

struct IntroOverlayInputs {
    let sessionDurationSeconds: TimeInterval
    let sessionStartDate: Date
    let videoSize: CGSize
}

/// Draws a 2-second animated intro on top of the first 60 output frames
/// of the timelapse export. All static content (black fill, brand-red
/// diagonal gradients, logo, duration text, date text) is pre-rendered
/// into cached CGImages during init. Per-frame work is just alpha-blended
/// image draws — tens of microseconds each.
final class IntroOverlay {

    // MARK: - Constants

    /// 2 seconds at 30fps. Static so callers (e.g. TimelapseModule) can
    /// reference it without instantiating an IntroOverlay.
    static let introFrameCount: Int = 60
    var introFrameCount: Int { Self.introFrameCount }

    private static let brandRed = UIColor(red: 1.0, green: 0.231, blue: 0.361, alpha: 1.0) // #FF3B5C

    private static let blackPeakAlpha: Double = 0.85
    private static let gradientPeakAlpha: Double = 0.32

    // Normalized animation timeline (t in 0...1 across the 2s intro).
    // Everything is fully visible from t=0 and holds flat until the fade-out
    // at the very end.
    private static let holdEnd: Double = 0.85            // 0.0 – 1.7 s full overlay
    private static let fadeOutEnd: Double = 1.0          // 1.7 – 2.0 s fade out

    // MARK: - Inputs

    private let videoSize: CGSize
    private let duration: TimeInterval
    private let date: Date

    // MARK: - Cached pre-rendered images

    private var blackImage: CGImage?
    private var gradientTopLeft: CGImage?
    private var gradientBottomRight: CGImage?
    private var logoImage: CGImage?
    private var durationLabelImage: CGImage?
    private var durationTextImage: CGImage?
    private var dateLabelImage: CGImage?
    private var dateTextImage: CGImage?

    // MARK: - Cached layout rects (in UIKit top-left coordinates)

    private var logoRect: CGRect = .zero
    private var durationLabelRect: CGRect = .zero
    private var durationRect: CGRect = .zero
    private var dateLabelRect: CGRect = .zero
    private var dateRect: CGRect = .zero

    // MARK: - Init

    init(inputs: IntroOverlayInputs) {
        self.videoSize = inputs.videoSize
        self.duration = inputs.sessionDurationSeconds
        self.date = inputs.sessionStartDate

        prerenderBlack()
        prerenderGradients()
        prerenderLogoAndText()
    }

    // MARK: - Public draw

    /// Draws the intro overlay for the given output-frame index into the
    /// current UIGraphics image context. Caller must have already drawn
    /// the base timelapse frame into the same context.
    func draw(frameIndex: Int) {
        let t = max(0.0, min(1.0, Double(frameIndex) / Double(introFrameCount)))

        // Single fade-out ramp drives every layer. Alphas are just the
        // per-layer peak multiplied by this ramp (1.0 during hold, 0.0 after
        // fadeOutEnd).
        let fadeOut = 1.0 - smoothstep(IntroOverlay.holdEnd, IntroOverlay.fadeOutEnd, t)
        let blackAlpha = IntroOverlay.blackPeakAlpha * fadeOut
        let gradientAlpha = IntroOverlay.gradientPeakAlpha * fadeOut
        let contentAlpha = 1.0 * fadeOut

        let fullRect = CGRect(origin: .zero, size: videoSize)

        if blackAlpha > 0.001, let black = blackImage {
            UIImage(cgImage: black).draw(in: fullRect, blendMode: .normal, alpha: CGFloat(blackAlpha))
        }

        if gradientAlpha > 0.001 {
            if let tl = gradientTopLeft {
                UIImage(cgImage: tl).draw(in: fullRect, blendMode: .normal, alpha: CGFloat(gradientAlpha))
            }
            if let br = gradientBottomRight {
                UIImage(cgImage: br).draw(in: fullRect, blendMode: .normal, alpha: CGFloat(gradientAlpha))
            }
        }

        if contentAlpha > 0.001 {
            let alpha = CGFloat(contentAlpha)

            if let img = durationLabelImage {
                UIImage(cgImage: img).draw(in: durationLabelRect, blendMode: .normal, alpha: alpha)
            }
            if let img = durationTextImage {
                UIImage(cgImage: img).draw(in: durationRect, blendMode: .normal, alpha: alpha)
            }
            if let img = dateLabelImage {
                UIImage(cgImage: img).draw(in: dateLabelRect, blendMode: .normal, alpha: alpha)
            }
            if let img = dateTextImage {
                UIImage(cgImage: img).draw(in: dateRect, blendMode: .normal, alpha: alpha)
            }
            if let logo = logoImage {
                UIImage(cgImage: logo).draw(in: logoRect, blendMode: .normal, alpha: alpha)
            }
        }
    }

    // MARK: - Prerender

    private func prerenderBlack() {
        UIGraphicsBeginImageContextWithOptions(videoSize, true, 1.0)
        defer { UIGraphicsEndImageContext() }

        UIColor.black.setFill()
        UIRectFill(CGRect(origin: .zero, size: videoSize))

        blackImage = UIGraphicsGetImageFromCurrentImageContext()?.cgImage
    }

    private func prerenderGradients() {
        gradientTopLeft = renderDiagonalGradient(from: CGPoint(x: 0, y: 0))
        gradientBottomRight = renderDiagonalGradient(from: CGPoint(x: videoSize.width, y: videoSize.height))
    }

    private func renderDiagonalGradient(from origin: CGPoint) -> CGImage? {
        UIGraphicsBeginImageContextWithOptions(videoSize, false, 1.0)
        defer { UIGraphicsEndImageContext() }

        guard let ctx = UIGraphicsGetCurrentContext() else { return nil }

        let colors = [
            IntroOverlay.brandRed.withAlphaComponent(1.0).cgColor,
            IntroOverlay.brandRed.withAlphaComponent(0.0).cgColor,
        ]
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        guard let gradient = CGGradient(
            colorsSpace: colorSpace,
            colors: colors as CFArray,
            locations: [0.0, 1.0]
        ) else { return nil }

        // Glow reaches ~1/4 of the way along the diagonal from the corner
        // toward the opposite corner, so each gradient is a localized corner
        // accent rather than a full-screen wash.
        let maxRadius = sqrt(videoSize.width * videoSize.width + videoSize.height * videoSize.height)
        ctx.drawRadialGradient(
            gradient,
            startCenter: origin,
            startRadius: 0,
            endCenter: origin,
            endRadius: maxRadius * 0.25,
            options: []
        )

        return UIGraphicsGetImageFromCurrentImageContext()?.cgImage
    }

    private func prerenderLogoAndText() {
        // Strings
        let durationString = IntroOverlay.formatDuration(duration)
        let dateString = IntroOverlay.formatDate(date)

        // Font sizes scale with video width so output looks the same
        // across resolutions.
        let labelFontSize = videoSize.width * 0.038
        let durationFontSize = videoSize.width * 0.105
        let dateFontSize = videoSize.width * 0.058

        let labelFont = monoFont(size: labelFontSize)
        let durationFont = monoFont(size: durationFontSize)
        let dateFont = monoFont(size: dateFontSize)

        // Strava-style: muted uppercase-feel label above a bold value.
        let labelColor = UIColor(white: 1.0, alpha: 0.55)
        let valueColor = UIColor.white

        let (durLabelImg, durLabelSize) = renderTextImage(
            "duration",
            font: labelFont,
            color: labelColor,
            tracking: labelFontSize * 0.12
        )
        let (durImg, durSize) = renderTextImage(
            durationString,
            font: durationFont,
            color: valueColor
        )
        let (dateLabelImg, dateLabelSize) = renderTextImage(
            "date",
            font: labelFont,
            color: labelColor,
            tracking: labelFontSize * 0.12
        )
        let (dateImg, dateSize) = renderTextImage(
            dateString,
            font: dateFont,
            color: valueColor
        )

        durationLabelImage = durLabelImg
        durationTextImage = durImg
        dateLabelImage = dateLabelImg
        dateTextImage = dateImg

        // Text logo: "LOCKIN " in white, "CLUB" in brand red — same split as
        // the existing minimal timer filter in TimelapseFrameOverlay.
        let logoFontSize = videoSize.width * 0.068
        let logoFont = monoFont(size: logoFontSize)
        let logoAttributed = NSMutableAttributedString()
        logoAttributed.append(NSAttributedString(
            string: "LOCKIN ",
            attributes: [
                .font: logoFont,
                .foregroundColor: UIColor.white,
            ]
        ))
        logoAttributed.append(NSAttributedString(
            string: "CLUB",
            attributes: [
                .font: logoFont,
                .foregroundColor: IntroOverlay.brandRed,
            ]
        ))
        let (logoImg, logoSize) = renderAttributedTextImage(logoAttributed)
        logoImage = logoImg

        // Three entities stacked top-to-bottom: logo, duration pair,
        // date pair. Each pair (label + value) is tightly grouped with a
        // small internal gap. The three entities are separated from each
        // other by a larger gap that is the same between every pair.
        let labelToValueGap = videoSize.height * 0.006
        let entityGap = videoSize.height * 0.045

        let durationPairHeight = durLabelSize.height + labelToValueGap + durSize.height
        let datePairHeight = dateLabelSize.height + labelToValueGap + dateSize.height

        let stackHeight = logoSize.height
            + entityGap + durationPairHeight
            + entityGap + datePairHeight

        // Left edge of the block = block's horizontal center (frame center)
        // minus half the widest element across all rows.
        let blockMaxWidth = max(
            max(logoSize.width, max(durLabelSize.width, durSize.width)),
            max(dateLabelSize.width, dateSize.width)
        )
        let blockLeftX = (videoSize.width - blockMaxWidth) / 2.0

        // Vertically centered in the frame.
        var y = (videoSize.height - stackHeight) / 2.0

        logoRect = CGRect(
            x: blockLeftX,
            y: y,
            width: logoSize.width,
            height: logoSize.height
        )
        y += logoSize.height + entityGap

        durationLabelRect = CGRect(
            x: blockLeftX,
            y: y,
            width: durLabelSize.width,
            height: durLabelSize.height
        )
        y += durLabelSize.height + labelToValueGap

        durationRect = CGRect(
            x: blockLeftX,
            y: y,
            width: durSize.width,
            height: durSize.height
        )
        y += durSize.height + entityGap

        dateLabelRect = CGRect(
            x: blockLeftX,
            y: y,
            width: dateLabelSize.width,
            height: dateLabelSize.height
        )
        y += dateLabelSize.height + labelToValueGap

        dateRect = CGRect(
            x: blockLeftX,
            y: y,
            width: dateSize.width,
            height: dateSize.height
        )
    }

    private func renderAttributedTextImage(_ attrString: NSAttributedString) -> (CGImage?, CGSize) {
        let textSize = attrString.size()
        let padding: CGFloat = 4
        let paddedSize = CGSize(
            width: ceil(textSize.width) + padding * 2,
            height: ceil(textSize.height) + padding * 2
        )

        UIGraphicsBeginImageContextWithOptions(paddedSize, false, 1.0)
        defer { UIGraphicsEndImageContext() }

        attrString.draw(in: CGRect(x: padding, y: padding, width: textSize.width, height: textSize.height))

        let image = UIGraphicsGetImageFromCurrentImageContext()?.cgImage
        return (image, paddedSize)
    }

    private func renderTextImage(_ text: String, font: UIFont, color: UIColor, tracking: CGFloat = 0) -> (CGImage?, CGSize) {
        var attributes: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: color,
        ]
        if tracking != 0 {
            attributes[.kern] = tracking
        }
        let textSize = (text as NSString).size(withAttributes: attributes)
        // Pad by a few pixels so sub-pixel antialiasing isn't clipped.
        let padding: CGFloat = 4
        let paddedSize = CGSize(
            width: ceil(textSize.width) + padding * 2,
            height: ceil(textSize.height) + padding * 2
        )

        UIGraphicsBeginImageContextWithOptions(paddedSize, false, 1.0)
        defer { UIGraphicsEndImageContext() }

        (text as NSString).draw(
            in: CGRect(x: padding, y: padding, width: textSize.width, height: textSize.height),
            withAttributes: attributes
        )

        let image = UIGraphicsGetImageFromCurrentImageContext()?.cgImage
        return (image, paddedSize)
    }

    private func monoFont(size: CGFloat) -> UIFont {
        return UIFont(name: "Menlo-Bold", size: size)
            ?? UIFont.monospacedSystemFont(ofSize: size, weight: .bold)
    }

    // MARK: - Timeline

    private func smoothstep(_ a: Double, _ b: Double, _ x: Double) -> Double {
        guard b > a else { return x < a ? 0.0 : 1.0 }
        let u = max(0.0, min(1.0, (x - a) / (b - a)))
        return u * u * (3.0 - 2.0 * u)
    }

    // MARK: - Formatters

    static func formatDuration(_ seconds: TimeInterval) -> String {
        let totalSecs = max(0, Int(seconds.rounded()))

        if totalSecs < 60 {
            return totalSecs == 1 ? "1 sec" : "\(totalSecs) secs"
        }

        let totalMins = totalSecs / 60

        if totalMins < 60 {
            return totalMins == 1 ? "1 min" : "\(totalMins) mins"
        }

        let hours = totalMins / 60
        let mins = totalMins % 60

        if mins == 0 {
            return hours == 1 ? "1 hr" : "\(hours) hrs"
        }

        // Two-unit form: no space between digit and unit, singular units.
        return "\(hours)hr \(mins)min"
    }

    static func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "MMMM d, yyyy"
        return formatter.string(from: date).lowercased()
    }
}
