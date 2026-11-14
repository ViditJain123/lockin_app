import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { T, cardShadow } from '@/constants/Theme';
import { PAGE, useHomePager } from '@/contexts/HomePager';

// Round back button used at the top of screens opened from the dashboard
export function LCBackButton() {
  // Inside the home pager, "back" slides to the home page
  const pager = useHomePager();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => (pager ? pager.goTo(PAGE.home) : router.canGoBack() ? router.back() : router.replace('/'))}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={10}
    >
      <Ionicons name="chevron-back" size={20} color={T.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.card,
    ...cardShadow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});
