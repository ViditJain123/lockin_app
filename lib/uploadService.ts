import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export interface UploadProgress {
  stage: 'thumbnail' | 'video' | 'complete' | 'error';
  progress: number;
  error?: string;
}

export interface UploadResult {
  videoUrl: string;
  thumbnailUrl: string;
  videoPath: string;
  thumbnailPath: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function generateUUID(): string {
  return 'xxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('500') ||
      message.includes('503') ||
      message.includes('fetch')
    );
  }
  return false;
}

async function uploadWithRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      await delay(RETRY_DELAY_MS * (MAX_RETRIES - retries + 1));
      return uploadWithRetry(operation, retries - 1);
    }
    throw error;
  }
}

export async function generateThumbnail(
  videoUri: string,
  timeMs?: number
): Promise<string> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: timeMs ?? 1000,
      quality: 0.8,
    });
    return uri;
  } catch (error) {
    console.error('[UploadService] Thumbnail generation failed:', error);
    throw error;
  }
}

export async function uploadTimelapse(
  videoUri: string,
  userId: string,
  durationMs: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const timestamp = Date.now();
  const uuid = generateUUID();

  // 1. Generate thumbnail from middle of video
  onProgress?.({ stage: 'thumbnail', progress: 0 });

  const middleTimeMs = Math.floor(durationMs / 2);
  let thumbnailUri: string;

  try {
    thumbnailUri = await generateThumbnail(videoUri, middleTimeMs);
    onProgress?.({ stage: 'thumbnail', progress: 100 });
  } catch (error) {
    // Thumbnail is non-critical, try with default time
    console.warn('[UploadService] Using fallback thumbnail time');
    try {
      thumbnailUri = await generateThumbnail(videoUri, 1000);
      onProgress?.({ stage: 'thumbnail', progress: 100 });
    } catch (fallbackError) {
      // If thumbnail completely fails, continue without it
      console.error('[UploadService] Thumbnail generation failed completely');
      thumbnailUri = '';
    }
  }

  // 2. Upload video
  onProgress?.({ stage: 'video', progress: 10 });

  const videoPath = `${userId}/${timestamp}_${uuid}.mp4`;

  const videoFile = await readAsStringAsync(videoUri, {
    encoding: EncodingType.Base64,
  });

  onProgress?.({ stage: 'video', progress: 30 });

  const { error: videoError } = await uploadWithRetry(async () => {
    return supabase.storage.from('grinds').upload(videoPath, decode(videoFile), {
      contentType: 'video/mp4',
      upsert: false,
    });
  });

  if (videoError) {
    onProgress?.({ stage: 'error', progress: 0, error: videoError.message });
    throw new Error(`Video upload failed: ${videoError.message}`);
  }

  onProgress?.({ stage: 'video', progress: 80 });

  // 3. Upload thumbnail (if available)
  let thumbnailPath = '';
  if (thumbnailUri) {
    thumbnailPath = `${userId}/${timestamp}_${uuid}.jpg`;

    try {
      const thumbnailFile = await readAsStringAsync(thumbnailUri, {
        encoding: EncodingType.Base64,
      });

      const { error: thumbError } = await uploadWithRetry(async () => {
        return supabase.storage
          .from('grinds_thumbnail')
          .upload(thumbnailPath, decode(thumbnailFile), {
            contentType: 'image/jpeg',
            upsert: false,
          });
      });

      if (thumbError) {
        console.warn('[UploadService] Thumbnail upload failed:', thumbError.message);
        thumbnailPath = '';
      }
    } catch (error) {
      console.warn('[UploadService] Thumbnail upload error:', error);
      thumbnailPath = '';
    }
  }

  onProgress?.({ stage: 'video', progress: 100 });

  // 4. Get public URLs
  const { data: videoUrlData } = supabase.storage
    .from('grinds')
    .getPublicUrl(videoPath);

  let thumbnailUrl = '';
  if (thumbnailPath) {
    const { data: thumbUrlData } = supabase.storage
      .from('grinds_thumbnail')
      .getPublicUrl(thumbnailPath);
    thumbnailUrl = thumbUrlData.publicUrl;
  }

  onProgress?.({ stage: 'complete', progress: 100 });

  return {
    videoUrl: videoUrlData.publicUrl,
    thumbnailUrl,
    videoPath,
    thumbnailPath,
  };
}
