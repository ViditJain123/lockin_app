#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TimelapseModule, NSObject)

RCT_EXTERN_METHOD(startRecording:(double)width
                  height:(double)height
                  orientation:(NSString *)orientation
                  timerX:(double)timerX
                  timerY:(double)timerY
                  timerFilter:(NSString *)timerFilter
                  timerScale:(double)timerScale
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(addFrame:(NSString *)base64ImageData
                  elapsedSeconds:(double)elapsedSeconds
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(addCompositeFrame:(NSString *)cameraImagePath
                  overlayBase64:(NSString *)overlayBase64
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopRecording:(double)sessionDurationSeconds
                  taskName:(NSString *)taskName
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(finalizePendingRecording:(NSString *)pendingDirPath
                  sessionDurationSeconds:(double)sessionDurationSeconds
                  taskName:(NSString *)taskName
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(compressForStory:(NSString *)inputPath
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancelRecording:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
