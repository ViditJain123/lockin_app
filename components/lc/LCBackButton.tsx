import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { LC } from '@/constants/BrandColors';

// Round back button used at the top of screens opened from the dashboard
export function LCBackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={10}
    >
      <Ionicons name="chevron-back" size={18} color={LC.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LC.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});
