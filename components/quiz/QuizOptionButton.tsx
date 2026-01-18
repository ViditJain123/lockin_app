import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandColors } from '../../constants/BrandColors';
import { Fonts } from '../../constants/Fonts';
import { optionSelect } from '../../lib/haptics';

interface QuizOptionButtonProps {
  label: string;
  icon?: string;
  iconComponent?: ReactNode;
  selected: boolean;
  onPress: () => void;
}

/**
 * QuizOptionButton - Selectable option button for quiz multi-select questions
 * Shows a checkbox-style indicator and highlights when selected
 */
export default function QuizOptionButton({
  label,
  icon,
  iconComponent,
  selected,
  onPress,
}: QuizOptionButtonProps) {
  return (
    <Pressable
      onPress={() => {
        optionSelect();
        onPress();
      }}
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && styles.containerPressed,
      ]}
    >
      {/* Icon on the left - supports both emoji strings and icon components */}
      {(icon || iconComponent) && (
        <View style={[styles.iconContainer, selected && styles.iconContainerSelected]}>
          {iconComponent ? iconComponent : <Text style={styles.iconText}>{icon}</Text>}
        </View>
      )}

      {/* Label */}
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={2}>
        {label}
      </Text>

      {/* Checkbox indicator on the right */}
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.input.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BrandColors.input.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  containerSelected: {
    borderColor: BrandColors.primary.main,
    backgroundColor: 'rgba(255, 59, 92, 0.1)',
  },
  containerPressed: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(255, 59, 92, 0.2)',
  },
  iconText: {
    fontSize: 18,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: BrandColors.text.primary,
  },
  labelSelected: {
    color: BrandColors.text.primary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: BrandColors.primary.main,
    backgroundColor: BrandColors.primary.main,
  },
});
