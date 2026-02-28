/**
 * Video Storage Service
 * 
 * Manages app-private video storage using expo-file-system.
 * Videos are stored in documentDirectory/videos/ which is:
 * - Private (not visible in Photos/Files app)
 * - Backed up to iCloud
 * - Persists across app updates
 * 
 * IMPORTANT: Paths are stored as RELATIVE paths (e.g., "videos/123.mp4")
 * to survive app updates where the documentDirectory UUID changes.
 */

import * as Crypto from 'expo-crypto';
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

// Relative paths for storage (relative to documentDirectory)
const VIDEOS_RELATIVE_DIR = 'videos/';
const THUMBNAILS_RELATIVE_DIR = 'thumbnails/';
const INDEX_RELATIVE_PATH = 'videos/index.json';

// Absolute paths for file operations (computed at runtime)
const getVideosDir = () => `${documentDirectory}${VIDEOS_RELATIVE_DIR}`;
const getThumbnailsDir = () => `${documentDirectory}${THUMBNAILS_RELATIVE_DIR}`;
const getIndexFile = () => `${documentDirectory}${INDEX_RELATIVE_PATH}`;

/**
 * LocalVideo interface - paths returned are ABSOLUTE for direct use
 */
export interface LocalVideo {
  id: string;
  videoPath: string;      // Absolute path for runtime use
  thumbnailPath: string;  // Absolute path for runtime use
  durationSeconds: number;
  createdAt: string;
  savedToGallery: boolean;
}

/**
 * StoredVideo interface - paths stored are RELATIVE for persistence
 */
interface StoredVideo {
  id: string;
  videoPath: string;      // Relative path for storage
  thumbnailPath: string;  // Relative path for storage
  durationSeconds: number;
  createdAt: string;
  savedToGallery: boolean;
}

interface VideoIndex {
  videos: StoredVideo[];
  version: number;
}

// ============================================================================
// Path Conversion Helpers
// ============================================================================

/**
 * Convert a relative path to absolute (for file operations)
 */
function toAbsolutePath(relativePath: string): string {
  return `${documentDirectory}${relativePath}`;
}

/**
 * Convert an absolute path to relative (for storage)
 * Handles paths with or without file:// prefix
 */
function toRelativePath(absolutePath: string): string {
  const docDir = documentDirectory || '';
  if (absolutePath.startsWith(docDir)) {
    return absolutePath.replace(docDir, '');
  }
  // Already relative or unknown format
  return absolutePath;
}

/**
 * Check if a path is absolute (starts with / or file://)
 */
function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || path.startsWith('file://');
}

/**
 * Convert stored video (relative paths) to LocalVideo (absolute paths)
 */
function hydrateVideo(stored: StoredVideo): LocalVideo {
  return {
    ...stored,
    videoPath: isAbsolutePath(stored.videoPath) 
      ? stored.videoPath 
      : toAbsolutePath(stored.videoPath),
    thumbnailPath: isAbsolutePath(stored.thumbnailPath)
      ? stored.thumbnailPath
      : toAbsolutePath(stored.thumbnailPath),
  };
}

// ============================================================================
// Storage Directory Management
// ============================================================================

/**
 * Ensure storage directories exist
 */
async function ensureDirectories(): Promise<void> {
  const videosDir = getVideosDir();
  const thumbnailsDir = getThumbnailsDir();
  
  const videosInfo = await getInfoAsync(videosDir);
  if (!videosInfo.exists) {
    await makeDirectoryAsync(videosDir, { intermediates: true });
  }

  const thumbnailsInfo = await getInfoAsync(thumbnailsDir);
  if (!thumbnailsInfo.exists) {
    await makeDirectoryAsync(thumbnailsDir, { intermediates: true });
  }
}

/**
 * Generate a unique UUID v4 for a video.
 * UUIDs are used as the canonical grind ID across local storage and Supabase.
 */
function generateVideoId(): string {
  return Crypto.randomUUID();
}

// ============================================================================
// Index File Management
// ============================================================================

/**
 * Read the video index from disk
 * Includes migration logic for absolute paths from older versions
 */
