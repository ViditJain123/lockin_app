import AddTaskModal from '@/components/tasks/AddTaskModal';
import TaskCard from '@/components/tasks/TaskCard';
import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { useTaskStore, Task } from '@/store/useTaskStore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const tasks = useTaskStore((s) => s.tasks);
  const hasHydrated = useTaskStore((s) => s.hasHydrated);
  const performDailyReset = useTaskStore((s) => s.performDailyReset);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (hasHydrated) performDailyReset();
  }, [hasHydrated, performDailyReset]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && useTaskStore.getState().hasHydrated) {
        useTaskStore.getState().performDailyReset();
      }
    });
    return () => sub.remove();
  }, []);

  const { openTasks, completedTasks } = useMemo(() => {
    const open: Task[] = [];
    const done: Task[] = [];
    for (const t of tasks) {
      (t.isCompleted ? done : open).push(t);
    }
    return { openTasks: open, completedTasks: done };
  }, [tasks]);

  const handleAdd = useCallback(() => setModalVisible(true), []);
  const handleClose = useCallback(() => setModalVisible(false), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          {openTasks.length > 0
            ? `TODAY · ${openTasks.length} LEFT`
            : 'TODAY · ALL CLEAR'}
        </Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>THE HIT LIST</Text>
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Add task"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5v14M5 12h14"
                stroke="#fff"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyBox}>
              <Text style={styles.emptyLabel}>no tasks yet</Text>
            </View>
            <Text style={styles.emptySub}>
              Tap + to add your first hit.
            </Text>
          </View>
        ) : (
          <>
            {openTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}

            {completedTasks.length > 0 && (
              <View style={styles.clearedSection}>
                <View style={styles.clearedHeader}>
                  <Text style={styles.clearedEyebrow}>
                    CLEARED · {completedTasks.length}
                  </Text>
                  <View style={styles.clearedLine} />
                </View>
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <AddTaskModal visible={modalVisible} onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LC.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  eyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  titleRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 42,
    lineHeight: 50,
    color: LC.text,
    letterSpacing: 0.5,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: LC.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  pressed: { opacity: 0.7 },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  // Cleared section
  clearedSection: {
    marginTop: 18,
  },
  clearedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  clearedEyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  clearedLine: {
    flex: 1,
    height: 1,
    backgroundColor: LC.border,
  },
  // Empty state
  emptyWrap: {
    paddingTop: 32,
    paddingHorizontal: 4,
    gap: 12,
    alignItems: 'center',
  },
  emptyBox: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: LC.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  emptySub: {
    fontFamily: Fonts.interRegular,
    fontSize: 13,
    color: LC.textMute,
    textAlign: 'center',
  },
});
