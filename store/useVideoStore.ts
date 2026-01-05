/**
 * Video Store
 * 
 * Zustand store for managing local video state.
 * Syncs with videoStorageService for persistence.
 */

import { recordSession } from '@/lib/sessionService';
import {
    deleteVideo as deleteVideoFromStorage,
    getAllVideos,
    LocalVideo,
    markVideoSavedToGallery,
    saveVideoToPrivateStorage,
} from '@/lib/videoStorageService';
import { create } from 'zustand';

interface VideoState {
  // State
  videos: LocalVideo[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  loadVideos: () => Promise<void>;
  addVideo: (sourceUri: string, durationSeconds: number, userId?: string) => Promise<LocalVideo>;
  markSavedToGallery: (id: string) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  refreshVideos: () => Promise<void>;
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  isLoading: false,
  isInitialized: false,

  // Load all videos from storage
  loadVideos: async () => {
    if (get().isLoading) return;

    set({ isLoading: true });

    try {
      const videos = await getAllVideos();
      set({ videos, isInitialized: true });
    } catch (error) {
      console.error('[VideoStore] Failed to load videos:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Add a new video to storage and record session to Supabase
  addVideo: async (sourceUri: string, durationSeconds: number, userId?: string) => {
    try {
      const video = await saveVideoToPrivateStorage(sourceUri, durationSeconds);
      
      // Add to state (at beginning for newest first)
      set((state) => ({
        videos: [video, ...state.videos],
      }));

      // Record session to Supabase for heatmap tracking (fire and forget)
      if (userId && durationSeconds > 0) {
        recordSession(userId, durationSeconds * 1000).catch((err) => {
          console.error('[VideoStore] Failed to record session:', err);
        });
      }

      return video;
    } catch (error) {
      console.error('[VideoStore] Failed to add video:', error);
      throw error;
    }
  },

  // Mark a video as saved to gallery
  markSavedToGallery: async (id: string) => {
    await markVideoSavedToGallery(id);

    set((state) => ({
      videos: state.videos.map((v) =>
        v.id === id ? { ...v, savedToGallery: true } : v
      ),
    }));
  },

  // Delete a video
  deleteVideo: async (id: string) => {
    await deleteVideoFromStorage(id);

    set((state) => ({
      videos: state.videos.filter((v) => v.id !== id),
    }));
  },

  // Refresh videos from storage
  refreshVideos: async () => {
    const videos = await getAllVideos();
    set({ videos });
  },
}));

// Selector hooks
export const useVideos = () => useVideoStore((s) => s.videos);
export const useIsLoadingVideos = () => useVideoStore((s) => s.isLoading);
export const useIsVideosInitialized = () => useVideoStore((s) => s.isInitialized);
