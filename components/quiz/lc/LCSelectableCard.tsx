import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Fonts } from '../../../constants/Fonts';
import { LC, LC_RADIUS } from '../../../constants/LockinClubColors';
import { optionSelect } from '../../../lib/haptics';

interface LCSelectableCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  selected: boolean;
  onPress: () => void;
  layout?: 'row' | 'tile';
  style?: ViewStyle;
  hapticOnSelect?: boolean;
}

export default function LCSelectableCard({
  title,
  subtitle,
  icon,
  trailing,
  selected,
  onPress,
  layout = 'row',
  style,
  hapticOnSelect = true,
}: LCSelectableCardProps) {
  const handlePress = () => {
    if (hapticOnSelect) optionSelect();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        layout === 'tile' ? styles.tile : styles.row,
        {
          backgroundColor: selected ? LC.redTint : LC.bgCard,
          borderColor: selected ? 'rgba(255,59,92,0.5)' : LC.border,
          shadowColor: selected ? LC.red : 'transparent',
          shadowOpacity: selected ? 0.35 : 0,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: selected ? 6 : 0,
        },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {layout === 'tile' ? (
        <>
          {selected && (
            <View style={styles.tileCheck}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          )}
          {icon ? <View style={styles.tileIcon}>{icon}</View> : null}
          <Text style={styles.tileTitle}>{title.toUpperCase()}</Text>
          {subtitle ? <Text style={styles.tileSubtitle}>{subtitle}</Text> : null}
          {trailing ? <View style={{ marginTop: 6 }}>{trailing}</View> : null}
        </>
      ) : (
        <>
          {icon ? <View style={styles.rowIcon}>{icon}</View> : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{title}</Text>
            {subtitle ? (
              <Text style={styles.rowSubtitle}>{subtitle}</Text>
            ) : null}
          </View>
          {trailing ?? (
            <View
              style={[
                styles.rowCheck,
                {
                  borderColor: selected ? LC.red : LC.borderStrong,
                  backgroundColor: selected ? LC.red : 'transparent',
                },
              ]}
            >
              {selected && (
                <Ionicons name="checkmark" size={12} color="#fff" />
              )}
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: LC_RADIUS.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  tile: {
    minHeight: 110,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    position: 'relative',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 14,
    color: LC.text,
  },
  rowSubtitle: {
    fontFamily: Fonts.interRegular,
    fontSize: 12,
    color: LC.textDim,
    marginTop: 2,
  },
  rowCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIcon: {
    height: 28,
    justifyContent: 'center',
  },
  tileCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: LC.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: LC.text,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  tileSubtitle: {
    fontFamily: Fonts.interRegular,
    fontSize: 11,
    color: LC.textDim,
    marginTop: 4,
    lineHeight: 14,
  },
});
