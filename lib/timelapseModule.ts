import { NativeModules } from 'react-native';

const { TimelapseModule } = NativeModules;

export function startRecording(
  width: number,
  height: number,
  orientation: string,
  timerX: number,
  timerY: number,
  timerFilter: string,
  timerScale: number
): Promise<string> {
  return TimelapseModule.startRecording(width, height, orientation, timerX, timerY, timerFilter, timerScale);
}

export function addFrame(base64: string, elapsedSeconds: number): Promise<void> {
  return TimelapseModule.addFrame(base64, elapsedSeconds);
}

export function addCompositeFrame(cameraImagePath: string, overlayBase64: string): Promise<void> {
  return TimelapseModule.addCompositeFrame(cameraImagePath, overlayBase64);
}

export function stopRecording(
  sessionDurationSeconds: number,
  taskName: string = ''
): Promise<string> {
  return TimelapseModule.stopRecording(sessionDurationSeconds, taskName);
}

export function finalizePendingRecording(
  pendingDirPath: string,
  sessionDurationSeconds: number,
  taskName: string = ''
): Promise<string> {
  return TimelapseModule.finalizePendingRecording(
    pendingDirPath,
    sessionDurationSeconds,
    taskName
  );
}

export function cancelRecording(): Promise<void> {
  return TimelapseModule.cancelRecording();
}

/**
 * Makes a smaller, fast-starting copy of a timelapse for posting as a story.
 * Resolves with a temp file URI, or null where the native exporter is absent
 * (Android, or an iOS build made before it was added).
 */
export async function compressForStory(videoUri: string): Promise<string | null> {
  if (typeof TimelapseModule?.compressForStory !== 'function') return null;
  return TimelapseModule.compressForStory(videoUri);
}
