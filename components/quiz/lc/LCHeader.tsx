import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LC } from '../../../constants/LockinClubColors';
import { optionSelect } from '../../../lib/haptics';

interface LCHeaderProps {
  onBack?: () => void;
  showBack?: boolean;
  right?: React.ReactNode;
}

export default function LCHeader({
  onBack,
  showBack = true,
  right,
}: LCHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      optionSelect();
      onBack();
    }
  };

  return (
    <View style={styles.row}>
      {showBack && onBack ? (
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={18} color={LC.text} />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={{ flex: 1 }} />
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 34,
    height: 34,
  },
});
