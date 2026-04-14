import { NativeModules, Platform } from 'react-native';

const { TimelapseModule } = NativeModules;

const noop = async () => {};
const noopString = async () => '';

const isIOS = Platform.OS === 'ios';

export function startRecording(
  width: number,
  height: number,
  orientation: string,
  timerX: number,
  timerY: number,
  timerFilter: string,
  timerScale: number
): Promise<void> {
  if (!isIOS) return noop();
  return TimelapseModule.startRecording(width, height, orientation, timerX, timerY, timerFilter, timerScale);
}

export function addFrame(base64: string, elapsedSeconds: number): Promise<void> {
  if (!isIOS) return noop();
  return TimelapseModule.addFrame(base64, elapsedSeconds);
}

export function addCompositeFrame(cameraImagePath: string, overlayBase64: string): Promise<void> {
  if (!isIOS) return noop();
  return TimelapseModule.addCompositeFrame(cameraImagePath, overlayBase64);
}

export function stopRecording(): Promise<string> {
  if (!isIOS) return noopString();
  return TimelapseModule.stopRecording();
}

export function cancelRecording(): Promise<void> {
  if (!isIOS) return noop();
  return TimelapseModule.cancelRecording();
}
