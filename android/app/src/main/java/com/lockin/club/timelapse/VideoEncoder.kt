package com.lockin.club.timelapse

import android.graphics.Bitmap
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.opengl.EGL14
import android.opengl.EGLConfig
import android.opengl.EGLContext
import android.opengl.EGLDisplay
import android.opengl.EGLExt
import android.opengl.EGLSurface
import android.opengl.GLES20
import android.opengl.GLUtils
import android.opengl.Matrix
import android.view.Surface
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

/**
 * H.264 MP4 encoder backed by [MediaCodec] (input Surface) + [MediaMuxer].
 *
 * Per-frame flow:
 *   1) caller renders an RGBA bitmap to GL texture
 *   2) [encodeFrame] draws a fullscreen textured quad to the encoder's input
 *      Surface and tags it with the given presentation timestamp
 *   3) [drainEncoder] pulls encoded packets and feeds them to the muxer
 *
 * iOS spec equivalent: AVAssetWriter / AVAssetWriterInputPixelBufferAdaptor
 * configured for AVVideoCodecH264 at 8 Mbps, high profile, 30 fps timebase.
 *
 * The Surface + GLES path is the recommended pattern for hardware H.264
 * encoding on Android. Byte-buffer YUV mode would avoid GL but trips
 * vendor-specific color format incompatibilities on Samsung / MediaTek SoCs.
 */
