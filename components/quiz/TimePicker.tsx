import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { BrandColors } from '../../constants/BrandColors';
import { Fonts } from '../../constants/Fonts';

const SCREEN_WIDTH = Math.min(Dimensions.get('window').width, 430);

// Item configuration
const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Number of times to repeat data for infinite scroll effect
const REPEAT_COUNT = 50;
const MIDDLE_REPEAT = Math.floor(REPEAT_COUNT / 2);

// Generate hours (12-hour format)
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
// Generate minutes (00, 15, 30, 45)
const MINUTES = [0, 15, 30, 45];
// AM/PM
const PERIODS = ['AM', 'PM'];

interface TimePickerProps {
  hour: number; // 1-12
  minute: number; // 0, 15, 30, 45
  period: 'AM' | 'PM';
  onTimeChange: (hour: number, minute: number, period: 'AM' | 'PM') => void;
  accentColor?: string;
}

interface WheelPickerProps<T> {
  data: T[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem: (item: T) => string;
  width: number;
  accentColor: string;
  infiniteScroll?: boolean;
}

function WheelPicker<T>({
  data,
  selectedIndex,
  onSelect,
  formatItem,
  width,
  accentColor,
  infiniteScroll = true,
}: WheelPickerProps<T>) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);
  const isInitialMount = useRef(true);
  const isUserScroll = useRef(false);
  const dataLength = data.length;

  // Create repeated data for infinite scroll, or use original data
  const displayData = infiniteScroll
    ? Array.from({ length: REPEAT_COUNT }, () => data).flat()
    : data;

  // Calculate the initial scroll index (middle of repeated data + selected index for infinite, or just selected index)
  const getScrollIndex = (index: number) =>
    infiniteScroll ? MIDDLE_REPEAT * dataLength + index : index;

  // Scroll to selected index on mount and when selectedIndex changes externally
  useEffect(() => {
    if (scrollViewRef.current) {
      // Skip scroll if this change was triggered by user interaction
      if (isUserScroll.current) {
        isUserScroll.current = false;
        return;
      }
      const scrollIndex = getScrollIndex(selectedIndex);
      scrollViewRef.current.scrollTo({
        y: scrollIndex * ITEM_HEIGHT,
        animated: !isInitialMount.current,
      });
      isInitialMount.current = false;
    }
  }, [selectedIndex, dataLength, infiniteScroll]);

  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const scrollIndex = Math.round(offsetY / ITEM_HEIGHT);

      // Map back to actual data index
      const actualIndex = infiniteScroll
        ? ((scrollIndex % dataLength) + dataLength) % dataLength
        : Math.max(0, Math.min(dataLength - 1, scrollIndex));

      if (actualIndex !== selectedIndex) {
        isUserScroll.current = true;
        onSelect(actualIndex);
      }

      // Re-center to middle if getting close to edges (only for infinite scroll)
      if (infiniteScroll && (scrollIndex < dataLength * 5 || scrollIndex > dataLength * (REPEAT_COUNT - 5))) {
        const centeredIndex = getScrollIndex(actualIndex);
        scrollViewRef.current?.scrollTo({
          y: centeredIndex * ITEM_HEIGHT,
          animated: false,
        });
      }
    },
    [dataLength, selectedIndex, onSelect, infiniteScroll]
  );

  // Padding items for scroll effect (empty slots)
  const paddingCount = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <View style={[styles.wheelContainer, { width }]}>
      {/* Gradient overlays for fade effect */}
      <LinearGradient
        colors={['rgba(0,0,0,1)', 'rgba(0,0,0,0)']}
        style={styles.gradientTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
        style={styles.gradientBottom}
        pointerEvents="none"
      />

      {/* Selection highlight - always fixed at center */}
      <View
        style={[
          styles.selectionHighlight,
          {
            borderColor: accentColor,
            top: ITEM_HEIGHT * paddingCount,
          },
        ]}
        pointerEvents="none"
      />

      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top padding */}
        {Array.from({ length: paddingCount }).map((_, i) => (
          <View key={`top-pad-${i}`} style={styles.item} />
        ))}

        {/* Data items */}
        {displayData.map((item, index) => {
          const inputRange = [
            (index - 2) * ITEM_HEIGHT,
            (index - 1) * ITEM_HEIGHT,
            index * ITEM_HEIGHT,
            (index + 1) * ITEM_HEIGHT,
            (index + 2) * ITEM_HEIGHT,
          ];

          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.7, 0.85, 1, 0.85, 0.7],
            extrapolate: 'clamp',
          });

          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.3, 0.5, 1, 0.5, 0.3],
            extrapolate: 'clamp',
          });

          // Check if this item matches the selected value
          const actualIndex = infiniteScroll ? index % dataLength : index;
          const isSelected = actualIndex === selectedIndex;

          return (
            <Animated.View
              key={index}
              style={[
                styles.item,
                {
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            >
              <Text
                style={[
                  styles.itemText,
                  isSelected && { color: accentColor },
                ]}
              >
                {formatItem(item)}
              </Text>
            </Animated.View>
          );
        })}

        {/* Bottom padding */}
        {Array.from({ length: paddingCount }).map((_, i) => (
          <View key={`bottom-pad-${i}`} style={styles.item} />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

/**
 * TimePicker - Modern wheel-style time picker component
 * Uses scroll-wheel interface with snap points for smooth selection
 */
export default function TimePicker({
  hour,
  minute,
  period,
  onTimeChange,
  accentColor = BrandColors.primary.main, // Brand color accent
}: TimePickerProps) {
  // Find indices
  const hourIndex = HOURS.indexOf(hour);
  const minuteIndex = MINUTES.indexOf(minute);
  const periodIndex = PERIODS.indexOf(period);

  // Calculate column widths
  const hourWidth = SCREEN_WIDTH * 0.22;
  const minuteWidth = SCREEN_WIDTH * 0.22;
  const periodWidth = SCREEN_WIDTH * 0.22;

  return (
    <View style={styles.container}>
      {/* Hour picker */}
      <WheelPicker
        data={HOURS}
        selectedIndex={hourIndex >= 0 ? hourIndex : 8} // Default to 9
        onSelect={(index) => onTimeChange(HOURS[index], minute, period)}
        formatItem={(h) => h.toString()}
        width={hourWidth}
        accentColor={accentColor}
      />

      {/* Separator */}
      <Text style={[styles.separator, { color: accentColor }]}>:</Text>

      {/* Minute picker */}
      <WheelPicker
        data={MINUTES}
        selectedIndex={minuteIndex >= 0 ? minuteIndex : 0}
        onSelect={(index) => onTimeChange(hour, MINUTES[index], period)}
        formatItem={(m) => m.toString().padStart(2, '0')}
        width={minuteWidth}
        accentColor={accentColor}
      />

      {/* Period picker (AM/PM) */}
      <WheelPicker
        data={PERIODS}
        selectedIndex={periodIndex >= 0 ? periodIndex : 1} // Default to PM
        onSelect={(index) => onTimeChange(hour, minute, PERIODS[index] as 'AM' | 'PM')}
        formatItem={(p) => p}
        width={periodWidth}
        accentColor={accentColor}
        infiniteScroll={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: PICKER_HEIGHT,
    paddingHorizontal: 8,
  },
  wheelContainer: {
    height: PICKER_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  scrollContent: {
    paddingVertical: 0,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
  },
  separator: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    marginHorizontal: 4,
  },
  selectionHighlight: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(255,102,0, 0.1)',
    zIndex: -1,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 1,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 1,
  },
});
