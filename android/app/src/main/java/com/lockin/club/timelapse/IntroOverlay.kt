package com.lockin.club.timelapse

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.ceil
import kotlin.math.sqrt

/**
 * 2-second intro card composited over the first 60 output frames at encode
 * time. Mirrors ios/LockinClub/IntroOverlay.swift line for line.
 *
 * All static layers (black fill, two diagonal red glows, label/value/logo
 * text bitmaps) are pre-rendered in init. Per-frame work is just an
 * alpha-faded composite of those cached bitmaps — tens of microseconds.
 */
class IntroOverlay(
    sessionDurationSeconds: Double,
    sessionStartDate: Date,
    private val videoWidth: Int,
    private val videoHeight: Int,
    taskName: String?,
) {
    companion object {
        const val INTRO_FRAME_COUNT: Int = 60

        private val brandRed: Int = Color.argb(255, 255, 59, 92) // #FF3B5C

        private const val BLACK_PEAK_ALPHA = 0.85
        private const val GRADIENT_PEAK_ALPHA = 0.32

        // Animation timeline (t in 0..1 across the 2s intro).
        // 0.0–0.85: fully visible. 0.85–1.0: smooth fade out.
        private const val HOLD_END = 0.85
        private const val FADE_OUT_END = 1.0

        fun formatDuration(seconds: Double): String {
            val totalSecs = maxOf(0L, kotlin.math.round(seconds).toLong())
            if (totalSecs < 60) return if (totalSecs == 1L) "1 sec" else "$totalSecs secs"
            val totalMins = totalSecs / 60
            if (totalMins < 60) return if (totalMins == 1L) "1 min" else "$totalMins mins"
            val hours = totalMins / 60
            val mins = totalMins % 60
            if (mins == 0L) return if (hours == 1L) "1 hr" else "$hours hrs"
            return "${hours}hr ${mins}min"
        }

        fun formatDate(date: Date): String {
            val fmt = SimpleDateFormat("MMMM d, yyyy", Locale.US)
            return fmt.format(date).lowercase(Locale.US)
        }

        private fun smoothstep(a: Double, b: Double, x: Double): Double {
            if (b <= a) return if (x < a) 0.0 else 1.0
            val u = ((x - a) / (b - a)).coerceIn(0.0, 1.0)
            return u * u * (3.0 - 2.0 * u)
        }
    }

    private val monoBold: Typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)

    // Pre-rendered layers
    private val blackBitmap: Bitmap
    private val gradientTopLeft: Bitmap
    private val gradientBottomRight: Bitmap
    private val logoBitmap: Bitmap
    private val durationLabelBitmap: Bitmap
    private val durationTextBitmap: Bitmap
    private val dateLabelBitmap: Bitmap
    private val dateTextBitmap: Bitmap
    private val taskLabelBitmap: Bitmap?
    private val taskTextBitmap: Bitmap?

    // Cached layout rects (top-left in canvas pixel coords)
    private val logoRect: RectF
    private val durationLabelRect: RectF
    private val durationRect: RectF
    private val dateLabelRect: RectF
    private val dateRect: RectF
    private val taskLabelRect: RectF?
    private val taskRect: RectF?

    // Reusable per-frame paint — alpha mutated on each draw call.
    private val drawPaint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)

    init {
        blackBitmap = renderBlackBitmap()
        gradientTopLeft = renderDiagonalGradient(0f, 0f)
        gradientBottomRight = renderDiagonalGradient(videoWidth.toFloat(), videoHeight.toFloat())

        // Strings
        val durationString = formatDuration(sessionDurationSeconds)
        val dateString = formatDate(sessionStartDate)
        val taskString: String? = run {
            val raw = taskName?.trim().orEmpty()
            if (raw.isEmpty()) null
            else {
                val lowered = raw.lowercase(Locale.US)
                val maxLen = 24
                if (lowered.length <= maxLen) lowered
                else lowered.substring(0, maxLen - 1) + "…"
            }
        }

        // Font sizes scale with width so the same overlay reads identically
        // across resolutions.
        val labelFontSize = videoWidth * 0.038f
        val durationFontSize = videoWidth * 0.105f
        val dateFontSize = videoWidth * 0.058f
        val taskFontSize = videoWidth * 0.058f
        val logoFontSize = videoWidth * 0.068f

        val labelColor = Color.argb((255 * 0.55).toInt(), 255, 255, 255)
        val valueColor = Color.WHITE

        // Letter-spacing: kern is per-em on Android's Paint, so divide the
        // Swift kern value (px) by fontSize to convert.
        val labelLetterSpacing = (labelFontSize * 0.12f) / labelFontSize

        val (durLabelBmp, durLabelSize) = renderTextBitmap(
            "duration", labelFontSize, labelColor, labelLetterSpacing
        )
        val (durBmp, durSize) = renderTextBitmap(
            durationString, durationFontSize, valueColor, 0f
        )
        val (dateLabelBmp, dateLabelSize) = renderTextBitmap(
            "date", labelFontSize, labelColor, labelLetterSpacing
        )
        val (dateBmp, dateSize) = renderTextBitmap(
            dateString, dateFontSize, valueColor, 0f
        )
        durationLabelBitmap = durLabelBmp
        durationTextBitmap = durBmp
        dateLabelBitmap = dateLabelBmp
        dateTextBitmap = dateBmp

        var taskLabelSize = SizeF(0f, 0f)
        var taskValueSize = SizeF(0f, 0f)
        if (taskString != null) {
            val (tLabelBmp, tLabelSize) = renderTextBitmap(
                "task", labelFontSize, labelColor, labelLetterSpacing
            )
            val (tBmp, tSize) = renderTextBitmap(
                taskString, taskFontSize, valueColor, 0f
            )
            taskLabelBitmap = tLabelBmp
            taskTextBitmap = tBmp
            taskLabelSize = tLabelSize
            taskValueSize = tSize
        } else {
            taskLabelBitmap = null
            taskTextBitmap = null
        }

        // Logo: "LOCKIN " in white + "CLUB" in brand red, same split as the
        // minimal timer filter.
        val (logoBmp, logoSize) = renderTwoTonedLogo(logoFontSize, valueColor, brandRed)
        logoBitmap = logoBmp

        // Layout: vertical centered stack — logo, (duration label/value),
        // optional (task label/value), (date label/value). Swift uses tight
        // intra-pair gaps and a larger inter-entity gap.
        val labelToValueGap = videoHeight * 0.006f
        val entityGap = videoHeight * 0.045f

        val durationPairHeight = durLabelSize.h + labelToValueGap + durSize.h
        val datePairHeight = dateLabelSize.h + labelToValueGap + dateSize.h
        val hasTask = taskString != null
        val taskPairHeight = if (hasTask) taskLabelSize.h + labelToValueGap + taskValueSize.h else 0f

        var stackHeight = logoSize.h + entityGap + durationPairHeight + entityGap + datePairHeight
        if (hasTask) stackHeight += entityGap + taskPairHeight

        var blockMaxWidth = maxOf(
            maxOf(logoSize.w, maxOf(durLabelSize.w, durSize.w)),
            maxOf(dateLabelSize.w, dateSize.w),
        )
        if (hasTask) blockMaxWidth = maxOf(blockMaxWidth, maxOf(taskLabelSize.w, taskValueSize.w))
        val blockLeftX = (videoWidth - blockMaxWidth) / 2f

        var y = (videoHeight - stackHeight) / 2f

        logoRect = rectAt(blockLeftX, y, logoSize)
        y += logoSize.h + entityGap

        durationLabelRect = rectAt(blockLeftX, y, durLabelSize)
        y += durLabelSize.h + labelToValueGap

        durationRect = rectAt(blockLeftX, y, durSize)
        y += durSize.h + entityGap

        if (hasTask) {
            taskLabelRect = rectAt(blockLeftX, y, taskLabelSize)
            y += taskLabelSize.h + labelToValueGap
            taskRect = rectAt(blockLeftX, y, taskValueSize)
            y += taskValueSize.h + entityGap
        } else {
            taskLabelRect = null
            taskRect = null
        }

        dateLabelRect = rectAt(blockLeftX, y, dateLabelSize)
        y += dateLabelSize.h + labelToValueGap
        dateRect = rectAt(blockLeftX, y, dateSize)
    }

    /**
     * Composites the intro overlay for the given frame index onto [canvas].
     * The caller must have already drawn the base timelapse frame.
     */
    fun draw(canvas: Canvas, frameIndex: Int) {
        val t = (frameIndex.toDouble() / INTRO_FRAME_COUNT).coerceIn(0.0, 1.0)

        // Single fade-out ramp drives every layer.
        val fadeOut = 1.0 - smoothstep(HOLD_END, FADE_OUT_END, t)
        val blackAlpha = BLACK_PEAK_ALPHA * fadeOut
        val gradientAlpha = GRADIENT_PEAK_ALPHA * fadeOut
        val contentAlpha = 1.0 * fadeOut

        if (blackAlpha > 0.001) {
            drawPaint.alpha = (255 * blackAlpha).toInt()
            canvas.drawBitmap(blackBitmap, 0f, 0f, drawPaint)
        }

        if (gradientAlpha > 0.001) {
            drawPaint.alpha = (255 * gradientAlpha).toInt()
            canvas.drawBitmap(gradientTopLeft, 0f, 0f, drawPaint)
            canvas.drawBitmap(gradientBottomRight, 0f, 0f, drawPaint)
        }

        if (contentAlpha > 0.001) {
            drawPaint.alpha = (255 * contentAlpha).toInt()
            drawAt(canvas, durationLabelBitmap, durationLabelRect)
            drawAt(canvas, durationTextBitmap, durationRect)
            if (taskLabelBitmap != null && taskLabelRect != null) {
                drawAt(canvas, taskLabelBitmap, taskLabelRect)
            }
            if (taskTextBitmap != null && taskRect != null) {
                drawAt(canvas, taskTextBitmap, taskRect)
            }
            drawAt(canvas, dateLabelBitmap, dateLabelRect)
            drawAt(canvas, dateTextBitmap, dateRect)
            drawAt(canvas, logoBitmap, logoRect)
        }
    }

    // -- Pre-render helpers --

    private fun renderBlackBitmap(): Bitmap {
        val bmp = Bitmap.createBitmap(videoWidth, videoHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        canvas.drawColor(Color.BLACK)
        return bmp
    }

    private fun renderDiagonalGradient(originX: Float, originY: Float): Bitmap {
        val bmp = Bitmap.createBitmap(videoWidth, videoHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        // Glow reaches ~25% of the diagonal from this corner — localized
        // accent rather than a full screen wash.
        val maxRadius = sqrt(
            (videoWidth.toFloat() * videoWidth + videoHeight.toFloat() * videoHeight).toDouble()
        ).toFloat()
        val shader = RadialGradient(
            originX,
            originY,
            maxRadius * 0.25f,
            brandRed,
            Color.argb(0, 255, 59, 92),
            Shader.TileMode.CLAMP,
        )
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.shader = shader }
        canvas.drawRect(0f, 0f, videoWidth.toFloat(), videoHeight.toFloat(), paint)
        return bmp
    }

    private data class SizeF(val w: Float, val h: Float)

    private fun renderTextBitmap(
        text: String,
        fontSize: Float,
        color: Int,
        letterSpacingEm: Float,
    ): Pair<Bitmap, SizeF> {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG).apply {
            typeface = monoBold
            textSize = fontSize
            this.color = color
            letterSpacing = letterSpacingEm
        }
        val width = paint.measureText(text)
        val fm = paint.fontMetrics
        val height = fm.descent - fm.ascent
        val padding = 4f
        val paddedW = ceil(width + padding * 2f).toInt().coerceAtLeast(1)
        val paddedH = ceil(height + padding * 2f).toInt().coerceAtLeast(1)

        val bmp = Bitmap.createBitmap(paddedW, paddedH, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        canvas.drawText(text, padding, padding - fm.ascent, paint)
        return bmp to SizeF(paddedW.toFloat(), paddedH.toFloat())
    }

    private fun renderTwoTonedLogo(
        fontSize: Float,
        firstColor: Int,
        secondColor: Int,
    ): Pair<Bitmap, SizeF> {
        // "LOCKIN " in firstColor, "CLUB" in secondColor — concatenated with
        // no kerning so the two halves render as a single logical word.
        val first = "LOCKIN "
        val second = "CLUB"
        val firstPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG).apply {
            typeface = monoBold
            textSize = fontSize
            color = firstColor
        }
        val secondPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG).apply {
            typeface = monoBold
            textSize = fontSize
            color = secondColor
        }
        val firstW = firstPaint.measureText(first)
        val secondW = secondPaint.measureText(second)
        val totalW = firstW + secondW
        val fm = firstPaint.fontMetrics
        val height = fm.descent - fm.ascent
        val padding = 4f
        val paddedW = ceil(totalW + padding * 2f).toInt().coerceAtLeast(1)
        val paddedH = ceil(height + padding * 2f).toInt().coerceAtLeast(1)

        val bmp = Bitmap.createBitmap(paddedW, paddedH, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val baseline = padding - fm.ascent
        canvas.drawText(first, padding, baseline, firstPaint)
        canvas.drawText(second, padding + firstW, baseline, secondPaint)
        return bmp to SizeF(paddedW.toFloat(), paddedH.toFloat())
    }

    private fun rectAt(x: Float, y: Float, size: SizeF): RectF =
        RectF(x, y, x + size.w, y + size.h)

    private fun drawAt(canvas: Canvas, bitmap: Bitmap, rect: RectF) {
        // The bitmap was rendered at exactly rect's pixel size, so pass
        // (rect.left, rect.top) and skip scaling — keeps text crisp.
        canvas.drawBitmap(bitmap, rect.left, rect.top, drawPaint)
    }
}
