import Button3D from '@/components/Button3D';
import { BrandColors } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { useTaskStore } from '@/store/useTaskStore';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddTaskModal({ visible, onClose }: AddTaskModalProps) {
  const insets = useSafeAreaInsets();
  const addTask = useTaskStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDaily, setIsDaily] = useState(false);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(trimmed, description.trim(), isDaily);
    setTitle('');
    setDescription('');
    setIsDaily(false);
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setIsDaily(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>New Task</Text>

          {/* Title input */}
          <TextInput
            style={styles.input}
            placeholder="Task title"
            placeholderTextColor={BrandColors.input.placeholder}
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="next"
          />

          {/* Description input */}
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Description (optional)"
            placeholderTextColor={BrandColors.input.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            returnKeyType="done"
          />

          {/* Daily toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Repeat daily</Text>
            <Switch
              value={isDaily}
              onValueChange={setIsDaily}
              trackColor={{ false: '#3A3A3C', true: '#FF3B5C' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Submit */}
          <View style={styles.buttonContainer}>
            <Button3D
              title="Add Task"
              onPress={handleSubmit}
              disabled={title.trim().length === 0}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: Fonts.interBold,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  input: {
    backgroundColor: BrandColors.input.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.input.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: BrandColors.input.text,
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: 8,
  },
});
