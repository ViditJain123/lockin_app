import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';

export interface Recording {
  id: string;
  videoUri: string;
  thumbnailUri: string | null;
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
      name: 'lockin-video-gallery',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === undefined) {
          // Convert absolute paths to relative paths
          const recordings: Recording[] = (persistedState?.recordings || []).map(
            (rec: Recording) => ({
              ...rec,
              videoUri: toRelativePath(rec.videoUri),
              thumbnailUri: rec.thumbnailUri
                ? toRelativePath(rec.thumbnailUri)
                : null,
            })
          );
          return { ...persistedState, recordings };
        }
        return persistedState as VideoGalleryState;
      },
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return;
          // Re-generate missing thumbnails after hydration
          regenerateMissingThumbnails(state);
        };
      },
    }
  )
);

async function regenerateMissingThumbnails(state: VideoGalleryState) {
  const recordings = state.recordings;
  let updated = false;

  const updatedRecordings = await Promise.all(
    recordings.map(async (rec) => {
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
