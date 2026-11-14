import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

// Background noise that loops while you lock in (timelapse or phone down).
// The loops are generated noise (assets/sounds/noise_*.m4a), 30s each.

export type FocusSoundId = 'off' | 'white' | 'pink' | 'brown';

export const FOCUS_SOUNDS: { id: FocusSoundId; label: string; note: string; icon: string }[] = [
  { id: 'off', label: 'Off', note: 'Silence', icon: 'volume-mute' },
  { id: 'white', label: 'White noise', note: 'Bright, masks chatter', icon: 'radio' },
  { id: 'pink', label: 'Pink noise', note: 'Softer, like steady rain', icon: 'rainy' },
  { id: 'brown', label: 'Brown noise', note: 'Deep, low rumble', icon: 'water' },
];

const SOURCES: Record<Exclude<FocusSoundId, 'off'>, number> = {
  white: require('../assets/sounds/noise_white.m4a'),
  pink: require('../assets/sounds/noise_pink.m4a'),
  brown: require('../assets/sounds/noise_brown.m4a'),
};

// White noise is the harshest at the same loudness, so it plays quietest
const VOLUME: Record<Exclude<FocusSoundId, 'off'>, number> = { white: 0.35, pink: 0.6, brown: 0.65 };

let current: { id: FocusSoundId; sound: Audio.Sound } | null = null;
let token = 0;

async function setMode(playing: boolean) {
  try {
    await Audio.setAudioModeAsync({
      // Noise should play even with the silent switch on; short cues should not
      playsInSilentModeIOS: playing,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
    });
  } catch (e) {
    console.warn('[FocusSound] setAudioMode failed:', e);
  }
}

async function fade(sound: Audio.Sound, from: number, to: number, ms: number) {
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    try {
      await sound.setVolumeAsync(from + ((to - from) * i) / steps);
    } catch {
      return;
    }
    await new Promise((r) => setTimeout(r, ms / steps));
  }
}

/** Start looping a sound (fades in). Replaces whatever is playing. 'off' stops. */
export async function playFocusSound(id: FocusSoundId): Promise<void> {
  if (current?.id === id) return;
  const my = ++token;
  await stopFocusSound();
  if (id === 'off' || my !== token) return;
  try {
    await setMode(true);
    const { sound } = await Audio.Sound.createAsync(SOURCES[id], { isLooping: true, volume: 0, shouldPlay: true });
    if (my !== token) {
      await sound.unloadAsync();
      return;
    }
    current = { id, sound };
    fade(sound, 0, VOLUME[id], 600);
  } catch (e) {
    console.warn('[FocusSound] play failed:', (e as Error)?.message ?? e);
  }
}

/** Fade out and unload the current sound, if any. */
export async function stopFocusSound(): Promise<void> {
  const playing = current;
  current = null;
  if (!playing) return;
  try {
    const status = await playing.sound.getStatusAsync();
    const vol = status.isLoaded ? status.volume : 0;
    await fade(playing.sound, vol, 0, 400);
    await playing.sound.unloadAsync();
  } catch {}
  if (!current) await setMode(false);
}
