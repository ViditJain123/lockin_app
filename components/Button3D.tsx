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
import { buttonPress } from '../lib/haptics';

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

// Blue variant colors
const BLUE_COLORS = {
  gradientTop: '#33B5FF',
  gradientMid: '#00A3FF',
  gradientBottom: '#0088CC',
  highlight: 'rgba(255, 255, 255, 0.3)',
  shadow: '#006699',
  text: '#FFFFFF',
};

// Orange variant colors
const ORANGE_COLORS = {
  gradientTop: '#FF9147',
  gradientMid: '#FF6B35',
  gradientBottom: '#E85D2C',
  highlight: 'rgba(255, 255, 255, 0.3)',
  shadow: '#C44A1D',
  text: '#FFFFFF',
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
  variant?: 'default' | 'blue' | 'orange';
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
  variant = 'default',
}: Button3DProps) {
  const isDisabled = disabled || loading;

  // Choose colors based on variant and disabled state
  const getActiveColors = () => {
    switch (variant) {
      case 'blue': return BLUE_COLORS;
      case 'orange': return ORANGE_COLORS;
      default: return COLORS;
    }
  };
  const activeColors = getActiveColors();
  const gradientColors: readonly [string, string, string, string] = isDisabled
    ? [COLORS.disabledGradientTop, COLORS.disabledGradientMid, COLORS.disabledGradientBottom, COLORS.disabledShadow]
    : [activeColors.gradientTop, activeColors.gradientMid, activeColors.gradientBottom, activeColors.shadow];

  const shadowColor = isDisabled ? COLORS.disabledShadow : activeColors.shadow;
  const textColor = isDisabled ? COLORS.disabledText : activeColors.text;

  return (
    <View style={[styles.wrapper, fullWidth && styles.fullWidth, style]}>
      {/* Bottom shadow layer - creates the 3D depth */}
      <View style={[styles.shadowLayer, { backgroundColor: shadowColor }]} />

      <Pressable
        onPress={() => {
          buttonPress();
          onPress();
        }}
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
