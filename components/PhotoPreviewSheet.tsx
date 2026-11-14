import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { shareAsync } from 'expo-sharing';
import React, { useEffect } from 'react';
import { Alert, Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Fonts } from '@/constants/Fonts';
import { RADIUS, T, cardShadow } from '@/constants/Theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 150;

interface Props {
  visible: boolean;
  /** Absolute file URI of the rendered photo card (jpg) */
  cardUri: string;
  onClose: () => void;
}

export default function PhotoPreviewSheet({ visible, cardUri, onClose }: Props) {
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
      await shareAsync(cardUri, { mimeType: 'image/jpeg' });
    } catch {
      Alert.alert('Error', 'Could not share the photo.');
    }
  };

  const handleSave = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save photos.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(cardUri);
      Alert.alert('Saved', 'Photo saved to your gallery.');
    } catch {
      Alert.alert('Error', 'Could not save the photo.');
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.overlay, overlayStyle]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={22} color={T.ink} />
          </Pressable>

          <View style={styles.mediaFrame}>
            <Image source={{ uri: cardUri }} style={styles.image} resizeMode="contain" />
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={T.ink} />
              <Text style={styles.actionText}>Share</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.actionButtonPrimary]} onPress={handleSave}>
              <Ionicons name="download-outline" size={20} color={T.white} />
              <Text style={[styles.actionText, styles.actionTextPrimary]}>Save to Gallery</Text>
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
    backgroundColor: T.canvas,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...cardShadow,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.card,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    ...cardShadow,
  },
  actionButtonPrimary: {
    backgroundColor: T.orange,
    shadowColor: T.orange,
    shadowOpacity: 0.28,
  },
  actionText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: T.ink,
  },
  actionTextPrimary: {
    color: T.white,
  },
  mediaFrame: {
    width: '100%',
    borderRadius: RADIUS.sm,
    backgroundColor: T.card,
    ...cardShadow,
  },
  image: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
});
