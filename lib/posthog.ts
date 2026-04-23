import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';

const posthogProjectToken = (Constants.expoConfig?.extra?.posthogProjectToken ?? '') as string;
const posthogHost = (Constants.expoConfig?.extra?.posthogHost ?? '') as string;

let posthogClient: PostHog;
if (posthogProjectToken) {
  posthogClient = new PostHog(posthogProjectToken, {
    host: posthogHost || undefined,
  });
} else {
  console.warn('[posthog] POSTHOG_PROJECT_TOKEN missing — analytics disabled');
  posthogClient = new Proxy({} as PostHog, {
    get: () => () => undefined,
  });
}

export const posthog = posthogClient;