async function readIndex(): Promise<VideoIndex> {
  try {
    const indexFile = getIndexFile();
    const indexInfo = await getInfoAsync(indexFile);
    if (!indexInfo.exists) {
      return { videos: [], version: 1 };
    }

    const content = await readAsStringAsync(indexFile);
    const index = JSON.parse(content) as VideoIndex;
    
    // Migrate any absolute paths to relative paths
    let needsMigration = false;
    const migratedVideos = index.videos.map(video => {
      if (isAbsolutePath(video.videoPath)) {
        needsMigration = true;
        console.log('[VideoStorage] Migrating absolute path to relative:', video.id);
        return {
          ...video,
          videoPath: toRelativePath(video.videoPath),
          thumbnailPath: toRelativePath(video.thumbnailPath),
        };
      }
      return video;
    });
    
    // Persist migration if needed
    if (needsMigration) {
      console.log('[VideoStorage] Saving migrated index with relative paths');
      await writeIndex({ ...index, videos: migratedVideos });
    }
    
    return { ...index, videos: migratedVideos };
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
  await writeAsStringAsync(getIndexFile(), JSON.stringify(index, null, 2));
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
  // Use relative paths for storage persistence across app updates
  const videoRelativePath = `${VIDEOS_RELATIVE_DIR}${id}.mp4`;
  const thumbnailRelativePath = `${THUMBNAILS_RELATIVE_DIR}${id}.jpg`;
  // Use absolute paths for file operations
  const videoAbsolutePath = toAbsolutePath(videoRelativePath);
  const thumbnailAbsolutePath = toAbsolutePath(thumbnailRelativePath);

  // Copy video to private storage
  await copyAsync({
    from: sourceUri,
    to: videoAbsolutePath,
  });

  // Generate thumbnail
  await generateThumbnail(videoAbsolutePath, thumbnailAbsolutePath);

  // Store with relative paths for persistence
  const storedVideo: StoredVideo = {
    id,
    videoPath: videoRelativePath,
    thumbnailPath: thumbnailRelativePath,
    durationSeconds,
    createdAt: new Date().toISOString(),
    savedToGallery: false,
  };

  // Add to index
  const index = await readIndex();
  index.videos.unshift(storedVideo); // Add to beginning (newest first)
  await writeIndex(index);

  console.log('[VideoStorage] Saved video:', id);

  // Return hydrated video with absolute paths for immediate use
  return hydrateVideo(storedVideo);
}

/**
 * Get all videos from private storage
 */
export async function getAllVideos(): Promise<LocalVideo[]> {
  const index = await readIndex();

  // Filter out videos whose files no longer exist
  const validStoredVideos: StoredVideo[] = [];
  for (const video of index.videos) {
    // Convert to absolute path for file system check
    const absoluteVideoPath = isAbsolutePath(video.videoPath)
      ? video.videoPath
      : toAbsolutePath(video.videoPath);
    const videoInfo = await getInfoAsync(absoluteVideoPath);
    if (videoInfo.exists) {
      validStoredVideos.push(video);
    }
  }

  // Update index if we removed any invalid entries
  if (validStoredVideos.length !== index.videos.length) {
    await writeIndex({ ...index, videos: validStoredVideos });
  }

  // Return hydrated videos with absolute paths
  return validStoredVideos.map(hydrateVideo);
}

/**
 * Get a single video by ID
 */
export async function getVideoById(id: string): Promise<LocalVideo | null> {
  const index = await readIndex();
  const video = index.videos.find((v) => v.id === id);
  return video ? hydrateVideo(video) : null;
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

  // Convert to absolute paths for file operations
  const absoluteVideoPath = isAbsolutePath(video.videoPath)
    ? video.videoPath
    : toAbsolutePath(video.videoPath);
  const absoluteThumbnailPath = isAbsolutePath(video.thumbnailPath)
    ? video.thumbnailPath
    : toAbsolutePath(video.thumbnailPath);

  // Delete files
  try {
    await deleteAsync(absoluteVideoPath, { idempotent: true });
    await deleteAsync(absoluteThumbnailPath, { idempotent: true });
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
