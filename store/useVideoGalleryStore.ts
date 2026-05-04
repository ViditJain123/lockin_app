import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { v4 as uuidv4 } from 'uuid';
import { posthog } from '../lib/posthog';
import * as Timelapse from '../lib/timelapseModule';
import type { LocalSession } from './useSessionStore';

const VIDEO_GALLERY_STORAGE_KEY = 'lockin-video-gallery';
export const PENDING_RECORDING_KEY = 'lockin-pending-recording';

/// Forces the zustand persist envelope to flush to AsyncStorage synchronously.
/// Zustand's persist middleware writes async on state changes and doesn't
/// expose a promise to await, so a crash in the ~ms after addRecording can
/// lose the metadata. Callers use this before navigating away from a critical
/// state transition. Matches the envelope shape used by zustand/middleware.
export async function flushGallery(): Promise<void> {
  const state = useVideoGalleryStore.getState();
  await AsyncStorage.setItem(
    VIDEO_GALLERY_STORAGE_KEY,
    JSON.stringify({
      state: { recordings: state.recordings },
      version: 2,
    })
  );
}

export type RecordingKind = 'timelapse' | 'photo';

export interface Recording {
  id: string;
  type: RecordingKind;
  videoUri?: string;            // timelapse only
  photoUri?: string;            // photo only — raw JPEG
  cardUri?: string;             // photo only — rendered card with overlay
  thumbnailUri: string | null;  // for photos this points at the cardUri
  sessionDurationSeconds: number;
  createdAt: string;
}

interface VideoGalleryState {
  recordings: Recording[];
  addRecording: (rec: Recording) => void;
  removeRecording: (id: string) => void;
}

/** Convert a relative path to an absolute file URI at runtime */
export function resolveUri(relativePath: string): string {
  // Already absolute — return as-is (shouldn't happen after migration, but safe)
  if (relativePath.startsWith('file://') || relativePath.startsWith('/')) {
    return relativePath;
  }
  return FileSystem.documentDirectory + relativePath;
}

/** Strip documentDirectory prefix to get a relative path */
function toRelativePath(absoluteUri: string): string {
  const docDir = FileSystem.documentDirectory;
  if (docDir && absoluteUri.startsWith(docDir)) {
    return absoluteUri.slice(docDir.length);
  }
  // Try stripping any documentDirectory-like prefix (handles UUID changes)
  // Pattern: file:///var/mobile/.../Documents/ or file:///data/.../documents/
  const match = absoluteUri.match(/\/Documents\/(.+)$/i);
  if (match) return match[1];
  return absoluteUri;
}

export const useVideoGalleryStore = create<VideoGalleryState>()(
  persist(
    (set) => ({
      recordings: [],
      addRecording: (rec) =>
        set((state) => ({ recordings: [rec, ...state.recordings] })),
      removeRecording: (id) =>
        set((state) => ({
          recordings: state.recordings.filter((r) => r.id !== id),
        })),
    }),
    {
      name: VIDEO_GALLERY_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        let state = persistedState;
        if (version === 0 || version === undefined) {
          // v0 → v1: convert absolute paths to relative paths
          const recordings: any[] = (state?.recordings || []).map((rec: any) => ({
            ...rec,
            videoUri: rec.videoUri ? toRelativePath(rec.videoUri) : rec.videoUri,
            thumbnailUri: rec.thumbnailUri ? toRelativePath(rec.thumbnailUri) : null,
          }));
          state = { ...state, recordings };
          version = 1;
        }
        if (version === 1) {
          // v1 → v2: add `type` discriminator. All legacy entries are timelapses.
          const recordings: Recording[] = (state?.recordings || []).map((rec: any) => ({
            ...rec,
            type: rec.type ?? 'timelapse',
          }));
          state = { ...state, recordings };
        }
        return state as VideoGalleryState;
      },
      onRehydrateStorage: () => {
        return async (state) => {
          if (!state) {
            console.log('[VideoGallery] Hydration returned null state (fresh install)');
            return;
          }
          console.log('[VideoGallery] Hydrated:', state.recordings.length, 'recordings');
          try {
            // First, finalize any pending recording left behind by a crash.
            // This writes the recovered .mp4 into Documents/timelapses/ so
            // scanOrphanedFiles picks it up as a normal orphan on the same pass.
            await finalizeCrashedRecording();
            // Then scan for any loose .mp4s and any loose photo+card pairs.
            await scanOrphanedFiles(state);
            await scanOrphanedPhotos(useVideoGalleryStore.getState());
            // These two both operate on the post-scan store state and are
            // independent of each other — parallelize.
            await Promise.all([
              cleanOrphanedRecordings(useVideoGalleryStore.getState()),
              regenerateMissingThumbnails(useVideoGalleryStore.getState()),
            ]);
          } catch (err) {
            console.warn('[VideoGallery] Rehydration pipeline failed:', err);
            posthog.capture('video_gallery_rehydrate_failed', {
              error: (err as Error)?.message ?? String(err),
            });
          }
        };
      },
    }
  )
);

