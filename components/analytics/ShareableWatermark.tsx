import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';

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
    color: 'rgba(255,255,255,0.08)',
    letterSpacing: 2,
  },
});
