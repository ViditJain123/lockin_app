import Foundation
import AVFoundation
import UIKit

@objc(TimelapseModule)
class TimelapseModule: NSObject {

  private var assetWriter: AVAssetWriter?
  private var writerInput: AVAssetWriterInput?
  private var adaptor: AVAssetWriterInputPixelBufferAdaptor?
  private var frameCount: Int = 0
  private var outputURL: URL?
  private let processingQueue = DispatchQueue(label: "com.lockin.timelapse", qos: .userInitiated)
  private var videoWidth: Int = 0
  private var videoHeight: Int = 0

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc func startRecording(_ width: Double, height: Double, orientation: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }

      // Clean up any previous session
      self.cleanup()

      // Set dimensions based on orientation
      let isLandscape = orientation == "landscape-left" || orientation == "landscape-right"
      if isLandscape {
        // Landscape: wider than tall
        self.videoWidth = max(Int(width), Int(height))
        self.videoHeight = min(Int(width), Int(height))
      } else {
        // Portrait: taller than wide
        self.videoWidth = min(Int(width), Int(height))
        self.videoHeight = max(Int(width), Int(height))
      }
      // Ensure even dimensions (required by H.264)
      if self.videoWidth % 2 != 0 { self.videoWidth += 1 }
      if self.videoHeight % 2 != 0 { self.videoHeight += 1 }
      self.frameCount = 0

      let cachesDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
      let timelapsesDir = cachesDir.appendingPathComponent("timelapses", isDirectory: true)
      try? FileManager.default.createDirectory(at: timelapsesDir, withIntermediateDirectories: true)
      let fileName = "timelapse_\(Int(Date().timeIntervalSince1970)).mp4"
      self.outputURL = timelapsesDir.appendingPathComponent(fileName)

      guard let url = self.outputURL else {
        reject("ERR_URL", "Failed to create output URL", nil)
        return
      }

      // Remove file if it exists
      try? FileManager.default.removeItem(at: url)

      do {
        let writer = try AVAssetWriter(outputURL: url, fileType: .mp4)

        let videoSettings: [String: Any] = [
          AVVideoCodecKey: AVVideoCodecType.h264,
          AVVideoWidthKey: self.videoWidth,
          AVVideoHeightKey: self.videoHeight,
          AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 2_000_000,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
          ]
        ]

        let input = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
        input.expectsMediaDataInRealTime = true

        let sourcePixelBufferAttributes: [String: Any] = [
          kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
          kCVPixelBufferWidthKey as String: self.videoWidth,
          kCVPixelBufferHeightKey as String: self.videoHeight,
        ]

        let pixelBufferAdaptor = AVAssetWriterInputPixelBufferAdaptor(
          assetWriterInput: input,
          sourcePixelBufferAttributes: sourcePixelBufferAttributes
        )

        writer.add(input)

        guard writer.startWriting() else {
          reject("ERR_WRITER", "Failed to start writing: \(writer.error?.localizedDescription ?? "unknown")", writer.error)
          return
        }

        writer.startSession(atSourceTime: .zero)

        self.assetWriter = writer
        self.writerInput = input
        self.adaptor = pixelBufferAdaptor

