import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';

import {
  ANDROID_DEFAULT_NAME,
  ANDROID_DEFAULT_USER_ID,
  IS_ANDROID,
} from '../lib/androidDefaultUser';
import { resolveAttribution } from '../lib/attribution';
import { notifyDiscord } from '../lib/discordNotify';
import { posthog } from '../lib/posthog';
import { supabase } from '../lib/supabase';
import { upsertUserRow, convertSleepTimeTo24h } from '../lib/supabaseUser';
import { useCrystalStore } from '../store/useCrystalStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useTaskStore } from '../store/useTaskStore';

// Fake Supabase session used on Android. Android has no signup/auth flow —
// every install shares this hardcoded identity and never talks to Supabase auth.
const ANDROID_MOCK_SESSION: Session = {
  access_token: 'android-local',
  refresh_token: 'android-local',
  token_type: 'bearer',
  expires_in: 0,
  expires_at: 0,
  user: {
    id: ANDROID_DEFAULT_USER_ID,
    email: undefined,
    created_at: new Date(0).toISOString(),
    user_metadata: { full_name: ANDROID_DEFAULT_NAME },
    app_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
  } as User,
};

// Types
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isSigningOut = useRef(false);
  const lastValidSession = useRef<Session | null>(null);
  const recoveryUnsubscribe = useRef<NetInfoSubscription | null>(null);
  const recoveryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Apple returns fullName only on the very first sign-in for this bundle ID.
  // We stash it the moment we get it so a later failure (network blip during
  // signInWithIdToken / updateUser) doesn't lose the one-shot value forever.
  const pendingAppleName = useRef<string | null>(null);

  // Schedule session recovery when SIGNED_OUT happens while offline
  const scheduleSessionRecovery = () => {
    // Clean up any existing recovery listener
    if (recoveryUnsubscribe.current) {
      recoveryUnsubscribe.current();
      recoveryUnsubscribe.current = null;
    }
    if (recoveryTimeout.current) {
      clearTimeout(recoveryTimeout.current);
      recoveryTimeout.current = null;
    }

    console.log('[Auth] Scheduling session recovery for when network returns');

    recoveryUnsubscribe.current = NetInfo.addEventListener(async (state) => {
      if (!state.isConnected || !state.isInternetReachable) return;

      console.log('[Auth] Network restored, attempting session recovery');
      // Clean up listener immediately
      if (recoveryUnsubscribe.current) {
        recoveryUnsubscribe.current();
        recoveryUnsubscribe.current = null;
      }
      if (recoveryTimeout.current) {
        clearTimeout(recoveryTimeout.current);
        recoveryTimeout.current = null;
      }

      try {
        // Try to restore session from Supabase storage first
        const { data, error } = await supabase.auth.getSession();
        if (data.session) {
          console.log('[Auth] Session recovered from storage');
          setSession(data.session);
          lastValidSession.current = data.session;
          return;
        }

        // Fall back to in-memory last valid session
        if (lastValidSession.current) {
          console.log('[Auth] Attempting recovery with last valid session');
          const { error: setError } = await supabase.auth.setSession({
            access_token: lastValidSession.current.access_token,
            refresh_token: lastValidSession.current.refresh_token,
          });
          if (!setError) {
            console.log('[Auth] Session recovered from last valid session');
            return;
          }
          console.warn('[Auth] Recovery with last valid session failed:', setError.message);
        }

        // Recovery failed — token is truly expired
        console.log('[Auth] Session recovery failed, clearing session');
        setSession(null);
        lastValidSession.current = null;
        await useSubscriptionStore.getState().logoutUser();
      } catch (err) {
        console.error('[Auth] Session recovery error:', err);
        setSession(null);
        lastValidSession.current = null;
      }
    });

    // 5-minute safety timeout to prevent listener leak
    recoveryTimeout.current = setTimeout(() => {
      console.log('[Auth] Session recovery timed out after 5 minutes');
      if (recoveryUnsubscribe.current) {
        recoveryUnsubscribe.current();
        recoveryUnsubscribe.current = null;
      }
      recoveryTimeout.current = null;
      // If we still have no valid session at this point, clear it
      setSession(null);
      lastValidSession.current = null;
    }, 5 * 60 * 1000);
  };

  // Handle app state changes for token refresh (network-aware)
  useEffect(() => {
    if (IS_ANDROID) return;
    const handleAppStateChange = async (state: AppStateStatus) => {
      if (state === 'active') {
        const netState = await NetInfo.fetch();
        if (netState.isConnected && netState.isInternetReachable !== false) {
          supabase.auth.startAutoRefresh();
        } else {
          console.log('[Auth] Skipping auto-refresh — offline');
        }
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Android-only: install the hardcoded mock session synchronously on mount.
  // No Supabase auth listener runs on Android, so this is the only path that
  // populates `session` and flips `isInitialized` for the platform.
  useEffect(() => {
    if (!IS_ANDROID) return;
    setSession(ANDROID_MOCK_SESSION);
    lastValidSession.current = ANDROID_MOCK_SESSION;
    useTaskStore.getState().setUserId(ANDROID_DEFAULT_USER_ID);
    setIsInitialized(true);
  }, []);

  // Listen for auth state changes - the INITIAL_SESSION event fires
  // asynchronously once the cached session is restored from AsyncStorage
  useEffect(() => {
    if (IS_ANDROID) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] Auth state changed:', event);

        if (event === 'INITIAL_SESSION') {
          // Always trust the initial session from storage
          setSession(newSession);
          if (newSession) {
            lastValidSession.current = newSession;
            useTaskStore.getState().setUserId(newSession.user.id);
          }
          if (!isInitialized) setIsInitialized(true);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (newSession) {
            setSession(newSession);
            lastValidSession.current = newSession;
          }
          if (!isInitialized) setIsInitialized(true);

          if (event === 'SIGNED_IN' && newSession) {
            console.log('[Auth] Logging in to RevenueCat with user ID:', newSession.user.id);
            await useSubscriptionStore.getState().loginUser(newSession.user.id);
            useTaskStore.getState().setUserId(newSession.user.id);
            // Identify user in PostHog
            posthog.identify(newSession.user.id, {
              $set: { email: newSession.user.email },
              $set_once: { created_at: newSession.user.created_at },
            });
            posthog.capture('user_signed_in');

            // Resolve identity fields:
            // - email: from auth (real or Apple relay address)
            // - apple_full_name: from the just-stashed credential, falling back to user_metadata
            // - display_name: from the quiz (user-typed)
            const email = newSession.user.email ?? null;
            const appleFullName =
              pendingAppleName.current ??
              (newSession.user.user_metadata?.full_name as string | undefined) ??
              null;
            pendingAppleName.current = null;
            const { sleepTime, targetHours, name } = useOnboardingStore.getState().quizAnswers;
            const displayName = name || appleFullName || null;

            // Notify Discord on new sign-ups (not returning logins) — include name + email
            const isNewUser = Date.now() - new Date(newSession.user.created_at).getTime() < 60_000;
            if (isNewUser) {
              notifyDiscord(
                'signup',
                email ?? 'unknown',
                undefined,
                appleFullName ?? displayName ?? null
              );
            }

            // Ensure a users row exists in Supabase and sync identity + onboarding data.
            // upsertUserRow strips null/undefined so we never clobber an existing server value.
            upsertUserRow(newSession.user.id, {
              email,
              apple_full_name: appleFullName,
              display_name: displayName,
              sleep_time: convertSleepTimeTo24h(sleepTime),
              target_hours: targetHours,
            }).catch((err) =>
              console.warn('[Auth] Failed to upsert user row:', err)
            );
            // Resolve attribution (deep link or deferred fingerprint match)
            resolveAttribution(newSession.user.id).catch((err) =>
              console.warn('[Auth] Attribution resolution failed:', err)
            );
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          if (!isInitialized) setIsInitialized(true);

          // User-initiated sign out — always honour it
          if (isSigningOut.current) {
            console.log('[Auth] User-initiated sign out');
            isSigningOut.current = false;
            setSession(null);
            lastValidSession.current = null;
            return;
          }

          // System-triggered SIGNED_OUT — check network before clearing
          try {
            const netState = await NetInfo.fetch();
            if (!netState.isConnected || netState.isInternetReachable === false) {
              console.log('[Auth] SIGNED_OUT received while offline, keeping session');
              scheduleSessionRecovery();
              return;
            }
          } catch {
            // If NetInfo fails, assume online and proceed with logout
          }

          // Online and token is truly invalid — clear session
          console.log('[Auth] SIGNED_OUT received while online, clearing session');
          setSession(null);
          lastValidSession.current = null;
          console.log('[Auth] Logging out from RevenueCat');
          await useSubscriptionStore.getState().logoutUser();
          return;
        }

        // Fallback for any other events
        setSession(newSession);
        if (newSession) lastValidSession.current = newSession;
        if (!isInitialized) setIsInitialized(true);
      }
    );

    return () => {
      subscription.unsubscribe();
      // Clean up recovery listener on unmount
      if (recoveryUnsubscribe.current) {
        recoveryUnsubscribe.current();
        recoveryUnsubscribe.current = null;
      }
      if (recoveryTimeout.current) {
        clearTimeout(recoveryTimeout.current);
        recoveryTimeout.current = null;
      }
    };
  }, []);

  // Sign in with Apple using native iOS authentication
  const signInWithApple = async () => {
    if (IS_ANDROID) {
      console.log('[Auth] Android uses default account — signInWithApple is a no-op');
      return;
    }
    if (Platform.OS !== 'ios') {
      console.log('[Auth] Apple Sign-In is only available on iOS');
      return;
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('[Auth] Apple Sign-In credential received');

      // Apple gives fullName only on first sign-in — stash it before any Supabase call.
      const appleFullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(' ')
            .trim() || null
        : null;
      if (appleFullName) {
        pendingAppleName.current = appleFullName;
      }

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          throw error;
        }

        console.log('[Auth] Apple Sign-In successful');

        // Mirror Apple's name to user_metadata as a secondary backup
        if (appleFullName && data.user) {
          await supabase.auth.updateUser({
            data: { full_name: appleFullName },
          });
          console.log('[Auth] Updated user name from Apple:', appleFullName);
        }
      } else {
        throw new Error('No identity token received from Apple');
      }
    } catch (error) {
      if (error instanceof Error) {
        // Check if user cancelled
        if ('code' in error && error.code === 'ERR_REQUEST_CANCELED') {
          console.log('[Auth] User cancelled Apple Sign-In');
          return;
        }
        console.error('[Auth] Apple Sign-In error:', error);
        Alert.alert('Sign In Error', error.message);
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (IS_ANDROID) {
      console.log('[Auth] Android uses default account — signInWithEmail is a no-op');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (IS_ANDROID) {
      console.log('[Auth] Android uses default account — signUpWithEmail is a no-op');
      return { needsEmailConfirmation: false };
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    // If Supabase has email confirmations enabled, session is null until the
    // user clicks the confirmation link. Caller surfaces a "check your email"
    // state in that case.
    return { needsEmailConfirmation: !data.session };
  };

  const sendPasswordReset = async (email: string) => {
    if (IS_ANDROID) {
      console.log('[Auth] Android uses default account — sendPasswordReset is a no-op');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
  };

  // Clear all user-specific data on logout for data isolation between accounts
  const clearAllUserData = () => {
    useOnboardingStore.getState().clearQuizAnswers();
    useCrystalStore.getState().resetCrystals();
    useTaskStore.getState().setUserId(null);
  };

  // Sign out
  const signOut = async () => {
    if (IS_ANDROID) {
      console.log('[Auth] Android uses default account — signOut is a no-op');
      return;
    }
    try {
      isSigningOut.current = true;

      posthog.capture('user_signed_out');
      posthog.reset();

      // Clear UI state immediately → shows AuthScreen (avoids paywall flash)
      setSession(null);
      lastValidSession.current = null;

      // Clear all user data stores for data isolation
      clearAllUserData();

      // Logout from RevenueCat and reset subscription state
      await useSubscriptionStore.getState().logoutUser();
      useSubscriptionStore.getState().reset();

      const { error } = await supabase.auth.signOut();
      if (error) {
        isSigningOut.current = false;
        throw error;
      }
    } catch (error) {
      isSigningOut.current = false;
      console.error('Sign out error:', error);
      if (error instanceof Error) {
        Alert.alert('Sign Out Error', error.message);
      }
    }
  };

  // Delete account permanently via edge function
  const deleteAccount = async () => {
    if (IS_ANDROID) {
      console.log('[Auth] Android uses default account — deleteAccount is a no-op');
      return;
    }
    try {
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('No active session');
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token || accessToken;

      const response = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete account');
      }

      // Clear all local state (same as sign out)
      posthog.capture('account_deleted');
      posthog.reset();
      isSigningOut.current = true;
      setSession(null);
      lastValidSession.current = null;
      clearAllUserData();
      await useSubscriptionStore.getState().logoutUser();
      useSubscriptionStore.getState().reset();

      // Sign out locally to clean up Supabase client state
      await supabase.auth.signOut();
    } catch (error) {
      isSigningOut.current = false;
      console.error('[Auth] Delete account error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    isInitialized,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    signOut,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
