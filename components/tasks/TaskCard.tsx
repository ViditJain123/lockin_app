import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { buttonPress, optionSelect } from '@/lib/haptics';
import { useRecordingStore } from '@/store/useRecordingStore';
import { Task, useTaskStore } from '@/store/useTaskStore';
import { router } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const setActiveTaskId = useRecordingStore((s) => s.setActiveTaskId);
  const activeTaskId = useRecordingStore((s) => s.activeTaskId);
  const isSessionActive = useRecordingStore((s) => s.isSessionActive);
  const swipeableRef = useRef<Swipeable>(null);

  const isActive = activeTaskId === task.id && isSessionActive;

  const handleToggle = useCallback(() => {
    optionSelect();
    toggleTask(task.id);
  }, [task.id, toggleTask]);

  const handleGrindPress = useCallback(() => {
    buttonPress();
    setActiveTaskId(task.id);
    router.navigate('/(tabs)' as any);
  }, [task.id, setActiveTaskId]);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    deleteTask(task.id);
  }, [task.id, deleteTask]);

  const renderRightActions = () => (
    <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14"
          stroke="#fff"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </TouchableOpacity>
  );

  // ── Completed: minimal strikethrough row ──────────────────────────────
  if (task.isCompleted) {
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Swipeable
          ref={swipeableRef}
          renderRightActions={renderRightActions}
          overshootRight={false}
        >
          <View style={[styles.card, styles.cardCompleted]}>
            <View style={styles.inner}>
              <TouchableOpacity onPress={handleToggle} style={styles.checkBox}>
                <View style={styles.checkBoxDone}>
                  <Svg width={12} height={12} viewBox="0 0 12 12">
                    <Path
                      d="M2 6l3 3 5-6"
                      stroke={LC.bg}
                      strokeWidth={2}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </TouchableOpacity>
              <View style={styles.textContainer}>
                <Text style={styles.titleDone} numberOfLines={1}>
                  {task.title}
                </Text>
              </View>
            </View>
          </View>
        </Swipeable>
      </Animated.View>
    );
  }

  // ── Open task ─────────────────────────────────────────────────────────
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        <View style={[styles.card, isActive && styles.cardActive]}>
          {isActive && <View style={styles.activeStripe} />}

          <View style={styles.inner}>
            <TouchableOpacity onPress={handleToggle} style={styles.checkBox}>
              <View
                style={[
                  styles.checkBoxEmpty,
                  isActive && styles.checkBoxActive,
                ]}
              />
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {task.title}
              </Text>
              <View style={styles.metaRow}>
                {task.isDaily && (
                  <>
                    <Text style={styles.metaTag}>DAILY</Text>
                    {(task.description !== '' || isActive) && (
                      <View style={styles.metaDot} />
                    )}
                  </>
                )}
                {isActive ? (
                  <Text style={styles.metaActive}>● GRINDING</Text>
                ) : task.description !== '' ? (
                  <Text style={styles.metaDesc} numberOfLines={1}>
                    {task.description}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* GRIND / PAUSE rail button */}
          <TouchableOpacity
            onPress={handleGrindPress}
            style={[styles.grindBtn, isActive && styles.grindBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={isActive ? 'Pause grind' : 'Start grind for this task'}
          >
            {isActive ? (
              <>
                <View style={styles.pauseIcon}>
                  <View style={styles.pauseBar} />
                  <View style={styles.pauseBar} />
                </View>
                <Text style={styles.grindLabelActive}>PAUSE</Text>
              </>
            ) : (
              <>
                <Svg width={10} height={14} viewBox="0 0 10 14">
                  <Path d="M1 1l8 6-8 6V1z" fill={LC.text} />
                </Svg>
                <Text style={styles.grindLabel}>GRIND</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  cardActive: {
    backgroundColor: 'rgba(255,59,92,0.06)',
    borderColor: 'rgba(255,59,92,0.3)',
  },
  cardCompleted: {
    backgroundColor: 'transparent',
    opacity: 0.55,
  },
  activeStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: LC.red,
    zIndex: 1,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  checkBox: { padding: 2 },
  checkBoxEmpty: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: LC.borderStrong,
    backgroundColor: 'transparent',
  },
  checkBoxActive: {
    borderColor: LC.red,
  },
  checkBoxDone: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: LC.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: Fonts.interMedium,
    fontSize: 14,
    color: LC.text,
  },
  titleDone: {
    fontFamily: Fonts.interRegular,
    fontSize: 14,
    color: LC.textDim,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  metaTag: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  metaDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: LC.textMute,
  },
  metaDesc: {
    fontFamily: Fonts.interRegular,
    fontSize: 12,
    color: LC.textDim,
    flexShrink: 1,
  },
  metaActive: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: LC.red,
    textTransform: 'uppercase',
  },
  // Grind rail
  grindBtn: {
    width: 56,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 1,
    borderLeftColor: LC.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  grindBtnActive: {
    backgroundColor: LC.red,
    borderLeftColor: 'rgba(0,0,0,0.15)',
  },
  grindLabel: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 8,
    color: LC.textDim,
    letterSpacing: 1,
  },
  grindLabelActive: {
    fontFamily: Fonts.monoBold,
    fontSize: 8,
    color: '#fff',
    letterSpacing: 1,
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 2,
  },
  pauseBar: {
    width: 3,
    height: 12,
    backgroundColor: '#fff',
  },
  // Delete swipe action
  deleteAction: {
    backgroundColor: LC.red,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    marginBottom: 8,
    marginLeft: 8,
  },
});
