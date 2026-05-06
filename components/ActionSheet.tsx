import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '../constants/Fonts';

export interface ActionSheetOption {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  options: ActionSheetOption[];
}

/**
 * Cross-platform bottom sheet with a list of tap actions plus a Cancel.
 * Replaces ActionSheetIOS (which is iOS-only) so Share/Save/Delete works on
 * both platforms. The sheet self-dismisses when an option fires; callers
 * should still flip [visible] back to false to clean up state.
 */
export default function ActionSheet({ visible, onClose, options }: ActionSheetProps) {
  const insets = useSafeAreaInsets();

  const handleSelect = (option: ActionSheetOption) => {
    onClose();
    // Defer so the dismiss animation doesn't race with whatever the option
    // opens (Alert, Share sheet, etc.) — these should appear after the
    // bottom sheet is fully off-screen.
    setTimeout(() => option.onPress(), 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.optionsCard}>
            {options.map((option, idx) => (
              <Pressable
                key={`${option.label}-${idx}`}
                onPress={() => handleSelect(option)}
                style={({ pressed }) => [
                  styles.optionRow,
                  idx < options.length - 1 && styles.optionDivider,
                  pressed && styles.optionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    option.destructive && styles.optionDestructive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancelCard, pressed && styles.optionPressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  optionsCard: {
    backgroundColor: 'rgba(40, 40, 40, 0.97)',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  optionRow: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: Fonts.semiBold,
  },
  optionDestructive: {
    color: '#ff453a',
  },
  cancelCard: {
    backgroundColor: 'rgba(40, 40, 40, 0.97)',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelText: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: Fonts.bold,
  },
});
