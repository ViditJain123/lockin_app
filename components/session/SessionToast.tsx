import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';

/** Small pill that drops in for milestone / hint messages during a session. */
export default function SessionToast({ message, top, variant = 'dark' }: { message: string | null; top: number; variant?: 'dark' | 'light' }) {
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.value = withTiming(message ? 1 : 0, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [message, shown]);

  const style = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * -16 }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { top }, style]}>
      {message ? (
        <Text style={[styles.pill, variant === 'light' ? styles.pillLight : styles.pillDark]} numberOfLines={1}>
          {message}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  pill: {
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  pillDark: {
    backgroundColor: T.white,
    color: T.black,
  },
  pillLight: {
    backgroundColor: T.yellow,
    color: T.black,
  },
});
