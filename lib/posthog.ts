import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';

const posthogProjectToken = (Constants.expoConfig?.extra?.posthogProjectToken ?? '') as string;
const posthogHost = (Constants.expoConfig?.extra?.posthogHost ?? '') as string;

export const posthog = new PostHog(posthogProjectToken, {
  host: posthogHost,
});
