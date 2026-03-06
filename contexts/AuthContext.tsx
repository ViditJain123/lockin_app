import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';

import { supabase } from '../lib/supabase';
import { upsertUserRow } from '../lib/supabaseUser';
import { useBadgeStore } from '../store/useBadgeStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useOnboardingStore } from '../store/useOnboardingStore';

// Types
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
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

  // Listen for auth state changes - the INITIAL_SESSION event fires
  // asynchronously once the cached session is restored from AsyncStorage
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] Auth state changed:', event);

        if (event === 'INITIAL_SESSION') {
          // Always trust the initial session from storage
          setSession(newSession);
          if (newSession) lastValidSession.current = newSession;
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
            // Ensure a users row exists in Supabase
            upsertUserRow(newSession.user.id, {}).catch((err) =>
              console.warn('[Auth] Failed to upsert user row:', err)
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

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          throw error;
        }

        console.log('[Auth] Apple Sign-In successful');

        // Optionally update user metadata with name from Apple (only provided on first sign-in)
        if (credential.fullName && (credential.fullName.givenName || credential.fullName.familyName)) {
          const fullName = [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(' ');

          if (fullName && data.user) {
            await supabase.auth.updateUser({
              data: { full_name: fullName },
            });
            console.log('[Auth] Updated user name from Apple:', fullName);
          }
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

  // Clear all user-specific data on logout for data isolation between accounts
  const clearAllUserData = () => {
    useOnboardingStore.getState().clearQuizAnswers();
    useBadgeStore.getState().resetBadges();
  };

  // Sign out
  const signOut = async () => {
    try {
      isSigningOut.current = true;

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

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    isInitialized,
    signInWithApple,
    signOut,
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
