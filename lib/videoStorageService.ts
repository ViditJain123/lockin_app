/**
 * Video Storage Service
 * 
 * Manages app-private video storage using expo-file-system.
 * Videos are stored in documentDirectory/videos/ which is:
 * - Private (not visible in Photos/Files app)
 * - Backed up to iCloud
 * - Persists across app updates
 */

import {
    copyAsync,
    deleteAsync,
    documentDirectory,
    getInfoAsync,
    makeDirectoryAsync,
    readAsStringAsync,
    writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';

// Storage paths
const VIDEOS_DIR = `${documentDirectory}videos/`;
const THUMBNAILS_DIR = `${documentDirectory}thumbnails/`;
const INDEX_FILE = `${documentDirectory}videos/index.json`;

export interface LocalVideo {
  id: string;
  videoPath: string;
  thumbnailPath: string;
  durationSeconds: number;
  createdAt: string;
  savedToGallery: boolean;
}

interface VideoIndex {
  videos: LocalVideo[];
  version: number;
}

/**
 * Ensure storage directories exist
 */
async function ensureDirectories(): Promise<void> {
  const videosInfo = await getInfoAsync(VIDEOS_DIR);
  if (!videosInfo.exists) {
    await makeDirectoryAsync(VIDEOS_DIR, { intermediates: true });
  }

  const thumbnailsInfo = await getInfoAsync(THUMBNAILS_DIR);
  if (!thumbnailsInfo.exists) {
    await makeDirectoryAsync(THUMBNAILS_DIR, { intermediates: true });
  }
}

/**
 * Generate a unique ID for a video
 */
function generateVideoId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}`;
}

/**
 * Read the video index from disk
 */
async function readIndex(): Promise<VideoIndex> {
  try {
    const indexInfo = await getInfoAsync(INDEX_FILE);
    if (!indexInfo.exists) {
      return { videos: [], version: 1 };
    }

    const content = await readAsStringAsync(INDEX_FILE);
    return JSON.parse(content) as VideoIndex;
  } catch (error) {
    console.error('[VideoStorage] Failed to read index:', error);
    return { videos: [], version: 1 };
  }
}

/**
 * Write the video index to disk
 */
async function writeIndex(index: VideoIndex): Promise<void> {
  await ensureDirectories();
  await writeAsStringAsync(INDEX_FILE, JSON.stringify(index, null, 2));
}

/**
 * Generate thumbnail from video
 */
async function generateThumbnail(videoUri: string, thumbnailPath: string): Promise<string> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 1000, // 1 second into the video
      quality: 0.8,
    });

    // Copy thumbnail to our storage
    await copyAsync({
      from: uri,
      to: thumbnailPath,
    });

    return thumbnailPath;
  } catch (error) {
    console.error('[VideoStorage] Thumbnail generation failed:', error);
    throw error;
  }
}

/**
 * Save a video to private storage
 */
export async function saveVideoToPrivateStorage(
  sourceUri: string,
  durationSeconds: number
): Promise<LocalVideo> {
  await ensureDirectories();

  const id = generateVideoId();
  const videoPath = `${VIDEOS_DIR}${id}.mp4`;
  const thumbnailPath = `${THUMBNAILS_DIR}${id}.jpg`;

  // Copy video to private storage
  await copyAsync({
    from: sourceUri,
    to: videoPath,
  });

  // Generate thumbnail
  await generateThumbnail(videoPath, thumbnailPath);

  const video: LocalVideo = {
    id,
    videoPath,
    thumbnailPath,
    durationSeconds,
    createdAt: new Date().toISOString(),
    savedToGallery: false,
  };

  // Add to index
  const index = await readIndex();
  index.videos.unshift(video); // Add to beginning (newest first)
  await writeIndex(index);

  console.log('[VideoStorage] Saved video:', id);
  return video;
}

/**
 * Get all videos from private storage
 */
export async function getAllVideos(): Promise<LocalVideo[]> {
  const index = await readIndex();
  
  // Filter out videos whose files no longer exist
  const validVideos: LocalVideo[] = [];
  for (const video of index.videos) {
    const videoInfo = await getInfoAsync(video.videoPath);
    if (videoInfo.exists) {
      validVideos.push(video);
    }
  }

  // Update index if we removed any invalid entries
  if (validVideos.length !== index.videos.length) {
    await writeIndex({ ...index, videos: validVideos });
  }

  return validVideos;
}

/**
 * Get a single video by ID
 */
export async function getVideoById(id: string): Promise<LocalVideo | null> {
  const index = await readIndex();
  return index.videos.find((v) => v.id === id) || null;
}

/**
 * Mark a video as saved to gallery
 */
export async function markVideoSavedToGallery(id: string): Promise<void> {
  const index = await readIndex();
  const videoIndex = index.videos.findIndex((v) => v.id === id);
  
  if (videoIndex !== -1) {
    index.videos[videoIndex].savedToGallery = true;
    await writeIndex(index);
  }
}

/**
 * Delete a video from private storage
 */
export async function deleteVideo(id: string): Promise<void> {
  const index = await readIndex();
  const video = index.videos.find((v) => v.id === id);

  if (!video) {
    console.warn('[VideoStorage] Video not found:', id);
    return;
  }

  // Delete files
  try {
    await deleteAsync(video.videoPath, { idempotent: true });
    await deleteAsync(video.thumbnailPath, { idempotent: true });
  } catch (error) {
    console.error('[VideoStorage] Failed to delete files:', error);
  }

  // Remove from index
  index.videos = index.videos.filter((v) => v.id !== id);
  await writeIndex(index);

  console.log('[VideoStorage] Deleted video:', id);
}

/**
 * Get total storage used by videos (in bytes)
 */
export async function getStorageUsed(): Promise<number> {
  const videos = await getAllVideos();
  let totalBytes = 0;

  for (const video of videos) {
    try {
      const videoInfo = await getInfoAsync(video.videoPath);
      const thumbInfo = await getInfoAsync(video.thumbnailPath);
      
      if (videoInfo.exists && 'size' in videoInfo) {
        totalBytes += videoInfo.size || 0;
      }
      if (thumbInfo.exists && 'size' in thumbInfo) {
        totalBytes += thumbInfo.size || 0;
      }
    } catch (error) {
      // Ignore errors for individual files
    }
  }

  return totalBytes;
}
