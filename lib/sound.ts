import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

import { usePrefsStore } from '@/store/usePrefsStore';

// Session sound design. Short synthesized cues (assets/sounds) that pair with
// the haptics in lib/haptics.ts. They respect the iOS silent switch and mix
// with whatever the user is already listening to.

const SOURCES = {
  tick: require('../assets/sounds/tick.wav'),
  lockin: require('../assets/sounds/lockin.wav'),
  ping: require('../assets/sounds/ping.wav'),
  goal: require('../assets/sounds/goal.wav'),
  unlock: require('../assets/sounds/unlock.wav'),
  blip: require('../assets/sounds/blip.wav'),
  tap: require('../assets/sounds/tap.wav'),
  away: require('../assets/sounds/away.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const VOLUME: Record<SoundName, number> = {
  tick: 0.7,
  lockin: 0.9,
  ping: 0.45,
  goal: 0.8,
  unlock: 0.85,
  blip: 0.35,
  tap: 0.4,
  away: 0.6,
};

const loaded: Partial<Record<SoundName, Audio.Sound>> = {};
let audioModeSet = false;

async function ensureAudioMode() {
  if (audioModeSet) return;
  audioModeSet = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
    });
  } catch (e) {
    console.warn('[Sound] setAudioMode failed:', e);
  }
}

async function load(name: SoundName) {
  if (loaded[name]) return loaded[name]!;
  const { sound } = await Audio.Sound.createAsync(SOURCES[name], { volume: VOLUME[name] });
  loaded[name] = sound;
  return sound;
}

/** Load every cue up front so the first countdown tick isn't late. */
export async function preloadSounds(): Promise<void> {
  await ensureAudioMode();
  await Promise.all(
    (Object.keys(SOURCES) as SoundName[]).map((n) => load(n).catch(() => undefined))
  );
}

export function playSound(name: SoundName): void {
  if (!usePrefsStore.getState().soundEnabled) return;
  ensureAudioMode()
    .then(() => load(name))
    .then((s) => s.replayAsync())
    .catch((e) => console.warn(`[Sound] ${name} failed:`, e?.message ?? e));
}
