
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- Configuration ---
const TAB_BAR_WIDTH_PERCENT = 0.75; // 3/4th of screen width using 0.75
const TAB_BAR_HEIGHT = 60; // Reduced height for tighter 4px gap
const TAB_BAR_BOTTOM_MARGIN = 0;
const CAPSULE_HEIGHT = 52;
const ICON_SIZE = 24;
const HORIZONTAL_PADDING = 1; // Reduced padding for tighter 4px gap (2px pad + 2px internal)

export default function GlassBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  // Calculate total number of tabs used for spacing
  const totalTabs = state.routes.length;
  
  // Shared value for the active tab index animation
  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 15,
      stiffness: 120,
      mass: 0.8,
    });
  }, [state.index]);

  // Animated style for the liquid capsule
  const animatedCapsuleStyle = useAnimatedStyle(() => {
    const containerW = width * TAB_BAR_WIDTH_PERCENT;
    const paddingH = HORIZONTAL_PADDING;
    const usableW = containerW - (paddingH * 2);
    const oneTabW = usableW / totalTabs;
    
    // Calculate Capsule Width
    // We make it slightly smaller than the full slot width for a "floating" feel 
    // and to avoid hitting the container edges.
    const capsuleWidth = oneTabW - 4; // 2px gap on each side within the slot
    
    const currentTabCenter = paddingH + (activeIndex.value * oneTabW) + (oneTabW / 2);
    const capsuleLeft = currentTabCenter - (capsuleWidth / 2);
    
    return {
      transform: [{ translateX: capsuleLeft }],
      width: capsuleWidth, // Dynamic width
    };
  });

  return (
    <View style={[styles.container, { bottom: insets.bottom + TAB_BAR_BOTTOM_MARGIN }]}>
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
        
        {/* Active Tab Capsule */}
        <Animated.View style={[styles.capsule, animatedCapsuleStyle]}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.capsuleBorder} />
        </Animated.View>

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

            // Based on route names from _layout.tsx
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
                // testID={options.tabBarTestID} // removed to fix type error if not present in types
                onPress={onPress}
                style={styles.tabButton}
                activeOpacity={0.7} // "Use opacity change, not scale"
              >
                <Ionicons 
                    name={iconName} 
                    size={ICON_SIZE} 
                    color={isFocused ? '#000000' : '#808080'} 
                />
                {isFocused && ( 
                  // Prompt implies label is always there but maybe faded? 
                  // "Inactive color: white at 60% opacity" -> implies visible.
                  // But often with capsule designs, label shows only when active or always?
                  // "Wraps icon + label" for capsule implies both result in wider capsule.
                  // Prompt: "Each tab contains: Icon (primary), Label (secondary)"
                  // Let's show label always.
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    width: width * TAB_BAR_WIDTH_PERCENT,
    height: TAB_BAR_HEIGHT,
    borderRadius: 30, // Adjusted for new height (60/2)
    overflow: 'hidden', // Clip the BlurView radius
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1, // "No dark shadows anywhere" -> "No drop shadows" requested? 
    // "No drop shadows" ... "No dark shadows anywhere."
    // Okay, removing shadow. But "Glow is white"
    shadowRadius: 0,
    elevation: 0,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 30, // Adjusted for new height
    backgroundColor: 'rgba(255, 255, 255, 0.18)', // "Background color: rgba(255, 255, 255, 0.18)"
    borderColor: 'rgba(255, 255, 255, 0.25)', // "1px inner border"
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
    zIndex: 10, // Ensure taps work above capsule? 
    // Actually capsule is in same stacking context.
  },
  capsule: {
    position: 'absolute',
    top: (TAB_BAR_HEIGHT - CAPSULE_HEIGHT) / 2, // Vertically centered
    height: CAPSULE_HEIGHT,
    // Width is now dynamic in useAnimatedStyle
    borderRadius: 26, // Half of 52
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.28)', // Active background
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
