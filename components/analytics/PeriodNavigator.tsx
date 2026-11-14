import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { T, cardShadow } from '@/constants/Theme';

interface Props {
  label: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

export default function PeriodNavigator({ label, canGoBack, canGoForward, onBack, onForward }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        disabled={!canGoBack}
        hitSlop={12}
        style={styles.arrow}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={canGoBack ? T.ink : T.inkMute}
        />
      </Pressable>

      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={onForward}
        disabled={!canGoForward}
        hitSlop={12}
        style={styles.arrow}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={canGoForward ? T.ink : T.inkMute}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  label: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: T.ink,
    marginHorizontal: 12,
    minWidth: 160,
    textAlign: 'center',
  },
});
