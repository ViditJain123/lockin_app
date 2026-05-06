# Android setup

One-time setup steps a human has to do — these can't be automated because they live in third-party consoles.

## 0. Supabase — enable email auth

Email/password is the universal sign-in method (Apple Sign-In stays iOS-only).

1. Supabase dashboard → **Authentication** → **Providers** → **Email**: enable.
2. **Confirm email** toggle:
   - **On** = users must click a confirmation link before they can sign in. The signup form will surface a "check your email" message.
   - **Off** = signup creates a session immediately and the app drops the user into onboarding. Faster UX, slightly weaker spam protection.
   - Recommended: **On** for production, **Off** for dev.
3. **Authentication** → **Email Templates** → **Reset password**: set the redirect URL. Use the app deep link `lockinapp://reset-password` once that screen exists, or your marketing site for now.
4. **Authentication** → **URL Configuration**: add `lockinapp://*` to the allowed redirect URLs list.


## 1. Firebase project + FCM

`expo-notifications` uses FCM on Android. Without `google-services.json`, the Android build will fail.

1. Open https://console.firebase.google.com → **Add project** → name it "Lockin Club" (or use an existing project).
2. **Add app** → Android → package name **`com.lockin.club`** → register.
3. Download `google-services.json` and drop it at the repo root: `lockin_app/google-services.json`. It's gitignored.
4. Add this line to `app.json` under `expo.android` (it was removed during initial setup so prebuild wouldn't fail without the file):
   ```json
   "googleServicesFile": "./google-services.json",
   ```
5. Re-run `npx expo prebuild --platform android --clean` to regenerate `android/` with FCM wiring.
6. In Firebase project settings → **Cloud Messaging** tab, copy the **Server key** (or set up the FCM v1 service account JSON).
7. Upload that key to Expo: `eas credentials` → Android → push notifications → paste FCM key.

## 2. RevenueCat — Google Play Billing

1. Google Play Console → create app `com.lockin.club` → set up internal testing track.
2. Create in-app products / subscriptions matching the iOS product IDs.
3. RevenueCat dashboard → add Android app → paste the Play service account credentials.
4. Copy the Android API key from the RevenueCat dashboard and replace `REVENUECAT_API_KEY_ANDROID` (currently set to the placeholder `goog_REPLACE_ME`) at the top of `store/useSubscriptionStore.ts`. The iOS key already has its real value.

## 3. Build a dev client

```
eas build --profile development --platform android
```

Install the resulting APK on an emulator or device, then `npm start` — the dev client will load the bundle.

## 4. Internal testing build

```
eas build --profile preview --platform android
```

Distributes via the EAS internal track. Use this for QA on real devices before going to Play Console internal testing.

## 5. Production AAB

```
eas build --profile production --platform android
eas submit --profile production --platform android
```

## Adaptive icon caveat

`app.json` currently points the Android adaptive icon foreground at `./assets/images/logo.jpg`. Adaptive icons should be a transparent PNG with the logo content fitting inside the inner 66dp safe zone (the outer area gets masked). The current JPG will render as a black square (matches the new `#000000` background) — fine as a placeholder, but worth replacing with a properly cropped PNG before launch.
