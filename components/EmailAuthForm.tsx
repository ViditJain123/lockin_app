import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Fonts } from '../constants/Fonts';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'sign-in' | 'sign-up' | 'reset';

interface EmailAuthFormProps {
  onSubmitStart?: () => void;
  onSubmitEnd?: () => void;
}

export default function EmailAuthForm({ onSubmitStart, onSubmitEnd }: EmailAuthFormProps) {
  const { signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    reset();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Enter your email.');
      return;
    }
    if (mode !== 'reset' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    onSubmitStart?.();
    try {
      if (mode === 'sign-in') {
        await signInWithEmail(trimmedEmail, password);
      } else if (mode === 'sign-up') {
        const { needsEmailConfirmation } = await signUpWithEmail(trimmedEmail, password);
        if (needsEmailConfirmation) {
          setInfo('Check your email to confirm your account, then sign in.');
          setMode('sign-in');
          setPassword('');
        }
      } else {
        await sendPasswordReset(trimmedEmail);
        setInfo('If an account exists, a reset link is on its way.');
        setMode('sign-in');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      setError(message);
    } finally {
      setIsLoading(false);
      onSubmitEnd?.();
    }
  };

  const submitLabel =
    mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Create account' : 'Send reset link';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.wrapper}
    >
      <View style={styles.field}>
        <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.5)" />
        <TextInput
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            reset();
          }}
          placeholder="Email"
          placeholderTextColor="rgba(255,255,255,0.4)"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          style={styles.input}
          editable={!isLoading}
        />
      </View>

      {mode !== 'reset' && (
        <View style={styles.field}>
          <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.5)" />
          <TextInput
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              reset();
            }}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            textContentType={mode === 'sign-in' ? 'password' : 'newPassword'}
            style={styles.input}
            editable={!isLoading}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />
          <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="rgba(255,255,255,0.5)"
            />
          </Pressable>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <Pressable
        style={({ pressed }) => [styles.submit, pressed && styles.submitPressed]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#0E0E0E" />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </Pressable>

      <View style={styles.linksRow}>
        {mode === 'sign-in' ? (
          <>
            <Pressable
              onPress={() => {
                reset();
                setMode('sign-up');
              }}
            >
              <Text style={styles.link}>Create account</Text>
            </Pressable>
            <Text style={styles.linkSep}>·</Text>
            <Pressable
              onPress={() => {
                reset();
                setMode('reset');
              }}
            >
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => {
              reset();
              setMode('sign-in');
            }}
          >
            <Text style={styles.link}>Back to sign in</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 10,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontFamily: Fonts.regular,
    padding: 0,
  },
  submit: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 4,
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitText: {
    color: '#0E0E0E',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  link: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  linkSep: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  error: {
    color: '#FF8533',
    fontSize: 13,
    fontFamily: Fonts.regular,
    paddingHorizontal: 4,
  },
  info: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontFamily: Fonts.regular,
    paddingHorizontal: 4,
  },
});
