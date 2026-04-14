import Foundation
import AVFoundation
import UIKit

@objc(TimelapseModule)
class TimelapseModule: NSObject {

  private struct BufferedFrame {
    let jpegData: Data
    let elapsedSeconds: Int
  }

  private var outputURL: URL?
  private let processingQueue = DispatchQueue(label: "com.lockin.timelapse", qos: .userInitiated)
  private var videoWidth: Int = 0
  private var videoHeight: Int = 0
  private var frameOverlay: TimelapseFrameOverlay?
  private var frameBuffer: [BufferedFrame] = []
  private var isRecording: Bool = false
  private var sessionStartDate: Date?

  private let maxBufferFrames = 600
  private let jpegQuality: CGFloat = 0.85

  private var memoryWarningObserver: NSObjectProtocol?

  override init() {
    super.init()
    memoryWarningObserver = NotificationCenter.default.addObserver(
      forName: UIApplication.didReceiveMemoryWarningNotification,
      object: nil,
      queue: nil
    ) { [weak self] _ in
      guard let self = self else { return }
      self.processingQueue.async {
        guard self.isRecording else { return }
        self.decimateBuffer()
      }
    }
  }

  deinit {
    if let observer = memoryWarningObserver {
      NotificationCenter.default.removeObserver(observer)
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc func startRecording(_ width: Double, height: Double, orientation: String, timerX: Double, timerY: Double, timerFilter: String, timerScale: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }

      // Clean up any previous session
      self.cleanup()

      // Set dimensions based on orientation
      let isLandscape = orientation == "landscape-left" || orientation == "landscape-right"
      if isLandscape {
        self.videoWidth = max(Int(width), Int(height))
        self.videoHeight = min(Int(width), Int(height))
      } else {
        self.videoWidth = min(Int(width), Int(height))
        self.videoHeight = max(Int(width), Int(height))
      }
      // Ensure even dimensions (required by H.264)
      if self.videoWidth % 2 != 0 { self.videoWidth += 1 }
      if self.videoHeight % 2 != 0 { self.videoHeight += 1 }

      self.frameOverlay = TimelapseFrameOverlay(
        timerPosition: CGPoint(x: timerX, y: timerY),
        filterType: timerFilter,
        timerScale: CGFloat(timerScale),
        frameWidth: self.videoWidth,
        frameHeight: self.videoHeight
      )

      self.frameBuffer.removeAll(keepingCapacity: true)
      self.outputURL = nil
      self.sessionStartDate = Date()
      self.isRecording = true
      resolve(nil)
    }
  }

