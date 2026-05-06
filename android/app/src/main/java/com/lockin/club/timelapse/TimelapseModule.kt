package com.lockin.club.timelapse

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject
import java.io.File
import java.util.Date
import java.util.concurrent.Executors

/**
 * Android port of ios/LockinClub/TimelapseModule.swift.
 *
 * Public surface (must stay byte-compatible with the Swift @objc methods so
 * lib/timelapseModule.ts stays a thin wrapper):
 *   - startRecording(width, height, orientation, timerX, timerY,
 *                    timerFilter, timerScale) -> sessionDir path
 *   - addFrame(base64ImageData, elapsedSeconds)
 *   - addCompositeFrame(cameraImagePath, overlayBase64)
 *   - stopRecording(sessionDurationSeconds, taskName) -> output mp4 path
 *   - finalizePendingRecording(pendingDirPath, sessionDurationSeconds,
 *                              taskName) -> output mp4 path
 *   - cancelRecording()
 *
 * On-disk layout (mirrors iOS):
 *   filesDir/timelapses/
 *     pending_<startMs>/
 *       meta.json
 *       frame_0000000_t0000000000.jpg   (index, elapsedMs)
 *       frame_0000001_t0000000250.jpg
 *       ...
 *     timelapse_<finalizeSec>.mp4
 *
 * All session state mutation and file I/O happens on a single-thread executor
 * (matches Swift's serial DispatchQueue). The React thread never blocks.
 */
class TimelapseModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    private data class StoredFrame(val file: File, val elapsedMs: Int)

    // Background queue. Single-threaded so we don't have to lock state.
    private val processingQueue = Executors.newSingleThreadExecutor { r ->
        Thread(r, "lockin-timelapse").apply { priority = Thread.NORM_PRIORITY + 1 }
    }

    // Per-session state — only touched on processingQueue.
    private var sessionDir: File? = null
    private var sessionStartDate: Date? = null
    private var videoWidth: Int = 0
    private var videoHeight: Int = 0
    private var frameOverlay: FrameOverlay? = null
    private val frames: MutableList<StoredFrame> = mutableListOf()
    private var lastElapsedMs: Int = -1
    private var isRecording: Boolean = false

    // Config
    private val maxBufferFrames = 600
    private val jpegQuality = 85

    override fun getName(): String = "TimelapseModule"

    // ---------- Path helpers ----------

    private fun timelapsesDir(): File {
        val dir = File(reactApplicationContext.filesDir, "timelapses")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun newSessionDir(): File {
        val ts = System.currentTimeMillis()
        val dir = File(timelapsesDir(), "pending_$ts")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun metaFile(sessionDir: File): File = File(sessionDir, "meta.json")

    private fun frameFile(sessionDir: File, index: Int, elapsedMs: Int): File {
        // Filename encodes elapsedMs so crash-recovery (finalizePendingRecording)
        // can sort frames by real time without an out-of-band manifest.
        val name = String.format("frame_%07d_t%010d.jpg", index, elapsedMs)
        return File(sessionDir, name)
    }

    // ---------- startRecording ----------

    @ReactMethod
    fun startRecording(
        width: Double,
        height: Double,
        orientation: String,
        timerX: Double,
        timerY: Double,
        timerFilter: String,
        timerScale: Double,
        promise: Promise,
    ) {
        processingQueue.execute {
            try {
                discardCurrentSession()

                val isLandscape = orientation == "landscape-left" || orientation == "landscape-right"
                videoWidth = if (isLandscape) maxOf(width.toInt(), height.toInt())
                else minOf(width.toInt(), height.toInt())
                videoHeight = if (isLandscape) minOf(width.toInt(), height.toInt())
                else maxOf(width.toInt(), height.toInt())
                if (videoWidth % 2 != 0) videoWidth += 1
                if (videoHeight % 2 != 0) videoHeight += 1

                frameOverlay = FrameOverlay(
                    context = reactApplicationContext,
                    timerXFraction = timerX,
                    timerYFraction = timerY,
                    filterType = timerFilter,
                    timerScale = timerScale,
                    frameWidth = videoWidth,
                    frameHeight = videoHeight,
                )

                sessionStartDate = Date()
                frames.clear()
                lastElapsedMs = -1

                val dir = newSessionDir()
                sessionDir = dir
                isRecording = true

                val meta = JSONObject().apply {
                    put("videoWidth", videoWidth)
                    put("videoHeight", videoHeight)
                    put("orientation", orientation)
                    put("timerX", timerX)
                    put("timerY", timerY)
                    put("timerFilter", timerFilter)
                    put("timerScale", timerScale)
                    put("sessionStartDateMs", sessionStartDate!!.time)
                }
                metaFile(dir).writeText(meta.toString())

                // Match iOS: return file:// URL of the pending session directory.
                promise.resolve(dir.toURI().toString())
            } catch (t: Throwable) {
                promise.reject("ERR_START", "Failed to start recording: ${t.message}", t)
            }
        }
    }

    // ---------- addFrame ----------

    @ReactMethod
    fun addFrame(base64ImageData: String, elapsedSeconds: Double, promise: Promise) {
        processingQueue.execute {
            val dir = sessionDir
            if (!isRecording || dir == null) {
                promise.reject("ERR_STATE", "Not recording")
                return@execute
            }

            val isIntroCandidate = frames.size < IntroOverlay.INTRO_FRAME_COUNT

            val raw: ByteArray = try {
                Base64.decode(base64ImageData, Base64.DEFAULT)
            } catch (t: Throwable) {
                promise.reject("ERR_DECODE", "Failed to decode base64 image", t)
                return@execute
            }

            val jpegBytes: ByteArray = try {
                if (isIntroCandidate) {
                    // Intro frames stored raw — encoder re-renders them with the
                    // intro overlay at finalize time.
                    raw
                } else {
                    val source = BitmapFactory.decodeByteArray(raw, 0, raw.size)
                        ?: throw IllegalStateException("Failed to decode bitmap")
                    val overlaid = frameOverlay?.applyOverlay(source, elapsedSeconds.toInt()) ?: source
                    val bytes = bitmapToJpeg(overlaid, jpegQuality)
                    // overlaid may be the same object as source (stub overlay) or a
                    // new allocation (real overlay). Recycle exactly the live ones.
                    if (overlaid !== source) source.recycle()
                    overlaid.recycle()
                    bytes
                }
            } catch (t: Throwable) {
                promise.reject("ERR_ENCODE", "Failed to encode frame: ${t.message}", t)
                return@execute
            }

            persistFrame(jpegBytes, elapsedSeconds, dir, promise)
        }
    }

    // ---------- addCompositeFrame ----------

    @ReactMethod
    fun addCompositeFrame(
        cameraImagePath: String,
        overlayBase64: String,
        promise: Promise,
    ) {
        processingQueue.execute {
            val dir = sessionDir
            if (!isRecording || dir == null) {
                promise.reject("ERR_STATE", "Not recording")
                return@execute
            }

            val cleanPath = cameraImagePath.removePrefix("file://")
            val camera: Bitmap = BitmapFactory.decodeFile(cleanPath)
                ?: run {
                    promise.reject("ERR_DECODE", "Failed to load camera image: $cleanPath")
                    return@execute
                }

            val overlayBytes: ByteArray = try {
                Base64.decode(overlayBase64, Base64.DEFAULT)
            } catch (t: Throwable) {
                camera.recycle()
                promise.reject("ERR_DECODE", "Failed to decode overlay base64", t)
                return@execute
            }
            val overlay: Bitmap = BitmapFactory.decodeByteArray(overlayBytes, 0, overlayBytes.size)
                ?: run {
                    camera.recycle()
                    promise.reject("ERR_DECODE", "Failed to decode overlay bitmap")
                    return@execute
                }

            val composite: Bitmap = try {
                composeAspectFill(camera, overlay, videoWidth, videoHeight)
            } catch (t: Throwable) {
                promise.reject("ERR_COMPOSITE", "Failed to composite frame", t)
                return@execute
            } finally {
                camera.recycle()
                overlay.recycle()
            }

            val jpegBytes: ByteArray = try {
                bitmapToJpeg(composite, jpegQuality)
            } catch (t: Throwable) {
                promise.reject("ERR_ENCODE", "Failed to encode composite", t)
                return@execute
            } finally {
                composite.recycle()
            }

            // Camera frame on disk is now embedded in the composite; remove the
            // input file so we don't double-store it.
            File(cleanPath).delete()

            // No JS caller passes elapsed on this path — derive from session start.
            val elapsed = sessionStartDate?.let {
                (System.currentTimeMillis() - it.time) / 1000.0
            } ?: 0.0
            persistFrame(jpegBytes, elapsed, dir, promise)
        }
    }

    private fun persistFrame(
        jpeg: ByteArray,
        elapsedSeconds: Double,
        dir: File,
        promise: Promise,
    ) {
        var elapsedMs = (elapsedSeconds * 1000.0).toInt()
        // Strict-monotonic clamp so the decimation algorithm's time-bucket math
        // holds even if the bridge ever delivers calls slightly out of order.
        elapsedMs = maxOf(elapsedMs, lastElapsedMs + 1)
        lastElapsedMs = elapsedMs

        val index = frames.size
        val file = frameFile(dir, index, elapsedMs)
        try {
            file.writeBytes(jpeg)
        } catch (t: Throwable) {
            promise.reject("ERR_WRITE", "Failed to write frame: ${t.message}", t)
            return
        }
        frames.add(StoredFrame(file, elapsedMs))

        if (frames.size > maxBufferFrames) {
            decimateDiskBuffer()
        }
        promise.resolve(null)
    }

    // ---------- decimation ----------

    /**
     * Time-bucket decimation. When the on-disk frame buffer exceeds
     * [maxBufferFrames], the suffix (everything after the preserved intro
     * prefix) is divided into N equal-time buckets and one frame per bucket
     * is kept (the one whose elapsedMs is closest to bucket center). The very
     * last frame is force-kept so the video doesn't end seconds short.
     *
     * Mirrors Swift TimelapseModule.decimateDiskBuffer (lines 272–324).
     */
    private fun decimateDiskBuffer() {
        val preservePrefix = IntroOverlay.INTRO_FRAME_COUNT
        if (frames.size <= preservePrefix + 2) return

        val suffix = frames.subList(preservePrefix, frames.size).toList()
        val targetSuffixCount = maxOf(2, maxBufferFrames / 2 - preservePrefix / 2)
        if (suffix.size <= targetSuffixCount) return

        val tStart = suffix.first().elapsedMs
        val tEnd = suffix.last().elapsedMs
        val span = maxOf(1, tEnd - tStart)

        val keptSuffix = ArrayList<StoredFrame>(targetSuffixCount)
        var lastKeptIdx = -1
        for (b in 0 until targetSuffixCount) {
            val bucketCenter = tStart + (span * (2 * b + 1)) / (2 * targetSuffixCount)
            var bestIdx = lastKeptIdx + 1
            if (bestIdx >= suffix.size) break
            var bestDist = kotlin.math.abs(suffix[bestIdx].elapsedMs - bucketCenter)
            var i = bestIdx + 1
            while (i < suffix.size) {
                val d = kotlin.math.abs(suffix[i].elapsedMs - bucketCenter)
                // <= prefers the later of two equidistant frames; once d grows
                // we know we've passed the closest (timestamps are monotonic).
                if (d <= bestDist) {
                    bestDist = d
                    bestIdx = i
                } else {
                    break
                }
                i++
            }
            keptSuffix.add(suffix[bestIdx])
            lastKeptIdx = bestIdx
        }
        // Force-keep the very last frame.
        if (keptSuffix.lastOrNull()?.file != suffix.last().file) {
            keptSuffix.add(suffix.last())
        }

        val keptFiles = keptSuffix.map { it.file }.toHashSet()
        for (f in suffix) if (f.file !in keptFiles) f.file.delete()

        val prefix = frames.subList(0, preservePrefix).toList()
        frames.clear()
        frames.addAll(prefix)
        frames.addAll(keptSuffix)
    }

    // ---------- stopRecording ----------

    @ReactMethod
    fun stopRecording(
        sessionDurationSeconds: Double,
        taskName: String?,
        promise: Promise,
    ) {
        val resolvedTask = taskName ?: ""
        processingQueue.execute {
            val dir = sessionDir
            if (!isRecording || dir == null) {
                promise.reject("ERR_STATE", "No active recording")
                return@execute
            }
            isRecording = false

            val captured = frames.map { it.file }
            val startDate = sessionStartDate ?: Date()
            val w = videoWidth
            val h = videoHeight

            assembleAndFinalize(
                frameFiles = captured,
                width = w,
                height = h,
                sessionStartDate = startDate,
                sessionDurationSeconds = sessionDurationSeconds,
                taskName = resolvedTask,
                pendingDir = dir,
                clearInstanceState = true,
                promise = promise,
            )
        }
    }

    // ---------- finalizePendingRecording ----------

    @ReactMethod
    fun finalizePendingRecording(
        pendingDirPath: String,
        sessionDurationSeconds: Double,
        taskName: String?,
        promise: Promise,
    ) {
        val resolvedTask = taskName ?: ""
        processingQueue.execute {
            if (isRecording) {
                promise.reject("ERR_STATE", "A recording is currently in progress")
                return@execute
            }

            val cleanPath = pendingDirPath.removePrefix("file://")
            val dir = File(cleanPath)
            if (!dir.exists()) {
                promise.reject("ERR_NO_DIR", "Pending session does not exist: $cleanPath")
                return@execute
            }

            val meta = metaFile(dir)
            val width: Int
            val height: Int
            val startDate: Date
            try {
                check(meta.exists())
                val json = JSONObject(meta.readText())
                width = json.getInt("videoWidth")
                height = json.getInt("videoHeight")
                startDate = Date(json.getLong("sessionStartDateMs"))
            } catch (t: Throwable) {
                dir.deleteRecursively()
                promise.reject("ERR_META", "meta.json is unreadable — pending session unrecoverable", t)
                return@execute
            }

            val parsed: List<Pair<File, Int>> = (dir.listFiles().orEmpty())
                .filter { it.name.startsWith("frame_") && it.extension.lowercase() == "jpg" }
                .mapNotNull { f ->
                    val stem = f.nameWithoutExtension
                    val parts = stem.split("_")
                    when {
                        parts.size == 3 && parts[0] == "frame" && parts[2].startsWith("t") ->
                            parts[2].substring(1).toIntOrNull()?.let { f to it }
                        parts.size == 2 && parts[0] == "frame" ->
                            parts[1].toIntOrNull()?.let { f to it }
                        else -> null
                    }
                }
            val frameFiles = parsed.sortedBy { it.second }.map { it.first }

            if (frameFiles.isEmpty()) {
                dir.deleteRecursively()
                promise.reject("ERR_EMPTY", "No frames in pending session")
                return@execute
            }

            assembleAndFinalize(
                frameFiles = frameFiles,
                width = width,
                height = height,
                sessionStartDate = startDate,
                sessionDurationSeconds = sessionDurationSeconds,
                taskName = resolvedTask,
                pendingDir = dir,
                clearInstanceState = false,
                promise = promise,
            )
        }
    }

    // ---------- assemble + encode ----------

    private fun assembleAndFinalize(
        frameFiles: List<File>,
        width: Int,
        height: Int,
        sessionStartDate: Date,
        sessionDurationSeconds: Double,
        taskName: String,
        pendingDir: File,
        clearInstanceState: Boolean,
        promise: Promise,
    ) {
        val maybeClearState = {
            if (clearInstanceState) clearInstanceState()
        }

        if (frameFiles.isEmpty()) {
            pendingDir.deleteRecursively()
            maybeClearState()
            promise.reject("ERR_EMPTY", "No frames were captured")
            return
        }

        val outFile = File(timelapsesDir(), "timelapse_${System.currentTimeMillis() / 1000}.mp4")
        if (outFile.exists()) outFile.delete()

        val intro = IntroOverlay(
            sessionDurationSeconds = sessionDurationSeconds,
            sessionStartDate = sessionStartDate,
            videoWidth = width,
            videoHeight = height,
            taskName = taskName.ifEmpty { null },
        )
        val introCount = minOf(IntroOverlay.INTRO_FRAME_COUNT, frameFiles.size)

        val encoder = VideoEncoder(width = width, height = height, outputFile = outFile)
        try {
            encoder.start()

            // Reusable target bitmap for the GLES upload — saves N allocations.
            val target = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(target)
            val paint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)

            var appended = 0
            for ((i, file) in frameFiles.withIndex()) {
                val source = BitmapFactory.decodeFile(file.absolutePath) ?: continue
                try {
                    drawAspectFill(canvas, source, width, height, paint)
                    if (i < introCount) intro.draw(canvas, i)

                    // Match Swift's 30fps timebase: frame i lands at i/30 seconds.
                    val ptsUs = (appended.toLong() * 1_000_000L) / 30L
                    encoder.encodeFrame(target, ptsUs)
                    appended++
                } finally {
                    source.recycle()
                }
            }
            target.recycle()

            if (appended == 0) {
                encoder.release()
                outFile.delete()
                pendingDir.deleteRecursively()
                maybeClearState()
                promise.reject("ERR_EMPTY", "No frames were appended to the encoder")
                return
            }

            encoder.finish()
            encoder.release()

            pendingDir.deleteRecursively()
            maybeClearState()
            promise.resolve(outFile.toURI().toString())
        } catch (t: Throwable) {
            Log.e(TAG, "Encode failed", t)
            try { encoder.release() } catch (_: Throwable) {}
            outFile.delete()
            pendingDir.deleteRecursively()
            maybeClearState()
            promise.reject("ERR_ENCODE", "Encoding failed: ${t.message}", t)
        }
    }

    // ---------- cancelRecording ----------

    @ReactMethod
    fun cancelRecording(promise: Promise) {
        processingQueue.execute {
            discardCurrentSession()
            promise.resolve(null)
        }
    }

    // ---------- helpers ----------

    /** Returns a centered aspect-fill rect for [source] inside [width]x[height]. */
    private fun aspectFillRect(source: Bitmap, width: Int, height: Int): RectF {
        val widthRatio = width.toFloat() / source.width
        val heightRatio = height.toFloat() / source.height
        val scale = maxOf(widthRatio, heightRatio)
        val scaledW = source.width * scale
        val scaledH = source.height * scale
        val x = (width - scaledW) / 2f
        val y = (height - scaledH) / 2f
        return RectF(x, y, x + scaledW, y + scaledH)
    }

    private fun drawAspectFill(
        canvas: Canvas,
        source: Bitmap,
        width: Int,
        height: Int,
        paint: Paint,
    ) {
        canvas.drawColor(android.graphics.Color.BLACK)
        val dst = aspectFillRect(source, width, height)
        canvas.drawBitmap(source, null as Rect?, dst, paint)
    }

    private fun composeAspectFill(
        camera: Bitmap,
        overlay: Bitmap,
        width: Int,
        height: Int,
    ): Bitmap {
        val out = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(out)
        val paint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)
        drawAspectFill(canvas, camera, width, height, paint)
        canvas.drawBitmap(overlay, null as Rect?, aspectFillRect(overlay, width, height), paint)
        return out
    }

    private fun bitmapToJpeg(bitmap: Bitmap, quality: Int): ByteArray {
        val stream = java.io.ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, stream)
        return stream.toByteArray()
    }

    /**
     * Resets in-memory per-session state without touching disk. Called from
     * the live finalize path and from cancelRecording's discardCurrentSession.
     */
    private fun clearInstanceState() {
        sessionDir = null
        sessionStartDate = null
        frameOverlay = null
        frames.clear()
        lastElapsedMs = -1
        isRecording = false
    }

    /** Full cleanup: deletes the pending session directory and clears state. */
    private fun discardCurrentSession() {
        sessionDir?.deleteRecursively()
        clearInstanceState()
    }

    companion object {
        private const val TAG = "TimelapseModule"
    }
}
