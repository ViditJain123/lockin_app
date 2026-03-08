import React, { useEffect } from 'react';
import { View, Pressable, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../constants/Fonts';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 150;

const MIN_PLAYABLE_DURATION = 240; // 4 minutes in seconds

interface Props {
  visible: boolean;
  videoUri: string;
  sessionDurationSeconds?: number;
  onClose: () => void;
}

export default function TimelapsePreviewSheet({ visible, videoUri, sessionDurationSeconds, onClose }: Props) {
  const isTooShort = sessionDurationSeconds != null && sessionDurationSeconds < MIN_PLAYABLE_DURATION;
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      opacity.value = 0;
    }
  }, [visible]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        opacity.value = 1 - e.translationY / SCREEN_HEIGHT;
      }
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 200 });
        opacity.value = withTiming(1, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleShare = async () => {
    try {
      await shareAsync(videoUri);
    } catch {
      Alert.alert('Error', 'Could not share the video.');
    }
  };

  const handleSave = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save videos.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(videoUri);
      Alert.alert('Saved', 'Video saved to your gallery.');
    } catch {
      Alert.alert('Error', 'Could not save the video.');
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View style={[styles.content, animatedStyle]}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>

          {isTooShort && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={16} color="#000" />
              <Text style={styles.warningText}>
                Recording under 4 min — timelapse won't play here. Save to gallery to view.
              </Text>
            </View>
          )}

          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            isLooping
            shouldPlay={visible && !isTooShort}
            resizeMode={ResizeMode.CONTAIN}
          />

          <View style={styles.buttonRow}>
            <Pressable style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color="#FFFFFF" />
              <Text style={styles.actionText}>Share</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleSave}>
              <Ionicons name="download-outline" size={22} color="#FFFFFF" />
              <Text style={styles.actionText}>Save to Gallery</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD60A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: '#000',
  },
});