/// Reads lockin-pending-recording from AsyncStorage and asks the native
/// module to finalize any mid-recording session that was killed by a crash
/// or OOM. On success the recovered .mp4 lands in Documents/timelapses/ and
/// gets picked up by scanOrphanedFiles in the next step. On failure we log
/// to PostHog and clear the key so we don't loop on the same broken session.
async function finalizeCrashedRecording(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(PENDING_RECORDING_KEY);
  } catch (err) {
    console.warn('[VideoGallery] Failed to read pending descriptor:', err);
    return;
  }
  if (!raw) return;

  let descriptor: { pendingDir?: string; startedAt?: string; taskName?: string } = {};
  try {
    descriptor = JSON.parse(raw) || {};
  } catch {
    await AsyncStorage.removeItem(PENDING_RECORDING_KEY).catch(() => {});
    return;
  }
  const { pendingDir, startedAt, taskName } = descriptor;
  if (!pendingDir) {
    await AsyncStorage.removeItem(PENDING_RECORDING_KEY).catch(() => {});
    return;
  }

  // Approximate session duration from wall-clock: now - startedAt. The native
  // finalizer only uses this to render the intro overlay's duration text, so a
  // rough value is acceptable — better than losing the whole recording.
  const durationSeconds = startedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    : 0;

  console.log('[VideoGallery] Recovering pending recording:', pendingDir);
  posthog.capture('timelapse_recovery_attempt', { durationSeconds });

  try {
    const recoveredPath = await Timelapse.finalizePendingRecording(
      pendingDir,
      durationSeconds,
      taskName ?? ''
    );
    console.log('[VideoGallery] Recovered pending recording to:', recoveredPath);
    posthog.capture('timelapse_recovery_success', { path: recoveredPath, durationSeconds });
  } catch (err: any) {
    const code = err?.code ?? 'UNKNOWN';
    console.warn('[VideoGallery] Failed to recover pending recording:', err);
    posthog.capture('timelapse_recovery_failed', { error: code });
  }

  await AsyncStorage.removeItem(PENDING_RECORDING_KEY).catch(() => {});
}

async function cleanOrphanedRecordings(state: VideoGalleryState) {
  const recordings = state.recordings;
  if (recordings.length === 0) return;

  const validRecordings: Recording[] = [];
  const orphanedIds: string[] = [];

  for (const rec of recordings) {
    // Photos render from cardUri; timelapses play videoUri. Pick the right one
    // to probe — if the file the grid actually shows is missing, the entry is
    // dead.
    const probePath =
      rec.type === 'photo'
        ? rec.cardUri
        : rec.videoUri;
    if (!probePath) {
      orphanedIds.push(rec.id);
      continue;
    }
    const exists = await fileExists(resolveUri(probePath));
    if (exists) {
      validRecordings.push(rec);
    } else {
      orphanedIds.push(rec.id);
    }
  }

  if (orphanedIds.length > 0) {
    console.log('[VideoGallery] Cleaned up', orphanedIds.length, 'orphaned recordings:', orphanedIds);
    useVideoGalleryStore.setState({ recordings: validRecordings });
  }
}

