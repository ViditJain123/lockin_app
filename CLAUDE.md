# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` - Start Expo dev server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android
- `npx expo prebuild` - Regenerate native projects after config changes
- `eas build --profile development` - Development build (internal distribution)
- `eas build --profile testflight` - TestFlight build

No test runner is configured.

## Architecture

**Lockin Club** is a React Native (Expo SDK 54, React 19) productivity app. Users record timelapse sessions with face detection to track focus, earn badges, and maintain streaks.

### Tech Stack
- **Routing**: Expo Router v6 with typed routes
- **State**: Zustand stores in `/store` (badges, subscriptions, onboarding, profile stats, recording, video gallery)
- **Auth**: Apple Sign-In via Supabase, managed in `contexts/AuthContext.tsx` with AsyncStorage session persistence and offline recovery
- **Backend**: Supabase (auth + database), Tinybird (analytics ingestion + aggregated stats), RevenueCat (subscriptions)
- **Camera**: `react-native-vision-camera` with face detection worklet for distraction tracking (eye-open threshold 0.4, frame capture every 12s)
- **Animations**: Reanimated + Gesture Handler

### Navigation Structure
- **Root** (`app/_layout.tsx`): Auth stack (AuthScreen → Onboarding → Main)
- **Tabs** (`app/(tabs)/_layout.tsx`): NativeTabs with 4 tabs — analytics, tasks, profile, camera (index)
- **Modals**: `app/modal.tsx`, `app/trophies-page.tsx`

### Key Directories
- `app/` — Expo Router routes
- `components/` — UI components (quiz screens in `components/quiz/questions/`)
- `contexts/` — AuthContext (single context for auth + session)
- `store/` — Zustand stores
- `lib/` — Services: `supabase.ts`, `tinybird.ts`, `notificationService.ts`, `haptics.ts`, `config.ts` (dev toggles), `badgeAssetCache.ts`
- `constants/` — Badge definitions (`Badges.ts`), theme colors, fonts
- `pipes/` — Tinybird SQL query definitions
- `supabase/migrations/` — Database schema

### Badge System
23 badges across 3 categories (hours, grinds, streak) defined in `constants/Badges.ts`. Badge images in `assets/images/` with underscore-separated filenames. `useBadgeStore` handles eligibility checking and trophy modal triggers.

### Dev Toggles (`lib/config.ts`)
- `ONBOARDING_DEV_MODE`: 'skip' | 'force' | 'normal'
- `NOTIFICATION_DEV_MODE_ENABLED`: boolean (5 test notifications vs 30-day cycle)

## Conventions
- TypeScript strict mode, path alias `@/*` maps to project root
- Portrait-only orientation, dark theme UI
- SVGs handled via `react-native-svg-transformer` (metro.config.js)
- Babel plugins: `react-native-worklets-core/plugin`, `react-native-reanimated/plugin`
- iOS minimum: 15.5, New Architecture enabled
- No REST abstraction layer — direct Supabase client and fetch calls to Tinybird

- You have to write all the migrations in supabase/migrations folder that we already have. Number it one by one!