class VideoEncoder(
    private val width: Int,
    private val height: Int,
    private val outputFile: File,
    private val frameRate: Int = 30,
    private val bitRate: Int = 8_000_000,
) {
    private val mimeType = "video/avc"

    private lateinit var encoder: MediaCodec
    private lateinit var inputSurface: Surface
    private lateinit var muxer: MediaMuxer
    private var trackIndex: Int = -1
    private var muxerStarted: Boolean = false
    private val bufferInfo = MediaCodec.BufferInfo()

    private var eglDisplay: EGLDisplay = EGL14.EGL_NO_DISPLAY
    private var eglContext: EGLContext = EGL14.EGL_NO_CONTEXT
    private var eglSurface: EGLSurface = EGL14.EGL_NO_SURFACE

    private var program: Int = 0
    private var aPositionLoc: Int = -1
    private var aTexCoordLoc: Int = -1
    private var uMvpMatrixLoc: Int = -1
    private var uTextureLoc: Int = -1
    private var textureId: Int = 0
    private val mvpMatrix = FloatArray(16)

    fun start() {
        val format = MediaFormat.createVideoFormat(mimeType, width, height).apply {
            setInteger(
                MediaFormat.KEY_COLOR_FORMAT,
                MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface
            )
            setInteger(MediaFormat.KEY_BIT_RATE, bitRate)
            setInteger(MediaFormat.KEY_FRAME_RATE, frameRate)
            setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)
            // Match iOS AVVideoProfileLevelH264HighAutoLevel where supported.
            setInteger(
                MediaFormat.KEY_PROFILE,
                MediaCodecInfo.CodecProfileLevel.AVCProfileHigh
            )
            setInteger(
                MediaFormat.KEY_LEVEL,
                MediaCodecInfo.CodecProfileLevel.AVCLevel41
            )
        }
        encoder = MediaCodec.createEncoderByType(mimeType)
        encoder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
        inputSurface = encoder.createInputSurface()
        encoder.start()

        setupEGL()
        setupGLProgram()

        muxer = MediaMuxer(
            outputFile.absolutePath,
            MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4
        )
    }

    /**
     * Pushes one frame to the encoder. Caller is responsible for the
     * presentation timestamp; the muxer relies on monotonically increasing
     * values across frames.
     */
    fun encodeFrame(bitmap: Bitmap, presentationTimeUs: Long) {
        drainEncoder(endOfStream = false)

        GLES20.glClearColor(0f, 0f, 0f, 1f)
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
        GLES20.glViewport(0, 0, width, height)

        GLES20.glUseProgram(program)
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureId)
        GLUtils.texImage2D(GLES20.GL_TEXTURE_2D, 0, bitmap, 0)
        GLES20.glTexParameteri(
            GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR
        )
        GLES20.glTexParameteri(
            GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR
        )
        GLES20.glTexParameteri(
            GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE
        )
        GLES20.glTexParameteri(
            GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE
        )
        GLES20.glUniform1i(uTextureLoc, 0)
        GLES20.glUniformMatrix4fv(uMvpMatrixLoc, 1, false, mvpMatrix, 0)

        GLES20.glEnableVertexAttribArray(aPositionLoc)
        GLES20.glVertexAttribPointer(aPositionLoc, 2, GLES20.GL_FLOAT, false, 0, vertexBuffer)
        GLES20.glEnableVertexAttribArray(aTexCoordLoc)
        GLES20.glVertexAttribPointer(aTexCoordLoc, 2, GLES20.GL_FLOAT, false, 0, texCoordBuffer)

        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)

        GLES20.glDisableVertexAttribArray(aPositionLoc)
        GLES20.glDisableVertexAttribArray(aTexCoordLoc)

        // Tag the frame with the requested timestamp before swapping. EGL takes
        // nanoseconds; the public API uses microseconds (matches MediaCodec).
        EGLExt.eglPresentationTimeANDROID(eglDisplay, eglSurface, presentationTimeUs * 1_000L)
        EGL14.eglSwapBuffers(eglDisplay, eglSurface)
    }

    /** Signals end-of-stream and flushes remaining encoded packets. */
    fun finish() {
        encoder.signalEndOfInputStream()
        drainEncoder(endOfStream = true)
    }

    fun release() {
        runCatching { encoder.stop() }
        runCatching { encoder.release() }
        runCatching { inputSurface.release() }
        if (muxerStarted) {
            runCatching { muxer.stop() }
        }
        runCatching { muxer.release() }
        releaseEGL()
        if (textureId != 0) {
            GLES20.glDeleteTextures(1, intArrayOf(textureId), 0)
            textureId = 0
        }
        if (program != 0) {
            GLES20.glDeleteProgram(program)
            program = 0
        }
    }

    // -- Encoder / muxer --

    private fun drainEncoder(endOfStream: Boolean) {
        val timeoutUs = if (endOfStream) 10_000L else 0L
        while (true) {
            val outputIndex = encoder.dequeueOutputBuffer(bufferInfo, timeoutUs)
            when {
                outputIndex == MediaCodec.INFO_TRY_AGAIN_LATER -> {
                    if (!endOfStream) return
                    // else: keep looping until we see end-of-stream
                }
                outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                    check(!muxerStarted) { "Encoder format changed twice" }
                    trackIndex = muxer.addTrack(encoder.outputFormat)
                    muxer.start()
                    muxerStarted = true
                }
                outputIndex < 0 -> {
                    // Ignore other negative codes.
                }
                else -> {
                    val encoded = encoder.getOutputBuffer(outputIndex)
                        ?: error("Encoder output buffer $outputIndex was null")
                    if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0) {
                        // Codec config was already merged into the muxer track via
                        // the format-changed path; drop this buffer.
                        bufferInfo.size = 0
                    }
                    if (bufferInfo.size != 0 && muxerStarted) {
                        encoded.position(bufferInfo.offset)
                        encoded.limit(bufferInfo.offset + bufferInfo.size)
                        muxer.writeSampleData(trackIndex, encoded, bufferInfo)
                    }
                    encoder.releaseOutputBuffer(outputIndex, false)
                    if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) return
                }
            }
        }
    }

    // -- EGL setup --

    private fun setupEGL() {
        eglDisplay = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY)
        check(eglDisplay !== EGL14.EGL_NO_DISPLAY) { "eglGetDisplay failed" }
        val version = IntArray(2)
        check(EGL14.eglInitialize(eglDisplay, version, 0, version, 1)) {
            "eglInitialize failed"
        }
        val attribList = intArrayOf(
            EGL14.EGL_RED_SIZE, 8,
            EGL14.EGL_GREEN_SIZE, 8,
            EGL14.EGL_BLUE_SIZE, 8,
            EGL14.EGL_ALPHA_SIZE, 8,
            EGL14.EGL_RENDERABLE_TYPE, EGL14.EGL_OPENGL_ES2_BIT,
            EGLExt.EGL_RECORDABLE_ANDROID, 1,
            EGL14.EGL_NONE
        )
        val configs = arrayOfNulls<EGLConfig>(1)
        val numConfigs = IntArray(1)
        check(
            EGL14.eglChooseConfig(
                eglDisplay, attribList, 0, configs, 0, configs.size, numConfigs, 0
            )
        ) { "eglChooseConfig failed" }
        val ctxAttribs = intArrayOf(EGL14.EGL_CONTEXT_CLIENT_VERSION, 2, EGL14.EGL_NONE)
        eglContext = EGL14.eglCreateContext(
            eglDisplay, configs[0], EGL14.EGL_NO_CONTEXT, ctxAttribs, 0
        )
        check(eglContext !== EGL14.EGL_NO_CONTEXT) { "eglCreateContext failed" }
        val surfaceAttribs = intArrayOf(EGL14.EGL_NONE)
        eglSurface = EGL14.eglCreateWindowSurface(
            eglDisplay, configs[0], inputSurface, surfaceAttribs, 0
        )
        check(eglSurface !== EGL14.EGL_NO_SURFACE) { "eglCreateWindowSurface failed" }
        check(EGL14.eglMakeCurrent(eglDisplay, eglSurface, eglSurface, eglContext)) {
            "eglMakeCurrent failed"
        }
    }

    private fun releaseEGL() {
        if (eglDisplay !== EGL14.EGL_NO_DISPLAY) {
            EGL14.eglMakeCurrent(
                eglDisplay,
                EGL14.EGL_NO_SURFACE,
                EGL14.EGL_NO_SURFACE,
                EGL14.EGL_NO_CONTEXT
            )
            if (eglSurface !== EGL14.EGL_NO_SURFACE) {
                EGL14.eglDestroySurface(eglDisplay, eglSurface)
            }
            if (eglContext !== EGL14.EGL_NO_CONTEXT) {
                EGL14.eglDestroyContext(eglDisplay, eglContext)
            }
            EGL14.eglTerminate(eglDisplay)
        }
        eglDisplay = EGL14.EGL_NO_DISPLAY
        eglContext = EGL14.EGL_NO_CONTEXT
        eglSurface = EGL14.EGL_NO_SURFACE
    }

    // -- Shader program & textured quad --

    private fun setupGLProgram() {
        val vertexShader = compileShader(GLES20.GL_VERTEX_SHADER, VERTEX_SHADER)
        val fragmentShader = compileShader(GLES20.GL_FRAGMENT_SHADER, FRAGMENT_SHADER)
        program = GLES20.glCreateProgram().also {
            GLES20.glAttachShader(it, vertexShader)
            GLES20.glAttachShader(it, fragmentShader)
            GLES20.glLinkProgram(it)
            val link = IntArray(1)
            GLES20.glGetProgramiv(it, GLES20.GL_LINK_STATUS, link, 0)
            if (link[0] == 0) {
                val log = GLES20.glGetProgramInfoLog(it)
                GLES20.glDeleteProgram(it)
                error("Failed to link program: $log")
            }
        }
        GLES20.glDeleteShader(vertexShader)
        GLES20.glDeleteShader(fragmentShader)

        aPositionLoc = GLES20.glGetAttribLocation(program, "aPosition")
        aTexCoordLoc = GLES20.glGetAttribLocation(program, "aTexCoord")
        uMvpMatrixLoc = GLES20.glGetUniformLocation(program, "uMvpMatrix")
        uTextureLoc = GLES20.glGetUniformLocation(program, "sTexture")

        val tex = IntArray(1)
        GLES20.glGenTextures(1, tex, 0)
        textureId = tex[0]

        Matrix.setIdentityM(mvpMatrix, 0)
        // Flip Y so RGBA bitmaps (top-left origin) appear right-side-up.
        Matrix.scaleM(mvpMatrix, 0, 1f, -1f, 1f)
    }

    private fun compileShader(type: Int, source: String): Int {
        val shader = GLES20.glCreateShader(type)
        GLES20.glShaderSource(shader, source)
        GLES20.glCompileShader(shader)
        val status = IntArray(1)
        GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, status, 0)
        if (status[0] == 0) {
            val log = GLES20.glGetShaderInfoLog(shader)
            GLES20.glDeleteShader(shader)
            error("Failed to compile shader: $log")
        }
        return shader
    }

    companion object {
        private const val VERTEX_SHADER = """
            uniform mat4 uMvpMatrix;
            attribute vec4 aPosition;
            attribute vec2 aTexCoord;
            varying vec2 vTexCoord;
            void main() {
              gl_Position = uMvpMatrix * aPosition;
              vTexCoord = aTexCoord;
            }
        """

        private const val FRAGMENT_SHADER = """
            precision mediump float;
            varying vec2 vTexCoord;
            uniform sampler2D sTexture;
            void main() {
              gl_FragColor = texture2D(sTexture, vTexCoord);
            }
        """

        // Fullscreen quad as triangle strip.
        private val VERTEX_DATA = floatArrayOf(
            -1f, -1f,
            1f, -1f,
            -1f, 1f,
            1f, 1f,
        )
        private val TEX_COORD_DATA = floatArrayOf(
            0f, 0f,
            1f, 0f,
            0f, 1f,
            1f, 1f,
        )
        private val vertexBuffer: FloatBuffer = ByteBuffer
            .allocateDirect(VERTEX_DATA.size * 4)
            .order(ByteOrder.nativeOrder())
            .asFloatBuffer()
            .apply { put(VERTEX_DATA); position(0) }
        private val texCoordBuffer: FloatBuffer = ByteBuffer
            .allocateDirect(TEX_COORD_DATA.size * 4)
            .order(ByteOrder.nativeOrder())
            .asFloatBuffer()
            .apply { put(TEX_COORD_DATA); position(0) }
    }
}
