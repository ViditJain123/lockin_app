import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';

import { DEMO_DATA_ENABLED } from '@/lib/config';
import type { Recording } from '@/store/useVideoGalleryStore';

// Dev-only sample timelapses. The clips aren't bundled with the app: they are
// copied into the app's Documents/demo-timelapses folder on the simulator, and
// only show up when those files exist (and DEMO_DATA_ENABLED is on).
export const DEMO_DIR = 'demo-timelapses';

const daysAgo = (d: number, h: number) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, 0, 0, 0);
  return t.toISOString();
};

const CLIPS = [
  { file: 'tl1', duration: 2 * 3600 + 14 * 60, at: daysAgo(0, 9) },
  { file: 'tl2', duration: 52 * 60, at: daysAgo(1, 15) },
  { file: 'tl3', duration: 90 * 60, at: daysAgo(2, 11) },
  { file: 'tl4', duration: 3 * 3600 + 5 * 60, at: daysAgo(3, 19) },
  { file: 'tl5', duration: 47 * 60, at: daysAgo(4, 8) },
  { file: 'tl6', duration: 65 * 60, at: daysAgo(5, 17) },
  { file: 'tl7', duration: 1 * 3600 + 40 * 60, at: daysAgo(6, 21) },
];

export const DEMO_RECORDINGS: Recording[] = CLIPS.map((c) => ({
  id: `demo-${c.file}`,
  type: 'timelapse',
  videoUri: `${DEMO_DIR}/${c.file}.mp4`,
  thumbnailUri: `${DEMO_DIR}/${c.file}.jpg`,
  sessionDurationSeconds: c.duration,
  createdAt: c.at,
}));

export async function demoClipsInstalled(): Promise<boolean> {
  if (!DEMO_DATA_ENABLED) return false;
  try {
    const info = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}${DEMO_DIR}/tl1.mp4`);
    return info.exists;
  } catch {
    return false;
  }
}

/** Sample timelapses when demo mode is on and the clips are installed, else [] */
export function useDemoTimelapses(): Recording[] {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    demoClipsInstalled().then(setReady);
  }, []);
  return ready ? DEMO_RECORDINGS : [];
}
