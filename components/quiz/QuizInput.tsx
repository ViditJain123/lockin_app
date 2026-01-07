import React, { useState } from 'react';
import {
    StyleSheet,
    TextInput,
    TextInputProps
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { BrandColors } from '../../constants/BrandColors';
import { Fonts } from '../../constants/Fonts';

interface QuizInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/**
 * QuizInput - Styled text input for quiz questions
 * Features dark background, focus animation, and brand-themed styling
 */
export default function QuizInput({
  value,
  onChangeText,
  placeholder = 'Name',
  ...props
}: QuizInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(0, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: borderColor.value === 1
        ? BrandColors.input.borderFocused
        : BrandColors.input.border,
    };
  }, []);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={BrandColors.input.placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        {...props}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BrandColors.input.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.input.border,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 17,
    fontFamily: Fonts.regular,
    color: BrandColors.input.text,
  },
});
