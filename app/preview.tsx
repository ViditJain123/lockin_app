import GlassIconButton from '@/components/GlassIconButton';
import { saveToGallery, shareVideo } from '@/lib/mediaUtils';
import { recordWatchTime } from '@/lib/statsService';
import { useProfileStore } from '@/store/useProfileStore';
import { useVideoStore } from '@/store/useVideoStore';
import { Ionicons } from '@expo/vector-icons';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/Fonts';
import { useAuth } from '@/contexts/AuthContext';

export default function PreviewScreen() {
  const { videoUri, grindDurationSeconds, isFromGallery, videoId } = useLocalSearchParams<{
    videoUri: string;
    grindDurationSeconds: string;
    isFromGallery?: string;
    videoId?: string;
  }>();

  // Check if opened from gallery (already saved video)
  const fromGallery = isFromGallery === 'true';

  // Parse grind duration
  const grindDuration = grindDurationSeconds ? parseInt(grindDurationSeconds, 10) : 0;
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  // Video store
  const addVideo = useVideoStore((s) => s.addVideo);
  const markSavedToGallery = useVideoStore((s) => s.markSavedToGallery);

  // Profile store for optimistic updates
  const incrementHoursLocally = useProfileStore((s) => s.incrementHoursLocally);
  const addActivityLocally = useProfileStore((s) => s.addActivityLocally);
  
  // Auth context for user ID
  const { user } = useAuth();

  // Local state
  const [isSaved, setIsSaved] = useState(fromGallery);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToGallery, setSavedToGallery] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(videoId || null);
  
  // Watch time tracking state
  const [isPlaying, setIsPlaying] = useState(false);
  const playStartTimeRef = useRef<number | null>(null); // When playback started
  const totalWatchedRef = useRef<number>(0); // Cumulative watched seconds this session

  // Ensure video plays on mount
  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        await videoRef.current.playAsync();
      }
    };
    playVideo();
  }, [videoUri]);

  // Auto-save to private storage on mount (only for new recordings)
  useEffect(() => {
    if (videoUri && !fromGallery && !isSaved && !isSaving) {
      handleAutoSaveToPrivate();
    }
  }, [videoUri, fromGallery]);

  const handleAutoSaveToPrivate = async () => {
    if (!videoUri) return;

    // Validate user is authenticated
    if (!user?.id) {
      console.error('[Preview] Cannot save: user not authenticated');
      Alert.alert('Error', 'Please sign in to save videos');
      return;
    }

    setIsSaving(true);
    try {
      console.log('[Preview] Saving video with userId:', user.id, 'duration:', grindDuration);
      const video = await addVideo(videoUri, grindDuration, user.id);
      setCurrentVideoId(video.id);
      setIsSaved(true);
      console.log('[Preview] Saved to private storage:', video.id);

      // Optimistic update for heatmap (convert seconds to minutes)
      const minutes = grindDuration / 60;
      addActivityLocally(minutes);
      console.log('[Preview] Added activity locally:', minutes, 'minutes');
    } catch (error) {
      console.error('[Preview] Failed to save to private storage:', error);
      Alert.alert('Error', 'Failed to save video. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle watch time recording when video pauses
  const handleRecordWatchTime = useCallback(async () => {
    if (!user?.id || !playStartTimeRef.current) return;
    
    const now = Date.now();
    const sessionWatchedMs = now - playStartTimeRef.current;
    const sessionWatchedSeconds = Math.floor(sessionWatchedMs / 1000);
    
    if (sessionWatchedSeconds <= 0) return;
    
    totalWatchedRef.current += sessionWatchedSeconds;
    playStartTimeRef.current = null;
    
    console.log(`[Preview] Recording ${sessionWatchedSeconds}s of watch time`);
    
    // Optimistic update
    incrementHoursLocally(sessionWatchedSeconds / 3600);
    
    // API call in background
    const result = await recordWatchTime(user.id, sessionWatchedSeconds);
    if (!result.success) {
      console.error('[Preview] Failed to record watch time');
      // Rollback optimistic update
      incrementHoursLocally(-sessionWatchedSeconds / 3600);
    }
  }, [user?.id, incrementHoursLocally]);

  // Handle playback status updates
  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    const wasPlaying = isPlaying;
    const nowPlaying = status.isPlaying;
    
    // Detect play -> pause transition (user paused)
    if (wasPlaying && !nowPlaying && !status.didJustFinish) {
      handleRecordWatchTime();
    }
    
    // Detect pause -> play transition (started playing)
    if (!wasPlaying && nowPlaying) {
      playStartTimeRef.current = Date.now();
    }
    
    setIsPlaying(nowPlaying);
    
    // Handle video looping
    if (status.didJustFinish && !status.isLooping) {
      videoRef.current?.replayAsync();
    }
  }, [isPlaying, handleRecordWatchTime]);

  const handleShare = async () => {
    if (videoUri) {
      const success = await shareVideo(videoUri);
      if (!success) {
        Alert.alert('Share Unavailable', 'Sharing is not available on this device');
      }
    }
  };

  const handleSaveToGallery = async () => {
    if (!videoUri) return;
    
    if (savedToGallery) {
      Alert.alert('Already Saved', 'This video is already in your photo library');
      return;
    }

    setIsSaving(true);
    try {
      await saveToGallery(videoUri);
      setSavedToGallery(true);
      
      // Update store if we have a video ID
      if (currentVideoId) {
        await markSavedToGallery(currentVideoId);
      }
      
      Alert.alert('Saved', 'Video saved to your photo library');
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        Alert.alert('Permission Required', 'Please allow access to your photo library in Settings');
      } else {
        Alert.alert('Error', 'Failed to save video');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const getStatusText = () => {
    if (isSaving) {
      return { icon: null, text: 'Saving...', color: 'white' };
    }
    if (isSaved) {
      return { icon: 'checkmark-circle', text: 'Saved', color: '#4CAF50' };
    }
    return null;
  };

  const status = getStatusText();

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping={true}
        shouldPlay={true}
        isMuted={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        {/* Close Button */}
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {/* Status indicator */}
        {status && (
          <View style={styles.statusContainer}>
            {status.icon && (
              <Ionicons name={status.icon as any} size={18} color={status.color} />
            )}
            <Text style={styles.statusText}>{status.text}</Text>
          </View>
        )}

        {/* Spacer to balance the close button */}
        <View style={{ width: 40 }} />
      </View>

      {/* Bottom Controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.buttonContainer}>
          <GlassIconButton
            icon="share-outline"
            size={56}
            iconSize={26}
            onPress={handleShare}
          />
          <Text style={styles.buttonLabel}>Share</Text>
        </View>

        <View style={styles.buttonContainer}>
          <GlassIconButton
            icon={savedToGallery ? "checkmark-circle" : "download-outline"}
            size={56}
            iconSize={26}
            onPress={handleSaveToGallery}
            disabled={isSaving || savedToGallery}
          />
          <Text style={styles.buttonLabel}>
            {savedToGallery ? 'In Gallery' : 'Save to Gallery'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 8,
  },
  buttonLabel: {
    color: 'white',
    fontSize: 12,
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
});
