
import { BlurView } from 'expo-blur';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '../../constants/Fonts';

export default function SettingsScreen() {
  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <BlurView intensity={20} style={styles.glassCard}>
        <Text style={styles.title}>Settings</Text>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCard: {
    padding: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: 'white',
  },
});
