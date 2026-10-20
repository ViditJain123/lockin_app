import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { LC, LC_RADIUS } from '../../../constants/LockinClubColors';

interface LCCardProps {
  children: React.ReactNode;
  radius?: keyof typeof LC_RADIUS;
  tone?: 'default' | 'armed';
  padding?: number;
  style?: ViewStyle;
}

export default function LCCard({
  children,
  radius = 'lg',
  tone = 'default',
  padding = 16,
  style,
}: LCCardProps) {
  const armed = tone === 'armed';
  return (
    <View
      style={[
        styles.base,
        {
          borderRadius: LC_RADIUS[radius],
          backgroundColor: armed ? LC.redTint : LC.bgCard,
          borderColor: armed ? 'rgba(255,102,0,0.4)' : LC.border,
          padding,
          shadowColor: armed ? LC.red : 'transparent',
          shadowOpacity: armed ? 0.25 : 0,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: armed ? 6 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
});
