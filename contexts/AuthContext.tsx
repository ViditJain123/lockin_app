import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';

import { supabase } from '../lib/supabase';
import { useSubscriptionStore } from '../store/useSubscriptionStore';

// Types
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle app state changes for token refresh
  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
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
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event);
        setSession(session);
        if (!isInitialized) setIsInitialized(true);

        // Handle OAuth callback
        if (event === 'SIGNED_IN' && session) {
          // Close any open auth session browser (ignore errors if already closed)
          try {
            await WebBrowser.dismissBrowser();
          } catch {
            // Browser was already dismissed, which is fine
          }

          // Login to RevenueCat with user ID for subscription syncing
          console.log('[Auth] Logging in to RevenueCat with user ID:', session.user.id);
          await useSubscriptionStore.getState().loginUser(session.user.id);
        }

        // Handle sign out - logout from RevenueCat
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] Logging out from RevenueCat');
          await useSubscriptionStore.getState().logoutUser();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Handle deep links for OAuth callback
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      
      console.log('[Auth] Deep link received:', url);
      
      // Check for auth callback - support both formats
      if (url.includes('auth-callback') || url.includes('auth/callback') || url.includes('#access_token')) {
        console.log('[Auth] Processing auth callback');
        
        // Extract tokens from URL
        const params = extractHashParams(url);
        
        console.log('[Auth] Deep link params:', Object.keys(params));
        
        if (params.access_token && params.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          
          if (error) {
            console.error('[Auth] Error setting session from deep link:', error);
            Alert.alert('Authentication Error', error.message);
          } else {
            console.log('[Auth] Session set from deep link successfully');
          }
        } else {
          console.log('[Auth] No tokens in deep link, checking Supabase session...');
          // Sometimes Supabase handles the session automatically
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log('[Auth] Session found from Supabase');
            setSession(sessionData.session);
          }
        }
      }
    };

    // Handle initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[Auth] Initial deep link URL:', url);
        handleDeepLink({ url });
      }
    });

    // Listen for incoming deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  // Sign in with Google using Supabase OAuth
  const signInWithGoogle = async () => {
    try {
      // Create redirect URL using the app scheme
      // This generates: lockinapp://auth/callback (based on scheme in app.json)
      const redirectUrl = Linking.createURL('auth-callback');
      
      console.log('[Auth] OAuth redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        console.log('[Auth] Opening OAuth URL:', data.url);
        
        // Open the OAuth URL in a web browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
          {
            showInRecents: true,
            preferEphemeralSession: false,
          }
        );

        console.log('[Auth] OAuth result type:', result.type);
        
        if (result.type === 'success' && result.url) {
          console.log('[Auth] OAuth callback URL:', result.url);
          
          // Handle the redirect URL
          const params = extractHashParams(result.url);
          
          console.log('[Auth] Extracted params:', Object.keys(params));
          
          if (params.access_token && params.refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            
            if (sessionError) {
              throw sessionError;
            }
            console.log('[Auth] Session set successfully');
          } else {
            console.warn('[Auth] Missing tokens in callback. Params:', params);
            // Try to get session from Supabase (it may have been set automatically)
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
              console.log('[Auth] Session found after callback');
              setSession(sessionData.session);
            }
          }
        } else if (result.type === 'cancel') {
          console.log('[Auth] User cancelled authentication');
        } else if (result.type === 'dismiss') {
          console.log('[Auth] Browser dismissed');
        }
      }
    } catch (error) {
      console.error('[Auth] Google sign-in error:', error);
      if (error instanceof Error) {
        Alert.alert('Sign In Error', error.message);
      }
    }
  };

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

  // Sign out
  const signOut = async () => {
    try {
      // Logout from RevenueCat and reset subscription state
      await useSubscriptionStore.getState().logoutUser();
      useSubscriptionStore.getState().reset();

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
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
    signInWithGoogle,
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

// Helper function to extract hash parameters from URL
function extractHashParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  
  // Check for hash fragment
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    const hash = url.substring(hashIndex + 1);
    const pairs = hash.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
  }
  
  // Also check for query parameters (some OAuth flows use these)
  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) {
    const query = url.substring(queryIndex + 1).split('#')[0];
    const pairs = query.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
  }
  
  return params;
}