        resolve(nil)
      } catch {
        reject("ERR_INIT", "Failed to initialize AVAssetWriter: \(error.localizedDescription)", error)
      }
    }
  }

  @objc func addCompositeFrame(_ cameraImagePath: String, overlayBase64: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      guard let writer = self.assetWriter, writer.status == .writing else {
        reject("ERR_STATE", "Writer not ready", nil)
        return
      }
      guard let input = self.writerInput, let adaptor = self.adaptor else {
        reject("ERR_STATE", "Writer input not configured", nil)
        return
      }

      // Load camera image from file path
      let cleanPath = cameraImagePath.replacingOccurrences(of: "file://", with: "")
      guard let cameraImage = UIImage(contentsOfFile: cleanPath) else {
        reject("ERR_DECODE", "Failed to load camera image from path: \(cleanPath)", nil)
        return
      }

      // Decode overlay from base64
      guard let overlayData = Data(base64Encoded: overlayBase64, options: .ignoreUnknownCharacters),
            let overlayImage = UIImage(data: overlayData) else {
        reject("ERR_DECODE", "Failed to decode overlay base64 image", nil)
        return
      }

      // Composite: draw camera image first, then overlay on top
      let size = CGSize(width: self.videoWidth, height: self.videoHeight)
      UIGraphicsBeginImageContextWithOptions(size, true, 1.0)
      defer { UIGraphicsEndImageContext() }

      let cameraRect = self.aspectFillRect(imageSize: cameraImage.size, targetSize: size)
      cameraImage.draw(in: cameraRect)
      let overlayRect = self.aspectFillRect(imageSize: overlayImage.size, targetSize: size)
      overlayImage.draw(in: overlayRect)

      guard let composited = UIGraphicsGetImageFromCurrentImageContext() else {
        reject("ERR_COMPOSITE", "Failed to composite images", nil)
        return
      }

      guard let pixelBuffer = self.pixelBufferFromImage(composited) else {
        reject("ERR_BUFFER", "Failed to create pixel buffer", nil)
        return
      }

      let frameTime = CMTime(value: CMTimeValue(self.frameCount), timescale: 30)

      var retries = 0
      while !input.isReadyForMoreMediaData && retries < 100 {
        Thread.sleep(forTimeInterval: 0.01)
        retries += 1
      }

      if input.isReadyForMoreMediaData {
        if adaptor.append(pixelBuffer, withPresentationTime: frameTime) {
          self.frameCount += 1
          // Clean up the camera snapshot temp file
          try? FileManager.default.removeItem(atPath: cleanPath)
          resolve(nil)
        } else {
          reject("ERR_APPEND", "Failed to append frame: \(writer.error?.localizedDescription ?? "unknown")", writer.error)
        }
      } else {
        reject("ERR_READY", "Writer input not ready after timeout", nil)
      }
    }
  }

  @objc func addFrame(_ base64ImageData: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      guard let writer = self.assetWriter, writer.status == .writing else {
        reject("ERR_STATE", "Writer not ready", nil)
        return
      }
      guard let input = self.writerInput, let adaptor = self.adaptor else {
        reject("ERR_STATE", "Writer input not configured", nil)
        return
      }

      guard let imageData = Data(base64Encoded: base64ImageData, options: .ignoreUnknownCharacters),
            let image = UIImage(data: imageData) else {
        reject("ERR_DECODE", "Failed to decode base64 image", nil)
        return
      }

      guard let pixelBuffer = self.pixelBufferFromImage(image) else {
        reject("ERR_BUFFER", "Failed to create pixel buffer", nil)
        return
      }

      // Each frame at 30fps: frame N is at time N/30
      let frameTime = CMTime(value: CMTimeValue(self.frameCount), timescale: 30)

      // Wait for input to be ready
      var retries = 0
      while !input.isReadyForMoreMediaData && retries < 100 {
        Thread.sleep(forTimeInterval: 0.01)
        retries += 1
      }

      if input.isReadyForMoreMediaData {
        if adaptor.append(pixelBuffer, withPresentationTime: frameTime) {
          self.frameCount += 1
          resolve(nil)
        } else {
          reject("ERR_APPEND", "Failed to append frame: \(writer.error?.localizedDescription ?? "unknown")", writer.error)
        }
      } else {
        reject("ERR_READY", "Writer input not ready after timeout", nil)
      }
    }
  }

  @objc func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }

      guard let writer = self.assetWriter else {
        reject("ERR_STATE", "No active recording", nil)
        return
      }

      // Don't save empty videos
      if self.frameCount == 0 {
        writer.cancelWriting()
        self.cleanup()
        reject("ERR_EMPTY", "No frames were captured", nil)
        return
      }

      self.writerInput?.markAsFinished()

      writer.finishWriting { [weak self] in
        guard let self = self else { return }

        if writer.status == .completed, let url = self.outputURL {
          let filePath = url.absoluteString
          self.cleanupWriter()
          resolve(filePath)
        } else {
          reject("ERR_FINISH", "Failed to finish writing: \(writer.error?.localizedDescription ?? "unknown")", writer.error)
          self.cleanup()
        }
      }
    }
  }

  @objc func cancelRecording(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      self.assetWriter?.cancelWriting()
      // Delete the file for cancelled recordings
      if let url = self.outputURL {
        try? FileManager.default.removeItem(at: url)
      }
      self.cleanupWriter()
      resolve(nil)
    }
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

  private func pixelBufferFromImage(_ image: UIImage) -> CVPixelBuffer? {
    guard let cgImage = image.cgImage else { return nil }

    let width = self.videoWidth
    let height = self.videoHeight

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

    let imageSize = CGSize(width: cgImage.width, height: cgImage.height)
    let targetSize = CGSize(width: width, height: height)
    let drawRect = aspectFillRect(imageSize: imageSize, targetSize: targetSize)
    context.draw(cgImage, in: drawRect)
    return buffer
  }

  /// Resets writer state without deleting the output file (for successful recordings)
  private func cleanupWriter() {
    assetWriter = nil
    writerInput = nil
    adaptor = nil
    outputURL = nil
    frameCount = 0
  }

  /// Full cleanup: deletes the output file and resets writer state
  private func cleanup() {
    if let url = outputURL {
      try? FileManager.default.removeItem(at: url)
    }
    cleanupWriter()
  }
}
