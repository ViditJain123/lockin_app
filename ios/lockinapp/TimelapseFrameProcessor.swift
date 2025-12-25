import Foundation
import AVFoundation
import CoreImage

/// Frame processor for timelapse capture
/// Handles frame timing (2fps sampling) and 9:16 crop
class TimelapseFrameProcessor: NSObject {
    
    // MARK: - Properties
    
    // Capture interval in milliseconds (500ms = 2fps)
    private let captureIntervalMs: Double
    
    // Last capture timestamp
    private var lastCaptureTime: CFAbsoluteTime = 0
    
    // Callback for processed frames
    var onFrameReady: ((CVPixelBuffer, CMTime) -> Void)?
    
    // CoreImage context for GPU-accelerated processing
    private lazy var ciContext: CIContext = {
        // Use Metal for GPU acceleration
        if let metalDevice = MTLCreateSystemDefaultDevice() {
            return CIContext(mtlDevice: metalDevice, options: [
                .cacheIntermediates: false,  // Don't cache - we process single frames
                .priorityRequestLow: false   // High priority processing
            ])
        }
        // Fallback to default
        return CIContext(options: [.cacheIntermediates: false])
    }()
    
    // Target output dimensions (portrait 9:16)
    private let targetWidth: Int = 1080
    private let targetHeight: Int = 1920
    
    // Processing queue for crop/resize
    private let processingQueue = DispatchQueue(
        label: "com.lockin.timelapse.processing",
        qos: .userInitiated,
        autoreleaseFrequency: .workItem
    )
    
    // Pre-allocated pixel buffer pool for output
    private var pixelBufferPool: CVPixelBufferPool?
    
    // MARK: - Initialization
    
    init(captureIntervalMs: Double = 500) {
        self.captureIntervalMs = captureIntervalMs
        super.init()
        setupPixelBufferPool()
    }
    
    private func setupPixelBufferPool() {
        let attributes: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey as String: targetWidth,
            kCVPixelBufferHeightKey as String: targetHeight,
            kCVPixelBufferMetalCompatibilityKey as String: true,
            kCVPixelBufferIOSurfacePropertiesKey as String: [:]
        ]
        
        let poolAttributes: [String: Any] = [
            kCVPixelBufferPoolMinimumBufferCountKey as String: 2  // Only need 1-2 buffers
        ]
        
        CVPixelBufferPoolCreate(
            kCFAllocatorDefault,
            poolAttributes as CFDictionary,
            attributes as CFDictionary,
            &pixelBufferPool
        )
    }
    
    // MARK: - Frame Processing
    
    func processSampleBuffer(_ sampleBuffer: CMSampleBuffer) {
        // Check if enough time has passed since last capture
        let currentTime = CFAbsoluteTimeGetCurrent()
        let intervalSeconds = captureIntervalMs / 1000.0
        
        guard currentTime - lastCaptureTime >= intervalSeconds else {
            return // Not time to capture yet
        }
        
        lastCaptureTime = currentTime
        
        // Process frame immediately in autoreleasepool
        autoreleasepool {
            guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
                return
            }
            
            let timestamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
            
            // Process on dedicated queue but dispatch synchronously
            // to ensure frame is processed before buffer is released
            processingQueue.sync {
                autoreleasepool {
                    if let outputBuffer = self.cropAndResize(pixelBuffer) {
                        self.onFrameReady?(outputBuffer, timestamp)
                    }
                }
            }
        }
    }
    
    /// Crop input buffer to 9:16 aspect ratio and resize to target dimensions
    private func cropAndResize(_ inputBuffer: CVPixelBuffer) -> CVPixelBuffer? {
        // Get input dimensions
        let inputWidth = CVPixelBufferGetWidth(inputBuffer)
        let inputHeight = CVPixelBufferGetHeight(inputBuffer)
        
        // Create CIImage from input
        let inputImage = CIImage(cvPixelBuffer: inputBuffer)
        
        // Calculate crop rect for 9:16 aspect ratio centered in input
        let cropRect = calculateCropRect(
            inputWidth: inputWidth,
            inputHeight: inputHeight,
            targetAspect: 9.0 / 16.0
        )
        
        // Crop to 9:16
        var processedImage = inputImage.cropped(to: cropRect)
        
        // Translate to origin (crop maintains original coordinates)
        processedImage = processedImage.transformed(by: CGAffineTransform(
            translationX: -cropRect.origin.x,
            y: -cropRect.origin.y
        ))
        
        // Scale to target size
        let scaleX = CGFloat(targetWidth) / cropRect.width
        let scaleY = CGFloat(targetHeight) / cropRect.height
        processedImage = processedImage.transformed(by: CGAffineTransform(
            scaleX: scaleX,
            y: scaleY
        ))
        
        // Get output buffer from pool
        guard let pool = pixelBufferPool else {
            return nil
        }
        
        var outputBuffer: CVPixelBuffer?
        let status = CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, pool, &outputBuffer)
        
        guard status == kCVReturnSuccess, let output = outputBuffer else {
            return nil
        }
        
        // Render to output buffer
        ciContext.render(
            processedImage,
            to: output,
            bounds: CGRect(x: 0, y: 0, width: targetWidth, height: targetHeight),
            colorSpace: CGColorSpaceCreateDeviceRGB()
        )
        
        return output
    }
    
    /// Calculate crop rectangle for target aspect ratio
    private func calculateCropRect(inputWidth: Int, inputHeight: Int, targetAspect: CGFloat) -> CGRect {
        let inputAspect = CGFloat(inputWidth) / CGFloat(inputHeight)
        
        var cropWidth: CGFloat
        var cropHeight: CGFloat
        
        if inputAspect > targetAspect {
            // Input is wider - crop sides
            cropHeight = CGFloat(inputHeight)
            cropWidth = cropHeight * targetAspect
        } else {
            // Input is taller - crop top/bottom
            cropWidth = CGFloat(inputWidth)
            cropHeight = cropWidth / targetAspect
        }
        
        // Center the crop
        let cropX = (CGFloat(inputWidth) - cropWidth) / 2
        let cropY = (CGFloat(inputHeight) - cropHeight) / 2
        
        return CGRect(x: cropX, y: cropY, width: cropWidth, height: cropHeight)
    }
    
    // MARK: - Cleanup
    
    func reset() {
        lastCaptureTime = 0
    }
}
