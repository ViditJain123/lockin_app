import { uploadTimelapse, UploadProgress, UploadResult } from '@/lib/uploadService';
import { create } from 'zustand';

export type UploadStage = 'idle' | 'thumbnail' | 'video' | 'complete' | 'error';

interface UploadState {
  // Upload status
  isUploading: boolean;
  uploadProgress: number;
  uploadStage: UploadStage;
  uploadError: string | null;

  // Pending video (before upload completes)
  pendingVideoUri: string | null;
  pendingGrindDurationSeconds: number;

  // Completed upload
  uploadResult: UploadResult | null;

  // Actions
  startUpload: (videoUri: string, userId: string, grindDurationSeconds: number) => Promise<UploadResult | null>;
  clearUploadState: () => void;
  setPendingVideo: (uri: string, grindDurationSeconds: number) => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  // Initial state
  isUploading: false,
  uploadProgress: 0,
  uploadStage: 'idle',
  uploadError: null,
  pendingVideoUri: null,
  pendingGrindDurationSeconds: 0,
  uploadResult: null,

  // Start upload
  startUpload: async (videoUri: string, userId: string, grindDurationSeconds: number) => {
    const state = get();

    // Prevent duplicate uploads
    if (state.isUploading) {
      console.warn('[UploadStore] Upload already in progress');
      return null;
    }

    set({
      isUploading: true,
      uploadProgress: 0,
      uploadStage: 'thumbnail',
      uploadError: null,
      pendingVideoUri: videoUri,
      pendingGrindDurationSeconds: grindDurationSeconds,
      uploadResult: null,
    });

    const handleProgress = (progress: UploadProgress) => {
      set({
        uploadStage: progress.stage,
        uploadProgress: progress.progress,
        uploadError: progress.error || null,
      });
    };

    try {
      const result = await uploadTimelapse(videoUri, userId, grindDurationSeconds, handleProgress);

      set({
        isUploading: false,
        uploadStage: 'complete',
        uploadProgress: 100,
        uploadResult: result,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      set({
        isUploading: false,
        uploadStage: 'error',
        uploadError: errorMessage,
      });
      return null;
    }
  },

  // Clear upload state (when leaving preview)
  clearUploadState: () => {
    set({
      isUploading: false,
      uploadProgress: 0,
      uploadStage: 'idle',
      uploadError: null,
      pendingVideoUri: null,
      pendingGrindDurationSeconds: 0,
      uploadResult: null,
    });
  },

  // Set pending video (before navigation)
  setPendingVideo: (uri: string, grindDurationSeconds: number) => {
    set({
      pendingVideoUri: uri,
      pendingGrindDurationSeconds: grindDurationSeconds,
    });
  },
}));

// Selector hooks
export const useIsUploading = () => useUploadStore((s) => s.isUploading);
export const useUploadProgress = () => useUploadStore((s) => s.uploadProgress);
export const useUploadStage = () => useUploadStore((s) => s.uploadStage);
export const useUploadError = () => useUploadStore((s) => s.uploadError);
