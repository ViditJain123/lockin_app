import Foundation
import AVFoundation
import UIKit

private enum FrameEncodeResult {
  case success(Data)
  case failure(code: String, message: String)
}

@objc(TimelapseModule)
class TimelapseModule: NSObject {

  // Serial work queue. All mutation of the per-session state and all
  // file I/O happens here.
  private let processingQueue = DispatchQueue(label: "com.lockin.timelapse", qos: .userInitiated)

  // Per-session state
  private var sessionDir: URL?
  private var sessionStartDate: Date?
  private var videoWidth: Int = 0
  private var videoHeight: Int = 0
  private var frameOverlay: TimelapseFrameOverlay?

  private struct StoredFrame { let url: URL; let elapsedMs: Int }
  private var frames: [StoredFrame] = []
  // Monotonic guard: the JS bridge can in principle deliver addFrame calls
  // out of order if dispatch races. Decimation relies on elapsedMs being
  // non-decreasing, so we clamp every incoming timestamp to lastElapsedMs+1.
  private var lastElapsedMs: Int = -1
  private var isRecording: Bool = false

  // Config
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
      NSLog("[Timelapse] didReceiveMemoryWarning (recording=\(self?.isRecording ?? false))")
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

  // MARK: - Path helpers

  private static func timelapsesDir() -> URL {
    let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    let dir = docs.appendingPathComponent("timelapses", isDirectory: true)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir
  }

  private static func newSessionDir() -> URL {
    let ts = Int(Date().timeIntervalSince1970 * 1000)
    let dir = timelapsesDir().appendingPathComponent("pending_\(ts)", isDirectory: true)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir
  }

  private static func metaURL(in sessionDir: URL) -> URL {
    return sessionDir.appendingPathComponent("meta.json")
  }

  private static func frameURL(in sessionDir: URL, index: Int, elapsedMs: Int) -> URL {
    // Encoding elapsedMs in the filename keeps on-disk state self-describing,
    // which crash recovery (finalizePendingRecording) relies on to sort
    // frames by real time without an out-of-band manifest.
    let name = String(format: "frame_%07d_t%010d.jpg", index, elapsedMs)
    return sessionDir.appendingPathComponent(name)
  }

  // MARK: - Start

  @objc func startRecording(_ width: Double, height: Double, orientation: String, timerX: Double, timerY: Double, timerFilter: String, timerScale: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }

      // Clean up any previous session (files + instance state).
      self.discardCurrentSession()

      // Dimensions
      let isLandscape = orientation == "landscape-left" || orientation == "landscape-right"
      if isLandscape {
        self.videoWidth = max(Int(width), Int(height))
        self.videoHeight = min(Int(width), Int(height))
      } else {
        self.videoWidth = min(Int(width), Int(height))
        self.videoHeight = max(Int(width), Int(height))
      }
      if self.videoWidth % 2 != 0 { self.videoWidth += 1 }
      if self.videoHeight % 2 != 0 { self.videoHeight += 1 }

      self.frameOverlay = TimelapseFrameOverlay(
        timerPosition: CGPoint(x: timerX, y: timerY),
        filterType: timerFilter,
        timerScale: CGFloat(timerScale),
        frameWidth: self.videoWidth,
        frameHeight: self.videoHeight
      )

      self.sessionStartDate = Date()
      self.frames.removeAll(keepingCapacity: true)
      self.lastElapsedMs = -1

      let dir = Self.newSessionDir()
      self.sessionDir = dir
      self.isRecording = true

      // Persist enough metadata that a crash-recovered session can
      // reconstruct everything it needs at finalize time.
      let meta: [String: Any] = [
        "videoWidth": self.videoWidth,
        "videoHeight": self.videoHeight,
        "orientation": orientation,
        "timerX": timerX,
        "timerY": timerY,
        "timerFilter": timerFilter,
        "timerScale": timerScale,
        "sessionStartDateMs": Int((self.sessionStartDate ?? Date()).timeIntervalSince1970 * 1000),
      ]
      if let data = try? JSONSerialization.data(withJSONObject: meta, options: []) {
        try? data.write(to: Self.metaURL(in: dir), options: .atomic)
      }

