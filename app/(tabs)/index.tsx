import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Fonts } from '../../constants/Fonts';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
});
