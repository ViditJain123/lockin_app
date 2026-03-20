import { Dimensions, Platform } from 'react-native';

export const MAX_CONTENT_WIDTH = 430;

export function isTablet(): boolean {
  if (Platform.OS === 'ios') {
    // @ts-ignore - Platform.isPad exists on iOS
    return Platform.isPad === true;
  }
  const { width } = Dimensions.get('window');
  return width > 600;
}

export function getContentWidth(): number {
  const { width } = Dimensions.get('window');
  if (isTablet()) {
    return Math.min(width, MAX_CONTENT_WIDTH);
  }
  return width;
}
