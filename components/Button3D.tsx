import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

import { Fonts } from '../constants/Fonts';

// 3D Button Colors - Reddish Pink Brand Theme
const COLORS = {
  // Main gradient (top to bottom of button face) - extended for smooth blend
  gradientTop: '#FF6B82',    // Lighter pink at top
  gradientMid: '#F04560',    // Mid pink
  gradientBottom: '#C83050', // Bottom of button face (blends into shadow)

  // 3D depth effect
  highlight: 'rgba(255, 255, 255, 0.25)', // Top edge highlight (subtle)
  shadow: '#A02040',         // Bottom edge shadow (darker, matches gradient end)

  // Text
  text: '#FFFFFF',

  // Disabled state colors (grayed out)
  disabledGradientTop: '#4A4A4C',
  disabledGradientMid: '#3A3A3C',
  disabledGradientBottom: '#2C2C2E',
  disabledShadow: '#1C1C1E',
  disabledText: 'rgba(255, 255, 255, 0.4)',
};

interface Button3DProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export default function Button3D({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'right',
  style,
  textStyle,
  fullWidth = true,
}: Button3DProps) {
  const isDisabled = disabled || loading;

  // Choose colors based on disabled state
  const gradientColors: readonly [string, string, string, string] = isDisabled
    ? [COLORS.disabledGradientTop, COLORS.disabledGradientMid, COLORS.disabledGradientBottom, COLORS.disabledShadow]
    : [COLORS.gradientTop, COLORS.gradientMid, COLORS.gradientBottom, COLORS.shadow];

  const shadowColor = isDisabled ? COLORS.disabledShadow : COLORS.shadow;
  const textColor = isDisabled ? COLORS.disabledText : COLORS.text;

  return (
    <View style={[styles.wrapper, fullWidth && styles.fullWidth, style]}>
      {/* Bottom shadow layer - creates the 3D depth */}
      <View style={[styles.shadowLayer, { backgroundColor: shadowColor }]} />

      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.pressable,
          pressed && !isDisabled && styles.pressablePressed,
        ]}
      >
        {({ pressed }) => (
          <View style={[styles.buttonContainer, pressed && !isDisabled && styles.buttonPressed]}>
            {/* Top highlight edge - only show when active */}
            {!isDisabled && <View style={styles.highlightEdge} />}

            {/* Main button face with gradient */}
            <LinearGradient
              colors={gradientColors}
              locations={[0, 0.4, 0.85, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.buttonFace}
            >
              {/* Inner highlight for glass effect - only show when active */}
              {!isDisabled && <View style={styles.innerHighlight} />}

              {/* Button content */}
              <View style={styles.contentContainer}>
                {icon && iconPosition === 'left' && (
                  <View style={[styles.iconLeft, isDisabled && { opacity: 0.4 }]}>{icon}</View>
                )}
                <Text style={[styles.buttonText, { color: textColor }, textStyle]}>
                  {loading ? 'Loading...' : title}
                </Text>
                {icon && iconPosition === 'right' && (
                  <View style={[styles.iconRight, isDisabled && { opacity: 0.4 }]}>{icon}</View>
                )}
              </View>
            </LinearGradient>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const BORDER_RADIUS = 18;
const BUTTON_HEIGHT = 58;
const SHADOW_OFFSET = 5;

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    height: BUTTON_HEIGHT + SHADOW_OFFSET,
  },
  fullWidth: {
    width: '100%',
  },
  shadowLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BUTTON_HEIGHT,
    backgroundColor: COLORS.shadow,
    borderRadius: BORDER_RADIUS,
  },
  pressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BUTTON_HEIGHT,
  },
  pressablePressed: {
    top: SHADOW_OFFSET - 2,
  },
  buttonContainer: {
    height: BUTTON_HEIGHT,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.95,
  },
  highlightEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.highlight,
    zIndex: 2,
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
  },
  buttonFace: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: Fonts.interSemiBold,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
});
