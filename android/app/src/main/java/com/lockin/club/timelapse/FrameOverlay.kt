package com.lockin.club.timelapse

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import com.lockin.club.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Per-frame timer + filter overlay applied to non-intro frames during addFrame.
 * Mirrors ios/LockinClub/TimelapseFrameOverlay.swift line for line.
 *
 * Per-frame work:
 *   1. Draw the camera bitmap into the target frame, aspect-fill.
 *   2. Composite a cached bottom→middle black gradient (subtle vignette so
 *      the timer reads against bright backgrounds).
 *   3. Render the timer block: minimal (timer + LOCKIN CLUB) or dateStamp
 *      (timer + date + brand logo).
 *
 * The static gradient is pre-rendered to a [Bitmap] in init so the per-frame
 * cost stays a single Canvas.drawBitmap call.
 */
class FrameOverlay(
    private val context: Context,
    private val timerXFraction: Double,
    private val timerYFraction: Double,
    filterType: String,
    timerScale: Double,
    private val frameWidth: Int,
    private val frameHeight: Int,
) {
    private enum class FilterType { MINIMAL, DATE_STAMP }

    private val filter: FilterType = when (filterType) {
        "dateStamp" -> FilterType.DATE_STAMP
        else -> FilterType.MINIMAL
    }
    private val timerScale: Float = timerScale.coerceIn(1.0, 2.5).toFloat()

    private val horizontalPadding: Float = 40f

    // Base typographic + box constants — match Swift exactly so output reads
    // the same on both platforms.
    private val baseTimerBoxPaddingH = 35f
    private val baseTimerBoxPaddingV = 23f
    private val baseTimerBoxCornerRadius = 23f
    private val baseTimerFontSize = 60f
    private val baseBrandFontSize = 32f
    private val baseLogoHeight = 50f

    private val timerBoxPaddingH = baseTimerBoxPaddingH * this.timerScale
    private val timerBoxPaddingV = baseTimerBoxPaddingV * this.timerScale
    private val timerBoxCornerRadius = baseTimerBoxCornerRadius * this.timerScale
    private val timerFontSize = baseTimerFontSize * this.timerScale
    private val brandFontSize = baseBrandFontSize * this.timerScale
    private val logoHeight = baseLogoHeight * this.timerScale

    private val brandRedColor = Color.argb(255, 255, 59, 92) // #FF3B5C

    private val monoBold: Typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)

    private val timerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = monoBold
        textSize = timerFontSize
        color = Color.WHITE
        isSubpixelText = true
    }
    private val brandWhitePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = monoBold
        textSize = brandFontSize
        color = Color.WHITE
        isSubpixelText = true
    }
    private val brandRedPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = monoBold
        textSize = brandFontSize
        color = brandRedColor
        isSubpixelText = true
    }
    private val boxBgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(128, 0, 0, 0) // 0.5 black
    }
    private val bitmapDrawPaint = Paint(Paint.FILTER_BITMAP_FLAG)

    private val dateFormatter = SimpleDateFormat("d MMM, yyyy", Locale.US)

    /** Pre-rendered bottom→middle black gradient. Same pixels every frame. */
    private val gradientBitmap: Bitmap = renderGradientBitmap()

    /** Loaded once. Null when the resource is missing — dateStamp filter
     *  silently degrades to text-only in that case. */
    private val logoBitmap: Bitmap? = runCatching {
        BitmapFactory.decodeResource(context.resources, R.drawable.logo_no_bg_cropped)
    }.getOrNull()

    private fun renderGradientBitmap(): Bitmap {
        val bmp = Bitmap.createBitmap(frameWidth, frameHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        // Linear gradient from bottom-center (0.5 black) to mid-center
        // (transparent). TileMode.CLAMP extrapolates the end color above the
        // midline so the top half stays fully transparent — matches the
        // CoreGraphics default behavior of leaving the area outside the
        // gradient line at the end color.
        val shader = LinearGradient(
            frameWidth / 2f, frameHeight.toFloat(),
            frameWidth / 2f, frameHeight / 2f,
            Color.argb(128, 0, 0, 0),
            Color.argb(0, 0, 0, 0),
            Shader.TileMode.CLAMP,
        )
        val paint = Paint().apply { this.shader = shader }
        canvas.drawRect(0f, 0f, frameWidth.toFloat(), frameHeight.toFloat(), paint)
        return bmp
    }

    /**
     * Returns a new bitmap of size [frameWidth] x [frameHeight] containing the
     * camera frame, gradient, and timer overlay composited together. The
     * caller owns and is responsible for recycling the result.
     */
    fun applyOverlay(source: Bitmap, elapsedSeconds: Int): Bitmap {
        val out = Bitmap.createBitmap(frameWidth, frameHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(out)
        canvas.drawColor(Color.BLACK)

        // Aspect-fill the camera frame into the target.
        val cameraDst = aspectFillRect(source.width, source.height, frameWidth, frameHeight)
        canvas.drawBitmap(source, null, cameraDst, bitmapDrawPaint)

        // Cached gradient overlay.
        canvas.drawBitmap(gradientBitmap, 0f, 0f, bitmapDrawPaint)

        // Timer block.
        when (filter) {
            FilterType.MINIMAL -> drawMinimalFilter(canvas, elapsedSeconds)
            FilterType.DATE_STAMP -> drawDateStampFilter(canvas, elapsedSeconds)
        }

        return out
    }

    // -- Filters --

    private fun drawMinimalFilter(canvas: Canvas, seconds: Int) {
        val timerString = formatTimer(seconds)
        val lockinText = "LOCKIN "
        val clubText = "CLUB"

        val timerW = timerPaint.measureText(timerString)
        val timerH = textHeight(timerPaint)
        val lockinW = brandWhitePaint.measureText(lockinText)
        val lockinH = textHeight(brandWhitePaint)
        val clubW = brandRedPaint.measureText(clubText)
        val clubH = textHeight(brandRedPaint)
        val brandTotalWidth = lockinW + clubW
        val brandHeight = maxOf(lockinH, clubH)

        val contentWidth = maxOf(timerW, brandTotalWidth)
        val contentHeight = timerH + 8f + brandHeight
        val boxWidth = contentWidth + timerBoxPaddingH * 2f
        val boxHeight = contentHeight + timerBoxPaddingV * 2f

        val (boxX, boxY) = clampedBoxPosition(boxWidth, boxHeight)
        val boxRect = RectF(boxX, boxY, boxX + boxWidth, boxY + boxHeight)
        canvas.drawRoundRect(boxRect, timerBoxCornerRadius, timerBoxCornerRadius, boxBgPaint)

        // Timer (centered horizontally inside the box).
        val timerX = boxX + (boxWidth - timerW) / 2f
        val timerTopY = boxY + timerBoxPaddingV
        canvas.drawText(timerString, timerX, timerTopY - timerPaint.fontMetrics.ascent, timerPaint)

        // Brand row (centered, below timer).
        val brandTopY = timerTopY + timerH + 8f
        val brandX = boxX + (boxWidth - brandTotalWidth) / 2f
        canvas.drawText(lockinText, brandX, brandTopY - brandWhitePaint.fontMetrics.ascent, brandWhitePaint)
        canvas.drawText(clubText, brandX + lockinW, brandTopY - brandRedPaint.fontMetrics.ascent, brandRedPaint)
    }

    private fun drawDateStampFilter(canvas: Canvas, seconds: Int) {
        val timerString = formatTimer(seconds)
        val dateString = dateFormatter.format(Date())

        val timerW = timerPaint.measureText(timerString)
        val timerH = textHeight(timerPaint)
        val dateW = brandWhitePaint.measureText(dateString)
        val dateH = textHeight(brandWhitePaint)

        val logo = logoBitmap
        val logoW: Float = if (logo != null) {
            (logo.width.toFloat() / logo.height.toFloat()) * logoHeight
        } else {
            logoHeight
        }

        val spacing = 8f
        val contentWidth = maxOf(timerW, maxOf(dateW, logoW))
        val contentHeight = timerH + spacing + dateH + spacing + logoHeight

        // Right-aligned positioning — matches Swift's logic: the rightmost
        // edge is the timer-position-x scaled into pixels plus half the
        // content width, clamped to the safe horizontal padding.
        val rightEdge = (timerXFraction * frameWidth).toFloat() + contentWidth / 2f
        val clampedRightEdge = minOf(rightEdge, frameWidth - horizontalPadding)
        val contentX = clampedRightEdge - contentWidth

        val centerY = (timerYFraction * frameHeight).toFloat()
        val contentTopY = centerY - contentHeight / 2f
        val clampedTopY = contentTopY.coerceIn(
            horizontalPadding,
            frameHeight - contentHeight - horizontalPadding,
        )

        // Timer (right-aligned).
        val timerX = contentX + (contentWidth - timerW)
        canvas.drawText(timerString, timerX, clampedTopY - timerPaint.fontMetrics.ascent, timerPaint)

        // Date (right-aligned, below timer).
        val dateTopY = clampedTopY + timerH + spacing
        val dateX = contentX + (contentWidth - dateW)
        canvas.drawText(dateString, dateX, dateTopY - brandWhitePaint.fontMetrics.ascent, brandWhitePaint)

        // Logo (right-aligned, below date).
        if (logo != null) {
            val logoTopY = dateTopY + dateH + spacing
            val logoX = contentX + (contentWidth - logoW)
            val dst = RectF(logoX, logoTopY, logoX + logoW, logoTopY + logoHeight)
            canvas.drawBitmap(logo, null, dst, bitmapDrawPaint)
        }
    }

    // -- Layout helpers --

    private fun clampedBoxPosition(boxWidth: Float, boxHeight: Float): Pair<Float, Float> {
        val centerX = (timerXFraction * frameWidth).toFloat()
        val centerY = (timerYFraction * frameHeight).toFloat()
        val rawX = centerX - boxWidth / 2f
        val rawY = centerY - boxHeight / 2f
        val clampedX = rawX.coerceIn(
            horizontalPadding,
            frameWidth - boxWidth - horizontalPadding,
        )
        val clampedY = rawY.coerceIn(
            horizontalPadding,
            frameHeight - boxHeight - horizontalPadding,
        )
        return clampedX to clampedY
    }

    private fun aspectFillRect(srcW: Int, srcH: Int, dstW: Int, dstH: Int): RectF {
        val widthRatio = dstW.toFloat() / srcW
        val heightRatio = dstH.toFloat() / srcH
        val scale = maxOf(widthRatio, heightRatio)
        val scaledW = srcW * scale
        val scaledH = srcH * scale
        val x = (dstW - scaledW) / 2f
        val y = (dstH - scaledH) / 2f
        return RectF(x, y, x + scaledW, y + scaledH)
    }

    private fun textHeight(paint: Paint): Float {
        // Match Swift's NSString.size(withAttributes:).height which reports the
        // font's full line height (ascent + descent + leading). Android's
        // FontMetrics has the equivalent.
        val fm = paint.fontMetrics
        return fm.descent - fm.ascent
    }

    private fun formatTimer(seconds: Int): String {
        val h = seconds / 3600
        val m = (seconds % 3600) / 60
        val s = seconds % 60
        return String.format(Locale.US, "%02d:%02d:%02d", h, m, s)
    }
}