  @objc func addCompositeFrame(_ cameraImagePath: String, overlayBase64: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      guard self.isRecording else {
        reject("ERR_STATE", "Not recording", nil)
        return
      }

      let cleanPath = cameraImagePath.replacingOccurrences(of: "file://", with: "")
      guard let cameraImage = UIImage(contentsOfFile: cleanPath) else {
        reject("ERR_DECODE", "Failed to load camera image from path: \(cleanPath)", nil)
        return
      }

      guard let overlayData = Data(base64Encoded: overlayBase64, options: .ignoreUnknownCharacters),
            let overlayImage = UIImage(data: overlayData) else {
        reject("ERR_DECODE", "Failed to decode overlay base64 image", nil)
        return
      }

      let size = CGSize(width: self.videoWidth, height: self.videoHeight)
      UIGraphicsBeginImageContextWithOptions(size, true, 1.0)
      let cameraRect = self.aspectFillRect(imageSize: cameraImage.size, targetSize: size)
      cameraImage.draw(in: cameraRect)
      let overlayRect = self.aspectFillRect(imageSize: overlayImage.size, targetSize: size)
      overlayImage.draw(in: overlayRect)
      let composited = UIGraphicsGetImageFromCurrentImageContext()
      UIGraphicsEndImageContext()

      guard let finalImage = composited,
            let jpeg = finalImage.jpegData(compressionQuality: self.jpegQuality) else {
        reject("ERR_COMPOSITE", "Failed to composite / encode frame", nil)
        return
      }

      try? FileManager.default.removeItem(atPath: cleanPath)

      self.frameBuffer.append(BufferedFrame(jpegData: jpeg, elapsedSeconds: 0))
      if self.frameBuffer.count > self.maxBufferFrames {
        self.decimateBuffer()
      }
      resolve(nil)
    }
  }

  @objc func addFrame(_ base64ImageData: String, elapsedSeconds: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      guard self.isRecording else {
        reject("ERR_STATE", "Not recording", nil)
        return
      }

      guard let imageData = Data(base64Encoded: base64ImageData, options: .ignoreUnknownCharacters),
            let image = UIImage(data: imageData) else {
        reject("ERR_DECODE", "Failed to decode base64 image", nil)
        return
      }

      // Apply timer overlay to the frame (unchanged from prior behavior)
      let overlaidImage = self.frameOverlay?.applyOverlay(to: image, elapsedSeconds: Int(elapsedSeconds)) ?? image

      guard let jpeg = overlaidImage.jpegData(compressionQuality: self.jpegQuality) else {
        reject("ERR_ENCODE", "Failed to encode overlaid frame as JPEG", nil)
        return
      }

      self.frameBuffer.append(BufferedFrame(jpegData: jpeg, elapsedSeconds: Int(elapsedSeconds)))
      if self.frameBuffer.count > self.maxBufferFrames {
        self.decimateBuffer()
      }
      resolve(nil)
    }
  }

  @objc func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      guard self.isRecording else {
        reject("ERR_STATE", "No active recording", nil)
        return
      }
      self.isRecording = false

      if self.frameBuffer.isEmpty {
        self.cleanup()
        reject("ERR_EMPTY", "No frames were captured", nil)
        return
      }

      let cachesDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
      let timelapsesDir = cachesDir.appendingPathComponent("timelapses", isDirectory: true)
      try? FileManager.default.createDirectory(at: timelapsesDir, withIntermediateDirectories: true)
      let fileName = "timelapse_\(Int(Date().timeIntervalSince1970)).mp4"
      let url = timelapsesDir.appendingPathComponent(fileName)
      try? FileManager.default.removeItem(at: url)
      self.outputURL = url

      do {
        let writer = try AVAssetWriter(outputURL: url, fileType: .mp4)

        let videoSettings: [String: Any] = [
          AVVideoCodecKey: AVVideoCodecType.h264,
          AVVideoWidthKey: self.videoWidth,
          AVVideoHeightKey: self.videoHeight,
          AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 8_000_000,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
          ]
        ]

        let input = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
        input.expectsMediaDataInRealTime = false

        let sourcePixelBufferAttributes: [String: Any] = [
          kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
          kCVPixelBufferWidthKey as String: self.videoWidth,
          kCVPixelBufferHeightKey as String: self.videoHeight,
        ]

        let adaptor = AVAssetWriterInputPixelBufferAdaptor(
          assetWriterInput: input,
          sourcePixelBufferAttributes: sourcePixelBufferAttributes
        )

        writer.add(input)

        guard writer.startWriting() else {
          reject("ERR_WRITER", "Failed to start writing: \(writer.error?.localizedDescription ?? "unknown")", writer.error)
          self.cleanup()
          return
        }

        writer.startSession(atSourceTime: .zero)

        // Build the intro overlay once. Static pieces (black, gradients,
        // logo, text) are pre-rendered inside the initializer so per-frame
        // draws are just alpha-blended CGImage blits.
        let totalSessionSeconds = TimeInterval(self.frameBuffer.last?.elapsedSeconds ?? 0)
        let introInputs = IntroOverlayInputs(
          sessionDurationSeconds: totalSessionSeconds,
          sessionStartDate: self.sessionStartDate ?? Date(),
          videoSize: CGSize(width: self.videoWidth, height: self.videoHeight)
        )
        let introOverlay = IntroOverlay(inputs: introInputs)
        let introFrameCount = introOverlay.introFrameCount

        var appendedCount = 0
        for (_, entry) in self.frameBuffer.enumerated() {
          guard let image = UIImage(data: entry.jpegData) else { continue }

          let outputFrameIndex = appendedCount
          let pixelBuffer: CVPixelBuffer?
          if outputFrameIndex < introFrameCount {
            pixelBuffer = self.pixelBufferFromImage(image) {
              introOverlay.draw(frameIndex: outputFrameIndex)
            }
          } else {
            pixelBuffer = self.pixelBufferFromImage(image)
          }

          guard let pb = pixelBuffer else { continue }

          var retries = 0
          while !input.isReadyForMoreMediaData && retries < 200 {
            Thread.sleep(forTimeInterval: 0.005)
            retries += 1
          }
          if !input.isReadyForMoreMediaData { continue }

          let frameTime = CMTime(value: CMTimeValue(appendedCount), timescale: 30)
          if adaptor.append(pb, withPresentationTime: frameTime) {
            appendedCount += 1
          }
        }

        self.frameBuffer.removeAll(keepingCapacity: false)

        if appendedCount == 0 {
          writer.cancelWriting()
          try? FileManager.default.removeItem(at: url)
          self.cleanupSession()
          reject("ERR_EMPTY", "No frames were appended to the writer", nil)
          return
        }

        input.markAsFinished()
        writer.finishWriting { [weak self] in
          guard let self = self else { return }
          if writer.status == .completed {
            let filePath = url.absoluteString
            self.cleanupSession()
            resolve(filePath)
          } else {
            try? FileManager.default.removeItem(at: url)
            self.cleanupSession()
            reject("ERR_FINISH", "Failed to finish writing: \(writer.error?.localizedDescription ?? "unknown")", writer.error)
          }
        }
      } catch {
        self.cleanup()
        reject("ERR_INIT", "Failed to initialize AVAssetWriter: \(error.localizedDescription)", error)
      }
    }
  }

  @objc func cancelRecording(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      self.isRecording = false
      if let url = self.outputURL {
        try? FileManager.default.removeItem(at: url)
      }
      self.cleanupSession()
      resolve(nil)
    }
  }

  // MARK: - Buffer decimation

  /// Keeps every other entry (indices 0, 2, 4, ...), halving the buffer in place.
  /// Called when the buffer exceeds `maxBufferFrames`, or on memory-warning.
  private func decimateBuffer() {
    guard frameBuffer.count > 1 else { return }
    var kept: [BufferedFrame] = []
    kept.reserveCapacity((frameBuffer.count + 1) / 2)
    for (index, entry) in frameBuffer.enumerated() where index % 2 == 0 {
      kept.append(entry)
    }
    frameBuffer = kept
  }

  // MARK: - Aspect-fill helper

  /// Returns a rect that aspect-fills `imageSize` into `targetSize` (centered, may overflow).
  private func aspectFillRect(imageSize: CGSize, targetSize: CGSize) -> CGRect {
    let widthRatio = targetSize.width / imageSize.width
    let heightRatio = targetSize.height / imageSize.height
    let scale = max(widthRatio, heightRatio) // fill, not fit
    let scaledW = imageSize.width * scale
    let scaledH = imageSize.height * scale
    let x = (targetSize.width - scaledW) / 2
    let y = (targetSize.height - scaledH) / 2
    return CGRect(x: x, y: y, width: scaledW, height: scaledH)
  }

  // MARK: - Private helpers

  private func pixelBufferFromImage(_ image: UIImage, postDraw: (() -> Void)? = nil) -> CVPixelBuffer? {
    let width = self.videoWidth
    let height = self.videoHeight
    let targetSize = CGSize(width: width, height: height)

    UIGraphicsBeginImageContextWithOptions(targetSize, true, 1.0)
    defer { UIGraphicsEndImageContext() }

    let drawRect = aspectFillRect(imageSize: image.size, targetSize: targetSize)
    image.draw(in: drawRect)

    postDraw?()

    guard let correctedImage = UIGraphicsGetImageFromCurrentImageContext(),
          let cgImage = correctedImage.cgImage else {
      return nil
    }

    let attrs: [String: Any] = [
      kCVPixelBufferCGImageCompatibilityKey as String: true,
      kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
    ]

    var pixelBuffer: CVPixelBuffer?
    let status = CVPixelBufferCreate(
      kCFAllocatorDefault,
      width,
      height,
      kCVPixelFormatType_32ARGB,
      attrs as CFDictionary,
      &pixelBuffer
    )

    guard status == kCVReturnSuccess, let buffer = pixelBuffer else {
      return nil
    }

    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }

    guard let context = CGContext(
      data: CVPixelBufferGetBaseAddress(buffer),
      width: width,
      height: height,
      bitsPerComponent: 8,
      bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
      space: CGColorSpaceCreateDeviceRGB(),
      bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
    ) else {
      return nil
    }

    context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
    return buffer
  }

  /// Resets per-session state. Does not delete the output file (used on success).
  private func cleanupSession() {
    outputURL = nil
    frameOverlay = nil
    frameBuffer.removeAll(keepingCapacity: false)
    sessionStartDate = nil
    isRecording = false
  }

  /// Full cleanup: deletes the output file (if any) and resets session state.
  private func cleanup() {
    if let url = outputURL {
      try? FileManager.default.removeItem(at: url)
    }
    cleanupSession()
  }
}