async function regenerateMissingThumbnails(state: VideoGalleryState) {
  const recordings = state.recordings;
  // Fast path: if every recording already has a thumbnailUri, skip the
  // filesystem probing entirely. This is the common case on launch.
  if (recordings.length === 0 || recordings.every((r) => !!r.thumbnailUri)) return;
  let updated = false;

  const updatedRecordings = await Promise.all(
    recordings.map(async (rec) => {
      // Photos use the card image as their own thumbnail — no video to seek.
      // Self-heal a missing thumbnailUri by pointing it at cardUri.
      if (rec.type === 'photo') {
        if (!rec.thumbnailUri && rec.cardUri) {
          updated = true;
          return { ...rec, thumbnailUri: rec.cardUri };
        }
        return rec;
      }

      if (!rec.videoUri) return rec;
      const videoExists = await fileExists(resolveUri(rec.videoUri));
      if (!videoExists) return rec;

      const thumbOk =
        rec.thumbnailUri && (await fileExists(resolveUri(rec.thumbnailUri)));
      if (thumbOk) return rec;

      // Re-generate thumbnail
      try {
        const thumb = await VideoThumbnails.getThumbnailAsync(
          resolveUri(rec.videoUri),
          { time: 0 }
        );
        const thumbsDir = FileSystem.documentDirectory + 'thumbnails/';
        await FileSystem.makeDirectoryAsync(thumbsDir, { intermediates: true });
        const thumbFilename = rec.id + '.jpg';
        await FileSystem.copyAsync({
          from: thumb.uri,
          to: thumbsDir + thumbFilename,
        });
        updated = true;
        return { ...rec, thumbnailUri: 'thumbnails/' + thumbFilename };
      } catch {
        return rec;
      }
    })
  );

  if (updated) {
    useVideoGalleryStore.setState({ recordings: updatedRecordings });
  }
}

