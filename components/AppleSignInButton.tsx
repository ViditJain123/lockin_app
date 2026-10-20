import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { Fonts } from '../constants/Fonts';
import { useAuth } from '../contexts/AuthContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AppleSignInButtonProps {
  onSignInStart?: () => void;
  onSignInEnd?: () => void;
}

export default function AppleSignInButton({
  onSignInStart,
  onSignInEnd,
}: AppleSignInButtonProps) {
  const { signInWithApple } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Check if Apple Sign-In is available (iOS only)
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAvailable);
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = async () => {
    if (isLoading) return;

    setIsLoading(true);
    onSignInStart?.();

    try {
      await signInWithApple();
    } finally {
      setIsLoading(false);
      onSignInEnd?.();
    }
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(0.8, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  // Only render on iOS when Apple Sign-In is available
  if (Platform.OS !== 'ios' || !isAvailable) {
    return null;
  }

  return (
    <AnimatedPressable
      style={[styles.button, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isLoading}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0E0E0E" />
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="logo-apple" size={22} color="#0E0E0E" />
            </View>
            <Text style={styles.text}>Continue with Apple</Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#0E0E0E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },
  iconContainer: {
    marginRight: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#0E0E0E',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
  },
});
