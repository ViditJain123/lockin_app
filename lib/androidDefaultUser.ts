import { Platform } from 'react-native';

export const IS_ANDROID = Platform.OS === 'android';

// Deterministic UUID v4 used as the default user id on every Android install.
// Android skips signup/onboarding entirely and uses this single shared identity,
// so analytics will bucket every Android session under this one id by design.
export const ANDROID_DEFAULT_USER_ID = 'a0000000-0000-4000-8000-000000000001';
export const ANDROID_DEFAULT_NAME = 'Yashvi';
export const ANDROID_DEFAULT_TARGET_HOURS = 6;
