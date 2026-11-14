import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Fonts } from '@/constants/Fonts';
import { T, cardShadow } from '@/constants/Theme';

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
    backgroundColor: T.card,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    ...cardShadow,
    shadowColor: T.orange,
    shadowOpacity: 0.22,
    elevation: 10,
  },
  label: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 2,
    color: T.orange,
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: T.ink,
    letterSpacing: 0.5,
  },
});
