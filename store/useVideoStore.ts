/**
 * Video Store
 *
 * Zustand store for managing local video state.
 * Syncs with videoStorageService for persistence.
 * Also records sessions to Supabase (fire-and-forget).
 */

import {
    deleteVideo as deleteVideoFromStorage,
    getAllVideos,
    LocalVideo,
    markVideoSavedToGallery,
    saveVideoToPrivateStorage,
} from '@/lib/videoStorageService';
import { recordSession } from '@/lib/sessionService';
import { updateStatsAfterSave } from '@/lib/statsService';
import { create } from 'zustand';
import { useHeatmapStore } from './useHeatmapStore';
import { useNotificationStore } from './useNotificationStore';
import { useEarnedTimeStore } from './useEarnedTimeStore';
import { useOnboardingStore } from './useOnboardingStore';
import { unblockApps, unblockAppsUnlimited, isBlockingAvailable } from '@/lib/blockingService';

// Minimum video duration to save (1 minute)
const MIN_VIDEO_DURATION_SECONDS = 60;

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

  // Add a new video to local storage and sync to Supabase
  addVideo: async (sourceUri: string, durationSeconds: number, userId?: string) => {
    // Don't save videos under 1 minute
    if (durationSeconds < MIN_VIDEO_DURATION_SECONDS) {
      console.log('[VideoStore] Video too short, not saving:', durationSeconds, 'seconds');
      throw new Error('VIDEO_TOO_SHORT');
    }

    try {
      const video = await saveVideoToPrivateStorage(sourceUri, durationSeconds);

      // Add to state (at beginning for newest first)
      set((state) => ({
        videos: [video, ...state.videos],
      }));

      // Update local heatmap with minutes (using local timezone)
      const minutes = durationSeconds / 60;
      useHeatmapStore.getState().addMinutes(minutes);
      console.log('[VideoStore] Added', minutes, 'minutes to heatmap');

      // Mark that user has recorded (enables re-engagement notifications)
      useNotificationStore.getState().setHasEverRecorded();

      // Add earned screen time + track grind toward daily target
      const { familyActivitySelection, targetHours } = useOnboardingStore.getState().quizAnswers;
      const earnedTimeStore = useEarnedTimeStore.getState();

      // Normal flow: earn screen time at 4:1
      const earnedSeconds = earnedTimeStore.addEarnedTime(durationSeconds);
      earnedTimeStore.addGrindSeconds(durationSeconds);
      console.log('[VideoStore] Earned', earnedSeconds, 'seconds of screen time');

      // Check if daily target reached → full unlock
      if (isBlockingAvailable() && familyActivitySelection) {
        if (earnedTimeStore.hasReachedDailyTarget(targetHours)) {
          unblockAppsUnlimited(familyActivitySelection);
          console.log('[VideoStore] Daily target reached! Apps fully unlocked');
        } else {
          const remainingMinutes = earnedTimeStore.getRemainingTimeMinutes();
          if (remainingMinutes > 0) {
            unblockApps(familyActivitySelection, remainingMinutes);
            earnedTimeStore.setMonitoringStartedAt(Date.now());
            console.log('[VideoStore] Unblocked apps with', remainingMinutes, 'minutes remaining');
          }
        }
      }

      // Fire-and-forget: record session to Supabase + update local grinds cache
      if (userId) {
        recordSession(userId, durationSeconds * 1000).catch((e) =>
          console.warn('[VideoStore] recordSession failed:', e)
        );
        updateStatsAfterSave(userId, durationSeconds).catch((e) =>
          console.warn('[VideoStore] updateStatsAfterSave failed:', e)
        );
      }

      // Update local grinds cache immediately (so analytics update without waiting for sync)
      const { useGrindsStore } = require('./useGrindsStore');
      useGrindsStore.getState().addGrindLocally({
        id: video.id,
        createdAt: video.createdAt,
        durationSeconds,
      });

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
