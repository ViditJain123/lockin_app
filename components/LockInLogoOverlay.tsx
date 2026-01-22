import { Fonts } from '@/constants/Fonts';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Logo container dimensions (reduced to 75% of original size)
const CONTAINER_HEIGHT = 27;
const CONTAINER_PADDING_LEFT = 9;
const CONTAINER_PADDING_RIGHT = 12;
const LEFT_EDGE_PADDING = 9;

export default function LockInLogoOverlay() {
  // Position at 1/4 from the top
  const topPosition = SCREEN_HEIGHT * 0.25;

  return (
    <View style={[styles.container, { top: topPosition }]}>
      <View style={styles.pillContainer}>
        <Text style={styles.logoText}>Lock In</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: LEFT_EDGE_PADDING,
    zIndex: 15,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingLeft: CONTAINER_PADDING_LEFT,
    paddingRight: CONTAINER_PADDING_RIGHT,
    height: CONTAINER_HEIGHT,
    // Half-pill shape: square on left, rounded on right
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: CONTAINER_HEIGHT / 2,
    borderBottomRightRadius: CONTAINER_HEIGHT / 2,
  },
  logoText: {
    color: 'white',
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
});