async function fileExists(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

function extractFilename(videoUri: string): string {
  const parts = videoUri.split('/');
  return parts[parts.length - 1];
}

async function readSessionsFromStorage(): Promise<LocalSession[]> {
  try {
    const raw = await AsyncStorage.getItem('lockin-sessions-local');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed?.state?.sessions || [];
  } catch (err) {
    console.warn('[VideoGallery] Failed to read session store:', err);
    return [];
  }
}

function matchSessionForFile(
  sessions: LocalSession[],
  fileTimestampMs: number
): LocalSession | null {
  if (!fileTimestampMs) return null;
  const windowMs = 5 * 60 * 1000;
  let best: LocalSession | null = null;
  let bestDelta = Infinity;
  for (const s of sessions) {
    const anchor = s.time_ended || s.created_at;
    if (!anchor) continue;
    const delta = Math.abs(new Date(anchor).getTime() - fileTimestampMs);
    if (delta < bestDelta && delta <= windowMs) {
      bestDelta = delta;
      best = s;
    }
  }
  return best;
}

async function rescueCacheFiles(docsDir: string): Promise<void> {
  const cachesDir = (FileSystem.cacheDirectory || '') + 'timelapses/';
  if (!cachesDir.startsWith('file://') && !cachesDir.startsWith('/')) return;

  const cacheInfo = await FileSystem.getInfoAsync(cachesDir);
  if (!cacheInfo.exists) return;

  const files = await FileSystem.readDirectoryAsync(cachesDir);
  if (files.length === 0) return;

  await FileSystem.makeDirectoryAsync(docsDir, { intermediates: true });

  for (const file of files) {
    if (!file.endsWith('.mp4')) continue;
    const src = cachesDir + file;
    const dst = docsDir + file;
    try {
      const dstInfo = await FileSystem.getInfoAsync(dst);
      if (dstInfo.exists) continue;
      await FileSystem.moveAsync({ from: src, to: dst });
      console.log('[VideoGallery] Rescued cache file:', file);
    } catch (err) {
      console.warn('[VideoGallery] Failed to rescue cache file', file, err);
    }
  }
}

async function scanOrphanedFiles(state: VideoGalleryState) {
  const docsDir = (FileSystem.documentDirectory || '') + 'timelapses/';
  if (!docsDir.startsWith('file://') && !docsDir.startsWith('/')) return;

  try {
    await rescueCacheFiles(docsDir);
  } catch (err) {
    console.warn('[VideoGallery] Cache rescue failed:', err);
  }

  const docsInfo = await FileSystem.getInfoAsync(docsDir);
  if (!docsInfo.exists) return;

  const filesOnDisk = await FileSystem.readDirectoryAsync(docsDir);
  if (filesOnDisk.length === 0) return;

  const knownFilenames = new Set(
    state.recordings
      .filter((r) => !!r.videoUri)
      .map((r) => extractFilename(r.videoUri as string))
  );
  const orphans = filesOnDisk.filter(
    (f) => f.endsWith('.mp4') && !knownFilenames.has(f)
  );
  if (orphans.length === 0) return;

  const sessions = await readSessionsFromStorage();
  const existingIds = new Set(state.recordings.map((r) => r.id));
  const thumbsDir = (FileSystem.documentDirectory || '') + 'thumbnails/';
  const recovered: Recording[] = [];

  for (const filename of orphans) {
    const videoAbs = docsDir + filename;

    // Validate: the file must exist with non-zero size. A zero-byte .mp4 is
    // what we see when a crash killed AVAssetWriter mid-finishWriting — the
    // moov atom is missing and the file is unplayable. Skip and delete.
    let size = 0;
    try {
      const info = await FileSystem.getInfoAsync(videoAbs, { size: true } as any);
      if (!info.exists) continue;
      size = Number((info as any).size ?? 0);
    } catch {
      continue;
    }
    if (size <= 0) {
      console.warn('[VideoGallery] Skipping zero-byte orphan:', filename);
      posthog.capture('orphan_skipped', { reason: 'zero_size', filename });
      try { await FileSystem.deleteAsync(videoAbs, { idempotent: true }); } catch {}
      continue;
    }

    const tsMatch = filename.match(/^timelapse_(\d+)\.mp4$/);
    const fileTsSec = tsMatch ? parseInt(tsMatch[1], 10) : 0;
    const fileMs = fileTsSec * 1000;

    const matched = matchSessionForFile(sessions, fileMs);
    const id =
      matched?.session_id && !existingIds.has(matched.session_id)
        ? matched.session_id
        : uuidv4();
    existingIds.add(id);

    const duration = matched?.total_locked_in_seconds ?? 0;
    const createdAt =
      matched?.time_ended ||
      matched?.created_at ||
      (fileMs ? new Date(fileMs).toISOString() : new Date().toISOString());

    // Thumbnail doubles as a playability canary: if it fails, the file has no
    // moov atom or is otherwise broken. We still keep the .mp4 in the gallery
    // (the user may still be able to play it), but we log it.
    let thumbnailRelPath: string | null = null;
    try {
      const thumb = await VideoThumbnails.getThumbnailAsync(videoAbs, { time: 0 });
      await FileSystem.makeDirectoryAsync(thumbsDir, { intermediates: true });
      const thumbFilename = id + '.jpg';
      await FileSystem.copyAsync({
        from: thumb.uri,
        to: thumbsDir + thumbFilename,
      });
      thumbnailRelPath = 'thumbnails/' + thumbFilename;
    } catch (err: any) {
      console.warn('[VideoGallery] Thumbnail canary failed for orphan:', filename, err);
      posthog.capture('orphan_thumbnail_failed', {
        filename,
        size,
        error: err?.message ?? String(err),
      });
    }

    recovered.push({
      id,
      type: 'timelapse',
      videoUri: 'timelapses/' + filename,
      thumbnailUri: thumbnailRelPath,
      sessionDurationSeconds: duration,
      createdAt,
    });
  }

  if (recovered.length === 0) return;

  console.log('[VideoGallery] Recovered', recovered.length, 'orphaned recording(s)');
  useVideoGalleryStore.setState((current) => {
    const recoveredIds = new Set(recovered.map((r) => r.id));
    const existing = current.recordings.filter((r) => !recoveredIds.has(r.id));
    const merged = [...recovered, ...existing].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    return { recordings: merged };
  });
}

/// Scans Documents/photos/ for raw JPEGs that have no matching gallery entry.
/// Photo entries are only recoverable when both the raw photo and the rendered
/// card are still on disk — without the card we can't render the grid tile, and
/// without the raw we can't re-render the card. Pairs that pass both checks are
/// matched against the local session log (5-minute window on file mtime) so
/// recovered entries inherit their original duration when possible.
async function scanOrphanedPhotos(state: VideoGalleryState) {
  const photosDir = (FileSystem.documentDirectory || '') + 'photos/';
  const cardsDir = (FileSystem.documentDirectory || '') + 'photo-cards/';
  if (!photosDir.startsWith('file://') && !photosDir.startsWith('/')) return;

  const photosInfo = await FileSystem.getInfoAsync(photosDir);
  if (!photosInfo.exists) return;

  const filesOnDisk = await FileSystem.readDirectoryAsync(photosDir);
  if (filesOnDisk.length === 0) return;

  const knownPhotoFiles = new Set(
    state.recordings
      .filter((r) => r.type === 'photo' && !!r.photoUri)
      .map((r) => extractFilename(r.photoUri as string))
  );
  const orphans = filesOnDisk.filter(
    (f) => f.endsWith('.jpg') && !knownPhotoFiles.has(f)
  );
  if (orphans.length === 0) return;

  const sessions = await readSessionsFromStorage();
  const existingIds = new Set(state.recordings.map((r) => r.id));
  const recovered: Recording[] = [];

  for (const filename of orphans) {
    const photoAbs = photosDir + filename;
    const cardAbs = cardsDir + filename;

    // Must have both files. Without the card we can't display anything in the
    // grid; without the raw we can't ever re-render. Skip the orphan.
    let photoSize = 0;
    try {
      const info = await FileSystem.getInfoAsync(photoAbs, { size: true } as any);
      if (!info.exists) continue;
      photoSize = Number((info as any).size ?? 0);
    } catch {
      continue;
    }
    if (photoSize <= 0) {
      try { await FileSystem.deleteAsync(photoAbs, { idempotent: true }); } catch {}
      continue;
    }
    const cardInfo = await FileSystem.getInfoAsync(cardAbs);
    if (!cardInfo.exists) {
      posthog.capture('orphan_photo_missing_card', { filename });
      continue;
    }

    // Filename is the session id (uuid + .jpg). Use it as the recording id when
    // it's still unique; otherwise fall back to a fresh uuid.
    const idGuess = filename.replace(/\.jpg$/, '');
    const id = existingIds.has(idGuess) ? uuidv4() : idGuess;
    existingIds.add(id);

    let fileMs = 0;
    try {
      const info = await FileSystem.getInfoAsync(photoAbs);
      const mtime = (info as any).modificationTime;
      if (typeof mtime === 'number') fileMs = mtime * 1000;
    } catch {}

    const matched = matchSessionForFile(sessions, fileMs);
    const duration = matched?.total_locked_in_seconds ?? 0;
    const createdAt =
      matched?.time_ended ||
      matched?.created_at ||
      (fileMs ? new Date(fileMs).toISOString() : new Date().toISOString());

    recovered.push({
      id,
      type: 'photo',
      photoUri: 'photos/' + filename,
      cardUri: 'photo-cards/' + filename,
      thumbnailUri: 'photo-cards/' + filename,
      sessionDurationSeconds: duration,
      createdAt,
    });
  }

  if (recovered.length === 0) return;

  console.log('[VideoGallery] Recovered', recovered.length, 'orphaned photo card(s)');
  useVideoGalleryStore.setState((current) => {
    const recoveredIds = new Set(recovered.map((r) => r.id));
    const existing = current.recordings.filter((r) => !recoveredIds.has(r.id));
    const merged = [...recovered, ...existing].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    return { recordings: merged };
  });
}
