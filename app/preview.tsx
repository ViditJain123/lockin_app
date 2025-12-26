import GlassIconButton from '@/components/GlassIconButton';
import { useAuth } from '@/contexts/AuthContext';
import { saveToGallery, shareVideo } from '@/lib/mediaUtils';
import { useUploadStore } from '@/store/useUploadStore';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PreviewScreen() {
  const { videoUri, durationMs } = useLocalSearchParams<{
    videoUri: string;
    durationMs: string;
  }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  // Ensure video plays on mount
  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        await videoRef.current.playAsync();
      }
    };
    playVideo();
  }, [videoUri]);

  const {
    isUploading,
    uploadProgress,
    uploadStage,
    uploadError,
    startUpload,
    clearUploadState,
  } = useUploadStore();

  // Animated progress bar
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(uploadProgress, { duration: 300 });
  }, [uploadProgress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Start upload on mount
  useEffect(() => {
    if (videoUri && user?.id) {
      const duration = durationMs ? parseInt(durationMs, 10) : 1000;
      startUpload(videoUri, user.id, duration);
    }
  }, [videoUri, user?.id, durationMs]);

  // Handle upload error
  useEffect(() => {
    if (uploadStage === 'error' && uploadError) {
      Alert.alert('Upload Failed', uploadError, [
        {
          text: 'Retry',
          onPress: () => {
            if (videoUri && user?.id) {
              const duration = durationMs ? parseInt(durationMs, 10) : 1000;
              startUpload(videoUri, user.id, duration);
            }
          },
        },
        { text: 'Save Locally', onPress: handleSave },
        { text: 'Dismiss', style: 'cancel' },
      ]);
    }
  }, [uploadStage, uploadError]);

  const handleShare = async () => {
    if (videoUri) {
      const success = await shareVideo(videoUri);
      if (!success) {
        Alert.alert('Share Unavailable', 'Sharing is not available on this device');
      }
    }
  };

  const handleSave = async () => {
    if (videoUri) {
      try {
        await saveToGallery(videoUri);
        Alert.alert('Saved', 'Video saved to your photo library');
      } catch (error) {
        if (error instanceof Error && error.message.includes('permission')) {
          Alert.alert('Permission Required', 'Please allow access to your photo library in Settings');
        } else {
          Alert.alert('Error', 'Failed to save video');
        }
      }
    }
  };

  const handleClose = () => {
    if (isUploading) {
      Alert.alert(
        'Upload in Progress',
        'Your video is still uploading to the cloud. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              clearUploadState();
              router.back();
            },
          },
        ]
      );
    } else {
      clearUploadState();
      router.back();
    }
  };

  const getUploadStatusText = () => {
    switch (uploadStage) {
      case 'thumbnail':
        return 'Generating thumbnail...';
      case 'video':
        return `Uploading ${uploadProgress}%`;
      case 'complete':
        return 'Uploaded';
      case 'error':
        return 'Upload failed';
      default:
        return '';
    }
  };

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
        onPlaybackStatusUpdate={(status) => {
          // Ensure looping continues
          if (status.isLoaded && status.didJustFinish && !status.isLooping) {
            videoRef.current?.replayAsync();
          }
        }}
      />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        {/* Close Button */}
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {/* Upload Status */}
        <View style={styles.uploadStatusContainer}>
          {uploadStage !== 'idle' && (
            <>
              <Text style={styles.uploadStatusText}>{getUploadStatusText()}</Text>
              {(uploadStage === 'thumbnail' || uploadStage === 'video') && (
                <View style={styles.progressBarContainer}>
                  <Animated.View style={[styles.progressBar, progressStyle]} />
                </View>
              )}
              {uploadStage === 'complete' && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              )}
              {uploadStage === 'error' && (
                <Ionicons name="alert-circle" size={20} color="#FF5252" />
              )}
            </>
          )}
        </View>

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
            icon="download-outline"
            size={56}
            iconSize={26}
            onPress={handleSave}
          />
          <Text style={styles.buttonLabel}>Save</Text>
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
  uploadStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  uploadStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    paddingHorizontal: 40,
    zIndex: 10,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 8,
  },
  buttonLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
