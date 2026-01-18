import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// GIF assets
const gifs = [
  require('../assets/images/gif1.gif'),
  require('../assets/images/gif2.gif'),
  require('../assets/images/gif3.gif'),
  require('../assets/images/gif4.gif'),
  require('../assets/images/gif5.gif'),
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Frame dimensions and styling
const FRAME_WIDTH = 120;
const FRAME_HEIGHT = 160;
const FRAME_GAP = 12;
const BORDER_RADIUS = 16;
const GLOW_COLOR = '#8B4513'; // Reddish-brown (sienna)

// Calculate total width of one set of frames
const SINGLE_SET_WIDTH = gifs.length * (FRAME_WIDTH + FRAME_GAP);

// Animation duration for one complete cycle (milliseconds)
const ANIMATION_DURATION = 15000;

export default function GifCarousel() {
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Start infinite scrolling animation
    translateX.value = withRepeat(
      withTiming(-SINGLE_SET_WIDTH, {
        duration: ANIMATION_DURATION,
        easing: Easing.linear,
      }),
      -1, // Infinite repeat
      false // Don't reverse
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Render a single GIF frame with rounded rectangle and glow
  const renderFrame = (gifSource: number, index: number) => (
    <View key={index} style={styles.frameContainer}>
      <View style={styles.rectangleFrame}>
        <Image source={gifSource} style={styles.gif} resizeMode="cover" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.carouselTrack, animatedStyle]}>
        {/* First set of GIFs */}
        {gifs.map((gif, index) => renderFrame(gif, index))}
        {/* Duplicate set for seamless looping */}
        {gifs.map((gif, index) => renderFrame(gif, index + gifs.length))}
        {/* Third set to ensure smooth transition */}
        {gifs.map((gif, index) => renderFrame(gif, index + gifs.length * 2))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: FRAME_HEIGHT + 20,
    overflow: 'hidden',
  },
  carouselTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: FRAME_GAP,
  },
  frameContainer: {
    marginRight: FRAME_GAP,
  },
  rectangleFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    // Soft glow effect
    shadowColor: GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 15,
  },
  gif: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  },
});
