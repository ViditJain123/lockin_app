import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRecordingStore } from '@/store/useRecordingStore';

const { width } = Dimensions.get('window');

// --- Configuration ---
const TAB_BAR_WIDTH_PERCENT = 0.60;
const TAB_BAR_HEIGHT = 60;
const TAB_BAR_BOTTOM_MARGIN = -12;
const CAPSULE_HEIGHT = 52;
const ICON_SIZE = 24;
const HORIZONTAL_PADDING = 1;

// Animation timing for iOS-native feel
const SLIDE_TIMING = {
  duration: 280,
  easing: Easing.bezier(0.4, 0.0, 0.2, 1), // iOS standard easing
};

export default function GlassBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const isRecording = useRecordingStore((s) => s.isRecording);
  
  // Calculate total number of tabs used for spacing
  const totalTabs = state.routes.length;
  
  // Shared value for the active tab index animation
  const activeIndex = useSharedValue(state.index);
  
  // Shared value for navbar slide animation
  const slideProgress = useSharedValue(0);

  // Update active tab animation
  useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 15,
      stiffness: 120,
      mass: 0.8,
    });
  }, [state.index]);

  // Update slide animation when recording state changes
  useEffect(() => {
    slideProgress.value = withTiming(isRecording ? 1 : 0, SLIDE_TIMING);
  }, [isRecording]);

  // Animated style for the liquid capsule
  const animatedCapsuleStyle = useAnimatedStyle(() => {
    const containerW = width * TAB_BAR_WIDTH_PERCENT;
    const paddingH = HORIZONTAL_PADDING;
    const usableW = containerW - (paddingH * 2);
    const oneTabW = usableW / totalTabs;
    
    const capsuleWidth = oneTabW - 4;
    
    const currentTabCenter = paddingH + (activeIndex.value * oneTabW) + (oneTabW / 2);
    const capsuleLeft = currentTabCenter - (capsuleWidth / 2);
    
    return {
      transform: [{ translateX: capsuleLeft }],
      width: capsuleWidth,
    };
  });

  // Animated style for navbar slide-down effect
  const animatedContainerStyle = useAnimatedStyle(() => {
    const slideDistance = TAB_BAR_HEIGHT + insets.bottom + 20;
    
    return {
      transform: [
        { translateY: slideProgress.value * slideDistance },
      ],
      opacity: withTiming(isRecording ? 0.8 : 1, { duration: 200 }),
    };
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { bottom: insets.bottom + TAB_BAR_BOTTOM_MARGIN },
        animatedContainerStyle,
      ]}
      pointerEvents={isRecording ? 'none' : 'auto'}
    >
      <BlurView
        intensity={75}
        tint="light"
        style={styles.blurContainer}
      >
        {/* Refraction Layer */}
        <LinearGradient
          colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Active Tab Capsule Container - for vertical centering */}
        <View style={styles.capsuleContainer}>
          <Animated.View style={[styles.capsule, animatedCapsuleStyle]}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.capsuleBorder} />
          </Animated.View>
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabsContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Map route names to icons and labels
            let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';
            let label = 'Tab';

            if (route.name === 'index') {
               iconName = 'camera';
               label = 'Camera';
            } else if (route.name === 'settings') {
               iconName = 'settings-sharp';
               label = 'Settings';
            } else if (route.name === 'profile') {
               iconName = 'person';
               label = 'Profile';
            }

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <Ionicons 
                    name={iconName} 
                    size={ICON_SIZE} 
                    color={isFocused ? '#000000' : '#808080'} 
                />
                {isFocused && ( 
                  <Text style={[styles.label, { color: '#000000' }]}>
                    {label}
                  </Text>
                )}
                {!isFocused && (
                     <Text style={[styles.label, { color: '#808080' }]}>
                     {label}
                   </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    width: width * TAB_BAR_WIDTH_PERCENT,
    height: TAB_BAR_HEIGHT,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 0,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabsContainer: {
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING, 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 10,
  },
  capsuleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  capsule: {
    height: CAPSULE_HEIGHT,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  capsuleBorder: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderRadius: 26,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  }
});