      resolve(dir.absoluteString)
    }
  }

  // MARK: - Add frame

  @objc func addFrame(_ base64ImageData: String, elapsedSeconds: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      guard self.isRecording, let dir = self.sessionDir else {
        reject("ERR_STATE", "Not recording", nil)
        return
      }

      // The first IntroOverlay.introFrameCount frames must be stored raw so
      // the intro card can render over clean pixels at finalize time.
      // decimateDiskBuffer() preserves this prefix across long sessions.
      let isIntroCandidate = self.frames.count < IntroOverlay.introFrameCount

      let jpegResult: FrameEncodeResult = autoreleasepool {
        guard let imageData = Data(base64Encoded: base64ImageData, options: .ignoreUnknownCharacters) else {
          return .failure(code: "ERR_DECODE", message: "Failed to decode base64 image")
        }
        // Intro-candidate frames have no timer overlay and don't need
        // resizing (the assembler scales them at encode time), so we can
        // skip the decompress+recompress cycle entirely and store the
        // original bytes. Saves a full CPU round-trip on every frame in
        // the initial 4fps capture burst.
        if isIntroCandidate {
          return .success(imageData)
        }
        guard let image = UIImage(data: imageData) else {
          return .failure(code: "ERR_DECODE", message: "Failed to decode image data")
        }
        let overlaid = self.frameOverlay?.applyOverlay(to: image, elapsedSeconds: Int(elapsedSeconds)) ?? image
        guard let jpeg = overlaid.jpegData(compressionQuality: self.jpegQuality) else {
          return .failure(code: "ERR_ENCODE", message: "Failed to encode frame as JPEG")
        }
        return .success(jpeg)
      }

      switch jpegResult {
      case .failure(let code, let message):
        reject(code, message, nil)
      case .success(let jpeg):
        self.persistFrame(jpeg: jpeg, elapsedSeconds: elapsedSeconds, in: dir, resolve: resolve, reject: reject)
      }
    }
  }

  @objc func addCompositeFrame(_ cameraImagePath: String, overlayBase64: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      guard self.isRecording, let dir = self.sessionDir else {
        reject("ERR_STATE", "Not recording", nil)
        return
      }

      let jpegResult: FrameEncodeResult = autoreleasepool {
        let cleanPath = cameraImagePath.replacingOccurrences(of: "file://", with: "")
        guard let cameraImage = UIImage(contentsOfFile: cleanPath) else {
          return .failure(code: "ERR_DECODE", message: "Failed to load camera image from path: \(cleanPath)")
        }
        guard let overlayData = Data(base64Encoded: overlayBase64, options: .ignoreUnknownCharacters),
              let overlayImage = UIImage(data: overlayData) else {
          return .failure(code: "ERR_DECODE", message: "Failed to decode overlay base64 image")
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
          return .failure(code: "ERR_COMPOSITE", message: "Failed to composite / encode frame")
        }
        try? FileManager.default.removeItem(atPath: cleanPath)
        return .success(jpeg)
      }

      switch jpegResult {
      case .failure(let code, let message):
        reject(code, message, nil)
      case .success(let jpeg):
        // No JS caller passes an elapsed time on this path, so derive it
        // from sessionStartDate. Falls back to 0 if state was wiped mid-flight.
        let elapsed = self.sessionStartDate.map { Date().timeIntervalSince($0) } ?? 0
        self.persistFrame(jpeg: jpeg, elapsedSeconds: elapsed, in: dir, resolve: resolve, reject: reject)
      }
    }
  }

  /// Shared tail for addFrame / addCompositeFrame: writes the encoded JPEG
  /// to the session directory and advances the frame counter. Must be
  /// called from the processingQueue.
  private func persistFrame(jpeg: Data, elapsedSeconds: Double, in dir: URL, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    var elapsedMs = Int((elapsedSeconds * 1000).rounded())
    // Clamp to strict-monotonic so decimation's time-bucket math holds even
    // if the bridge ever delivers addFrame calls slightly out of order.
    elapsedMs = max(elapsedMs, lastElapsedMs + 1)
    lastElapsedMs = elapsedMs

    let index = frames.count
    let url = Self.frameURL(in: dir, index: index, elapsedMs: elapsedMs)
    do {
      try jpeg.write(to: url, options: .atomic)
    } catch {
      reject("ERR_WRITE", "Failed to write frame to disk: \(error.localizedDescription)", error)
      return
    }
    frames.append(StoredFrame(url: url, elapsedMs: elapsedMs))

    if frames.count > maxBufferFrames {
      decimateDiskBuffer()
    }
    resolve(nil)
  }

  // MARK: - Decimation

  /// Decimates the on-disk frame buffer in place, preserving the raw intro
  /// prefix. Called when frame count exceeds maxBufferFrames. Selection is
  /// time-aware: the suffix is divided into N equal-time buckets and one
  /// frame is kept per bucket (closest to bucket center). This produces a
  /// uniform-in-real-time distribution regardless of input cadence — the
  /// previous index-halving algorithm was time-uniform only when capture
  /// rate was constant, which it isn't (see CAPTURE_SCHEDULE in record.tsx).
  private func decimateDiskBuffer() {
    let preservePrefix = IntroOverlay.introFrameCount
    guard frames.count > preservePrefix + 2 else { return }

    let suffix = Array(frames[preservePrefix...])
    // Halve the suffix budget so we don't re-trigger decimation on the very
    // next addFrame. preservePrefix/2 is subtracted only as a rough budget
    // adjustment — exact accounting isn't needed.
    let targetSuffixCount = max(2, maxBufferFrames / 2 - preservePrefix / 2)
    if suffix.count <= targetSuffixCount { return }

    let tStart = suffix.first!.elapsedMs
    let tEnd = suffix.last!.elapsedMs
    let span = max(1, tEnd - tStart)

    var keptSuffix: [StoredFrame] = []
    keptSuffix.reserveCapacity(targetSuffixCount)
    var lastKeptIdx = -1
    for b in 0..<targetSuffixCount {
      // Bucket center in ms: tStart + (b + 0.5) * span / target
      let bucketCenter = tStart + (span * (2 * b + 1)) / (2 * targetSuffixCount)
      var bestIdx = lastKeptIdx + 1
      if bestIdx >= suffix.count { break }
      var bestDist = abs(suffix[bestIdx].elapsedMs - bucketCenter)
      var i = bestIdx + 1
      while i < suffix.count {
        let d = abs(suffix[i].elapsedMs - bucketCenter)
        // <= so we prefer the later of two equidistant frames; the moment d
        // grows we know we've passed the closest (timestamps are monotonic).
        if d <= bestDist {
          bestDist = d
          bestIdx = i
        } else {
          break
        }
        i += 1
      }
      keptSuffix.append(suffix[bestIdx])
      lastKeptIdx = bestIdx
    }
    // Force-keep the very last frame so the video ends at the true end of
    // the session, not several seconds short.
    if keptSuffix.last?.url != suffix.last?.url {
      keptSuffix.append(suffix.last!)
    }

    let keptURLs = Set(keptSuffix.map { $0.url })
    for f in suffix where !keptURLs.contains(f.url) {
      try? FileManager.default.removeItem(at: f.url)
    }

    frames = Array(frames.prefix(preservePrefix)) + keptSuffix
  }

  // MARK: - Stop

  @objc func stopRecording(_ sessionDurationSeconds: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      guard self.isRecording, let dir = self.sessionDir else {
        reject("ERR_STATE", "No active recording", nil)
        return
      }
      self.isRecording = false

      let capturedURLs = self.frames.map { $0.url }
      let startDate = self.sessionStartDate ?? Date()
      let width = self.videoWidth
      let height = self.videoHeight

      self.assembleAndFinalize(
        frameURLs: capturedURLs,
        width: width,
        height: height,
        sessionStartDate: startDate,
        sessionDurationSeconds: sessionDurationSeconds,
        pendingDir: dir,
        clearInstanceState: true,
        resolve: resolve,
        reject: reject
      )
    }
  }

  /// Invoked from JS on app start when a pending session directory was left
  /// behind by a prior crashed/killed process. Rebuilds the output .mp4 from
  /// the on-disk frames and meta.json.
  @objc func finalizePendingRecording(_ pendingDirPath: String, sessionDurationSeconds: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      if self.isRecording {
        reject("ERR_STATE", "A recording is currently in progress", nil)
        return
      }

      let cleanPath = pendingDirPath.replacingOccurrences(of: "file://", with: "")
      let dir = URL(fileURLWithPath: cleanPath, isDirectory: true)

      guard FileManager.default.fileExists(atPath: dir.path) else {
        reject("ERR_NO_DIR", "Pending session directory does not exist: \(dir.path)", nil)
        return
      }

      let meta = Self.metaURL(in: dir)
      guard FileManager.default.fileExists(atPath: meta.path),
            let metaData = try? Data(contentsOf: meta),
            let json = try? JSONSerialization.jsonObject(with: metaData) as? [String: Any],
            let width = json["videoWidth"] as? Int,
            let height = json["videoHeight"] as? Int,
            let startMs = json["sessionStartDateMs"] as? Int else {
        try? FileManager.default.removeItem(at: dir)
        reject("ERR_META", "Failed to read meta.json — pending session is unrecoverable", nil)
        return
      }
      let startDate = Date(timeIntervalSince1970: TimeInterval(startMs) / 1000.0)

      let contents = (try? FileManager.default.contentsOfDirectory(
        at: dir,
        includingPropertiesForKeys: nil,
        options: [.skipsHiddenFiles]
      )) ?? []

      // Sort by elapsed-ms parsed from the filename. Falls back to capture
      // index for pre-upgrade pending dirs that used the old `frame_NNNNNNN.jpg`
      // format — those finalize with whatever (possibly non-uniform) ordering
      // they had pre-fix, which is no worse than the prior behavior.
      let parsed: [(URL, Int)] = contents
        .filter { $0.pathExtension.lowercased() == "jpg" && $0.lastPathComponent.hasPrefix("frame_") }
        .compactMap { url in
          let stem = url.deletingPathExtension().lastPathComponent
          let parts = stem.split(separator: "_")
          if parts.count == 3, parts[0] == "frame", parts[2].hasPrefix("t"),
             let t = Int(parts[2].dropFirst()) {
            return (url, t)
          }
          if parts.count == 2, parts[0] == "frame", let i = Int(parts[1]) {
            return (url, i)
          }
          return nil
        }
      let frameURLs = parsed.sorted { $0.1 < $1.1 }.map { $0.0 }

      if frameURLs.isEmpty {
        try? FileManager.default.removeItem(at: dir)
        reject("ERR_EMPTY", "No frames in pending session", nil)
        return
      }

      self.assembleAndFinalize(
        frameURLs: frameURLs,
        width: width,
        height: height,
        sessionStartDate: startDate,
        sessionDurationSeconds: sessionDurationSeconds,
        pendingDir: dir,
        clearInstanceState: false,
        resolve: resolve,
        reject: reject
      )
    }
  }

  /// Encodes the pending session's on-disk frames into a single .mp4 inside
  /// Documents/timelapses/. Each iteration is wrapped in autoreleasepool so
  /// long sessions don't accumulate Core Graphics temporaries and OOM.
  ///
  /// Called from stopRecording (live session) and finalizePendingRecording
  /// (crash recovery). The clearInstanceState flag controls whether the
  /// in-progress session state on `self` gets wiped — live path yes, recovery
  /// path no (don't clobber any concurrently-started session).
  private func assembleAndFinalize(
    frameURLs: [URL],
    width: Int,
    height: Int,
    sessionStartDate: Date,
    sessionDurationSeconds: Double,
    pendingDir: URL,
    clearInstanceState: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let clearStateIfNeeded: () -> Void = { [weak self] in
      guard clearInstanceState, let self = self else { return }
      self.clearInstanceState()
    }

    if frameURLs.isEmpty {
      try? FileManager.default.removeItem(at: pendingDir)
      clearStateIfNeeded()
      reject("ERR_EMPTY", "No frames were captured", nil)
      return
    }

    let outDir = Self.timelapsesDir()
    let fileName = "timelapse_\(Int(Date().timeIntervalSince1970)).mp4"
    let outURL = outDir.appendingPathComponent(fileName)
    try? FileManager.default.removeItem(at: outURL)

    let writer: AVAssetWriter
    do {
      writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
    } catch {
      try? FileManager.default.removeItem(at: pendingDir)
      clearStateIfNeeded()
      reject("ERR_INIT", "Failed to initialize AVAssetWriter: \(error.localizedDescription)", error)
      return
    }

    let videoSettings: [String: Any] = [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: width,
      AVVideoHeightKey: height,
      AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 8_000_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
      ]
    ]

    let input = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
    input.expectsMediaDataInRealTime = false

    let sourcePixelBufferAttributes: [String: Any] = [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
      kCVPixelBufferWidthKey as String: width,
      kCVPixelBufferHeightKey as String: height,
    ]

    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
      assetWriterInput: input,
      sourcePixelBufferAttributes: sourcePixelBufferAttributes
    )

    writer.add(input)

    guard writer.startWriting() else {
      try? FileManager.default.removeItem(at: outURL)
      try? FileManager.default.removeItem(at: pendingDir)
      clearStateIfNeeded()
      reject("ERR_WRITER", "Failed to start writing: \(writer.error?.localizedDescription ?? "unknown")", writer.error)
      return
    }

    writer.startSession(atSourceTime: .zero)

    // Intro overlay is rendered at finalize time because it depends on the
    // total session duration, which is only known once recording stops.
    let introInputs = IntroOverlayInputs(
      sessionDurationSeconds: sessionDurationSeconds,
      sessionStartDate: sessionStartDate,
      videoSize: CGSize(width: width, height: height)
    )
    let introOverlay = IntroOverlay(inputs: introInputs)
    let introCount = min(IntroOverlay.introFrameCount, frameURLs.count)

    var appendedCount = 0
    for (i, frameURL) in frameURLs.enumerated() {
      autoreleasepool {
        guard let image = UIImage(contentsOfFile: frameURL.path) else { return }

        let pixelBuffer: CVPixelBuffer?
        if i < introCount {
          pixelBuffer = self.pixelBufferFromImage(image, width: width, height: height) {
            introOverlay.draw(frameIndex: i)
          }
        } else {
          pixelBuffer = self.pixelBufferFromImage(image, width: width, height: height)
        }

        guard let pb = pixelBuffer else { return }

        var retries = 0
        while !input.isReadyForMoreMediaData && retries < 200 {
          Thread.sleep(forTimeInterval: 0.005)
          retries += 1
        }
        if !input.isReadyForMoreMediaData { return }

        let frameTime = CMTime(value: CMTimeValue(appendedCount), timescale: 30)
        if adaptor.append(pb, withPresentationTime: frameTime) {
          appendedCount += 1
        }
      }
    }

    if appendedCount == 0 {
      writer.cancelWriting()
      try? FileManager.default.removeItem(at: outURL)
      try? FileManager.default.removeItem(at: pendingDir)
      clearStateIfNeeded()
      reject("ERR_EMPTY", "No frames were appended to the writer", nil)
      return
    }

    input.markAsFinished()
    writer.finishWriting {
      if writer.status == .completed {
        try? FileManager.default.removeItem(at: pendingDir)
        clearStateIfNeeded()
        resolve(outURL.absoluteString)
      } else {
        try? FileManager.default.removeItem(at: outURL)
        try? FileManager.default.removeItem(at: pendingDir)
        clearStateIfNeeded()
        reject("ERR_FINISH", "Failed to finish writing: \(writer.error?.localizedDescription ?? "unknown")", writer.error)
      }
    }
  }

  // MARK: - Cancel

  @objc func cancelRecording(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    processingQueue.async { [weak self] in
      guard let self = self else { return }
      self.discardCurrentSession()
      resolve(nil)
    }
  }

  // MARK: - Aspect-fill helper

  /// Returns a rect that aspect-fills `imageSize` into `targetSize` (centered, may overflow).
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

  // MARK: - Pixel buffer

  private func pixelBufferFromImage(_ image: UIImage, width: Int, height: Int, postDraw: (() -> Void)? = nil) -> CVPixelBuffer? {
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

  // MARK: - State resets

  /// Resets the in-memory per-session state without touching disk. Called
  /// after a successful finalize (live path) or from cancelRecording's
  /// discardCurrentSession.
  private func clearInstanceState() {
    sessionDir = nil
    sessionStartDate = nil
    frameOverlay = nil
    frames.removeAll(keepingCapacity: false)
    lastElapsedMs = -1
    isRecording = false
  }

  /// Full cleanup: deletes the current pending session directory and clears
  /// instance state. Called from startRecording (wipe stale session) and
  /// cancelRecording (user bailed).
  private func discardCurrentSession() {
    if let dir = sessionDir {
      try? FileManager.default.removeItem(at: dir)
    }
    clearInstanceState()
  }
}
