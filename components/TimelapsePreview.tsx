import React from 'react';
import {
    Platform,
    requireNativeComponent,
    StyleSheet,
    View,
    ViewProps,
} from 'react-native';

interface TimelapsePreviewProps extends ViewProps {
  // Add any props that the native view might need
}

// Only load the native component on iOS
const NativeTimelapsePreview =
  Platform.OS === 'ios'
    ? requireNativeComponent<TimelapsePreviewProps>('TimelapsePreviewView')
    : null;

/**
 * Native camera preview component that displays the timelapse capture session.
 * This allows the camera preview to continue during timelapse recording.
 * 
 * Only available on iOS. Falls back to empty view on other platforms.
 */
export function TimelapsePreview(props: TimelapsePreviewProps) {
  const { style, ...otherProps } = props;

  if (Platform.OS !== 'ios' || !NativeTimelapsePreview) {
    // Return empty view on non-iOS platforms
    return <View style={style} />;
  }

  return (
    <NativeTimelapsePreview
      style={[styles.preview, style]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  preview: {
    flex: 1,
  },
});

export default TimelapsePreview;
