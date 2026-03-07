import { Fonts } from '@/constants/Fonts';
import { buttonPress, optionSelect } from '@/lib/haptics';
import { useRecordingStore } from '@/store/useRecordingStore';
import { Task, useTaskStore } from '@/store/useTaskStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const setActiveTaskId = useRecordingStore((s) => s.setActiveTaskId);
  const swipeableRef = useRef<Swipeable>(null);

  const handleToggle = useCallback(() => {
    optionSelect();
    toggleTask(task.id);
  }, [task.id, toggleTask]);

  const handleCameraPress = useCallback(() => {
    buttonPress();
    setActiveTaskId(task.id);
    router.navigate('/(tabs)');
  }, [task.id, setActiveTaskId]);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    deleteTask(task.id);
  }, [task.id, deleteTask]);

  const renderRightActions = () => (
    <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
      <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        <View style={[styles.card, task.isCompleted && styles.cardCompleted]}>
          {/* Checkbox */}
          <TouchableOpacity onPress={handleToggle} style={styles.checkbox}>
            <Ionicons
              name={task.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={26}
              color={task.isCompleted ? '#34C759' : 'rgba(255,255,255,0.4)'}
            />
          </TouchableOpacity>

          {/* Title + Description */}
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, task.isCompleted && styles.titleCompleted]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              {task.isDaily && (
                <View style={styles.dailyBadge}>
                  <Text style={styles.dailyBadgeText}>Daily</Text>
                </View>
              )}
            </View>
            {task.description !== '' && (
              <Text
                style={[styles.description, task.isCompleted && styles.descriptionCompleted]}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            )}
          </View>

          {/* Camera button */}
          {!task.isCompleted && (
            <TouchableOpacity onPress={handleCameraPress} style={styles.cameraButton}>
              <Ionicons name="camera" size={22} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    marginRight: 12,
    padding: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.5)',
  },
  description: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  descriptionCompleted: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.3)',
  },
  dailyBadge: {
    backgroundColor: 'rgba(255, 59, 92, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dailyBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#FF3B5C',
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAction: {
    backgroundColor: '#FF3B5C',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    marginBottom: 10,
    marginLeft: 8,
  },
});
