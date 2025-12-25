import { Ionicons } from '@expo/vector-icons';
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

interface GlassIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  iconSize?: number;
  onPress?: () => void;
  isActive?: boolean;
  activeColor?: string;
  disabled?: boolean;
}

export default function GlassIconButton({
  icon,
  size = 48,
  iconSize = 22,
  onPress,
  isActive = false,
  activeColor = 'rgba(255, 220, 100, 0.95)',
  disabled = false,
}: GlassIconButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedTouchable
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
        disabled && styles.disabled,
      ]}
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
    >
      <BlurView
        intensity={65}
        tint="light"
        style={[styles.blur, { borderRadius: size / 2 }]}
      >
        {/* Light refraction layer */}
        <LinearGradient
          colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Border highlight */}
        <View style={[styles.borderHighlight, { borderRadius: size / 2 }]} />
        
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={iconSize}
            color={isActive ? activeColor : 'rgba(255,255,255,0.88)'}
          />
        </View>
      </BlurView>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  blur: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  borderHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

