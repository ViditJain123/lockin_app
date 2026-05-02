import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';
import { buttonPress } from '../../../lib/haptics';

interface LCCTAProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'solid' | 'outline';
  tone?: 'red' | 'green';
  hint?: string;
  hideArrow?: boolean;
  pinned?: boolean;
  style?: ViewStyle;
}

export default function LCCTA({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'solid',
  tone = 'red',
  hint,
  hideArrow = false,
  pinned = true,
  style,
}: LCCTAProps) {
  const insets = useSafeAreaInsets();
  const accent = tone === 'green' ? LC.green : LC.red;
  const glow = tone === 'green' ? LC.greenGlow : LC.redGlow;
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    buttonPress();
    onPress();
  };

  const solidStyle: ViewStyle = {
    backgroundColor: isDisabled ? 'rgba(255,255,255,0.08)' : accent,
    shadowColor: accent,
    shadowOpacity: isDisabled ? 0 : 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: isDisabled ? 0 : 8,
  };

  const outlineStyle: ViewStyle = {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: LC.borderStrong,
  };

  return (
    <View
      style={[
        pinned && styles.pinned,
        { paddingBottom: insets.bottom + 14 },
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.btn,
          variant === 'solid' ? solidStyle : outlineStyle,
          pressed && !isDisabled && { transform: [{ translateY: 1 }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text
              style={[
                styles.label,
                {
                  color: isDisabled ? LC.textMute : '#fff',
                },
              ]}
            >
              {label.toUpperCase()}
            </Text>
            {!hideArrow && (
              <Ionicons
                name="arrow-forward"
                size={18}
                color={isDisabled ? LC.textMute : '#fff'}
                style={{ marginLeft: 10 }}
              />
            )}
          </>
        )}
        {variant === 'solid' && !isDisabled && (
          <View
            pointerEvents="none"
            style={[styles.glow, { shadowColor: glow }]}
          />
        )}
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint.toUpperCase()}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pinned: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 18,
    letterSpacing: 2.2,
  },
  hint: {
    textAlign: 'center',
    marginTop: 12,
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    color: LC.textMute,
    letterSpacing: 1.4,
  },
});
