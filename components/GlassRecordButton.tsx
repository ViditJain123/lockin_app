import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const BUTTON_SIZE = 76;
const INNER_CIRCLE_SIZE = 58;

interface GlassRecordButtonProps {
  onPress?: () => void;
  isRecording?: boolean;
}

export default function GlassRecordButton({
  onPress,
  isRecording = false,
}: GlassRecordButtonProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.15);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
    glowOpacity.value = withSpring(0.35, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    glowOpacity.value = withSpring(0.15, { damping: 15, stiffness: 300 });
  };

  return (
    <View style={styles.wrapper}>
      {/* Soft glow effect behind button */}
      <Animated.View style={[styles.glowEffect, animatedGlowStyle]} />
      
      <AnimatedTouchable
        style={[styles.container, animatedButtonStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Outer ring with glass effect */}
        <BlurView
          intensity={70}
          tint="light"
          style={styles.outerRing}
        >
          {/* Light refraction layer */}
          <LinearGradient
            colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Border highlight */}
          <View style={styles.outerBorder} />
          
          {/* Inner circle - solid white */}
          <View style={styles.innerCircleContainer}>
            <View style={[
              styles.innerCircle,
              isRecording && styles.innerCircleRecording,
            ]}>
              {/* Subtle inner gradient for depth */}
              <LinearGradient
                colors={[
                  'rgba(255,255,255,1)',
                  'rgba(245,245,245,1)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.innerGradient}
              />
            </View>
          </View>
        </BlurView>
      </AnimatedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: BUTTON_SIZE + 20,
    height: BUTTON_SIZE + 20,
    borderRadius: (BUTTON_SIZE + 20) / 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  container: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  outerRing: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
  },
  outerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: BUTTON_SIZE / 2,
  },
  innerCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: INNER_CIRCLE_SIZE,
    height: INNER_CIRCLE_SIZE,
    borderRadius: INNER_CIRCLE_SIZE / 2,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  innerCircleRecording: {
    backgroundColor: '#ff4444',
  },
  innerGradient: {
    flex: 1,
    borderRadius: INNER_CIRCLE_SIZE / 2,
  },
});
