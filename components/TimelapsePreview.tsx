import React from 'react';
import { View, ViewProps } from 'react-native';

interface TimelapsePreviewProps extends ViewProps {
  // Keep interface for compatibility
}

/**
 * STUBBED: TimelapsePreview component
 *
 * Returns empty View always - not used since we now use expo-camera
 * throughout the recording flow. Kept for safety in case any code
 * still references it.
 */
export function TimelapsePreview(props: TimelapsePreviewProps) {
  return <View style={props.style} />;
}

export default TimelapsePreview;
