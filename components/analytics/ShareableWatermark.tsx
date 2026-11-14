import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';

export default function ShareableWatermark() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>LockIn</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  text: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: T.inkMute,
    letterSpacing: 2,
  },
});
