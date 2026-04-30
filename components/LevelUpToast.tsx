import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';

interface LevelUpToastProps {
  level: number | null; // null = hidden
  onDismiss: () => void;
}

export default function LevelUpToast({ level, onDismiss }: LevelUpToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    if (level == null) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const dismissTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -12,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }, 1500);

    return () => clearTimeout(dismissTimer);
  }, [level, opacity, translateY, onDismiss]);

  if (level == null) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { top: insets.top + 12 }]}
    >
      <Animated.View
        style={[
          styles.toast,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <Text style={styles.label}>LEVEL UP</Text>
        <Text style={styles.value}>LV {level}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: LC.bgElev,
    borderColor: LC.red,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  label: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.red,
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: LC.text,
    letterSpacing: 0.5,
  },
});
