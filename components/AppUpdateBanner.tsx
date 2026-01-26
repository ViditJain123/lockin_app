import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/Fonts';
import { buttonPress } from '@/lib/haptics';
import { useAppUpdateStore } from '@/store/useAppUpdateStore';

interface AppUpdateBannerProps {
  visible: boolean;
}

export default function AppUpdateBanner({ visible }: AppUpdateBannerProps) {
  const insets = useSafeAreaInsets();
  const { updateMessage, latestVersion, dismissSoftUpdate, openStore } = useAppUpdateStore();

  if (!visible) {
    return null;
  }

  const handleUpdate = () => {
    buttonPress();
    openStore();
  };

  const handleDismiss = () => {
    buttonPress();
    dismissSoftUpdate();
  };

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(15)}
      exiting={SlideOutDown.springify().damping(15)}
      style={[
        styles.container,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
      ]}
    >
      <LinearGradient
        colors={['#1A1A1C', '#0D0D0E']}
        style={styles.gradient}
      >
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.5)" />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles" size={24} color="#FF3B5C" />
          </View>

          {/* Text content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>New Version Available</Text>
            <Text style={styles.message} numberOfLines={2}>
              {updateMessage || `Version ${latestVersion} is available with improvements.`}
            </Text>
          </View>
        </View>

        {/* Update button */}
        <Pressable
          style={({ pressed }) => [
            styles.updateButton,
            pressed && styles.updateButtonPressed,
          ]}
          onPress={handleUpdate}
        >
          <Text style={styles.updateButtonText}>Update</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 1000,
  },
  gradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 32,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.interSemiBold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B5C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  updateButtonPressed: {
    opacity: 0.8,
  },
  updateButtonText: {
    fontSize: 15,
    fontFamily: Fonts.interSemiBold,
    color: '#FFFFFF',
  },
});
