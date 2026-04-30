import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import 'react-native-get-random-values';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { v4 as uuidv4 } from 'uuid';

import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { useAuth } from '@/contexts/AuthContext';
import { getLocalDateString } from '@/lib/dateUtils';
import * as Haptics from '@/lib/haptics';
import { posthog } from '@/lib/posthog';
import { sendSessionEvent } from '@/lib/tinybird';
import { useAppLockStore } from '@/store/useAppLockStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';
import { useRecordingStore } from '@/store/useRecordingStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useTaskStore } from '@/store/useTaskStore';

const RING_SIZE = 300;
const RING_RADIUS = 140;
const RING_INNER_RADIUS = 100;

function formatElapsed(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export default function StopwatchScreen() {
  useKeepAwake();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const isSessionActive = useRecordingStore((s) => s.isSessionActive);
  const isFinishing = useRecordingStore((s) => s.isFinishing);
  const activeTaskId = useRecordingStore((s) => s.activeTaskId);
  const setIsSessionActive = useRecordingStore((s) => s.setIsSessionActive);
  const setIsFinishing = useRecordingStore((s) => s.setIsFinishing);

  const activeTask = useTaskStore((s) =>
    s.tasks.find((t) => t.id === activeTaskId),
  );

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const isActiveRef = useRef(false);

  // Keep the elapsed counter steady if the user foregrounds/backgrounds —
  // recompute from wall-clock when returning to foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isActiveRef.current && sessionStartRef.current) {
        const secs = Math.floor(
          (Date.now() - sessionStartRef.current.getTime()) / 1000,
        );
        elapsedRef.current = secs;
        setElapsedSeconds(secs);
      }
    });
    return () => sub.remove();
  }, []);

  // Timer tick
  useEffect(() => {
    if (isSessionActive) {
      intervalRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSeconds(elapsedRef.current);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSessionActive]);

  // Cleanup on unmount — release the recording flag if we leave mid-session.
  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        setIsSessionActive(false);
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [setIsSessionActive]);

  const handleStart = useCallback(() => {
    elapsedRef.current = 0;
    setElapsedSeconds(0);
    sessionStartRef.current = new Date();
    isActiveRef.current = true;
    setIsSessionActive(true);
    Haptics.sessionStart();
    posthog.capture('session_started', { mode: 'stopwatch' });
  }, [setIsSessionActive]);

  const handleStop = useCallback(async () => {
    const endTime = new Date();
    const startTime = sessionStartRef.current || endTime;
    const lockedInSeconds = elapsedRef.current;

    isActiveRef.current = false;
    setIsSessionActive(false);
    setIsFinishing(true);
    Haptics.sessionStop();

    const sessionId = uuidv4();
    const dateStr = getLocalDateString(startTime);

    useSessionStore.getState().addSession({
      session_id: sessionId,
      date: dateStr,
      total_locked_in_seconds: lockedInSeconds,
      created_at: endTime.toISOString(),
      time_started: startTime.toISOString(),
      time_ended: endTime.toISOString(),
    });

    posthog.capture('session_completed', {
      mode: 'stopwatch',
      locked_in_seconds: lockedInSeconds,
      duration_seconds: Math.round((endTime.getTime() - startTime.getTime()) / 1000),
    });

    useAppLockStore.getState().creditEarnedTime(lockedInSeconds);
    useProfileStatsStore.getState().recomputeFromSessions(user?.id);

    sendSessionEvent({
      session_id: sessionId,
      user_id: user?.id ?? 'anonymous',
      date: dateStr,
      time_started: startTime.toISOString(),
      time_ended: endTime.toISOString(),
      total_locked_in_seconds: lockedInSeconds,
      timestamp: endTime.toISOString(),
    }).catch((err) => {
      console.warn('[Stopwatch] Tinybird send FAILED:', err);
    });

    setIsFinishing(false);

    router.push({
      pathname: '/grind-complete',
      params: {
        grindDurationSeconds: String(lockedInSeconds),
        lockedInSeconds: String(lockedInSeconds),
        ...(activeTaskId ? { activeTaskId } : {}),
      },
    } as any);
  }, [user, setIsSessionActive, setIsFinishing, router, activeTaskId]);

  const handleExit = useCallback(() => {
    // No confirm — just leave. Session flag gets cleared on unmount.
    router.back();
  }, [router]);

  const canExit = !isSessionActive && !isFinishing;
  const earnedMinutes = Math.round(elapsedSeconds / 60);
  const progress = isSessionActive ? Math.min(elapsedSeconds / 3600, 1) : 0; // 1hr arc
  const circumference = 2 * Math.PI * RING_RADIUS;
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={LC.bg} />

      {/* Top chrome */}
      <View style={[styles.topChrome, { paddingTop: insets.top + 12 }]}>
        {canExit ? (
          <Pressable
            onPress={handleExit}
            style={({ pressed }) => [styles.exitBtn, pressed && styles.pressed]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Exit stopwatch"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M6 6l12 12M18 6L6 18" stroke={LC.text} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </Pressable>
        ) : (
          <View style={styles.exitBtn} />
        )}

        <View style={styles.recPill}>
          <View style={[styles.recDot, isSessionActive && styles.recDotActive]} />
          <Text style={styles.recPillText}>
            {isSessionActive ? 'LOCKED IN · STOPWATCH' : 'STOPWATCH · IDLE'}
          </Text>
        </View>
      </View>

      {/* Task pill (if any) */}
      {activeTask ? (
        <View style={styles.taskPillWrap}>
          <View style={styles.taskPill}>
            <View style={styles.taskDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.taskEyebrow}>CURRENT TASK</Text>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {activeTask.title}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Center timer */}
      <View style={styles.center}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringAbs}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={LC.border}
            strokeWidth={1}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={(RING_RADIUS + RING_INNER_RADIUS) / 2}
            stroke={LC.border}
            strokeWidth={1}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_INNER_RADIUS}
            stroke={LC.border}
            strokeWidth={1}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={LC.red}
            strokeWidth={2}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
          {Array.from({ length: 60 }).map((_, i) => {
            const a = (i * 6 * Math.PI) / 180;
            const major = i % 5 === 0;
            const r1 = RING_RADIUS + 12;
            const r2 = major ? RING_RADIUS + 18 : RING_RADIUS + 15;
            const cx = RING_SIZE / 2;
            const cy = RING_SIZE / 2;
            return (
              <Line
                key={i}
                x1={cx + Math.cos(a) * r1}
                y1={cy + Math.sin(a) * r1}
                x2={cx + Math.cos(a) * r2}
                y2={cy + Math.sin(a) * r2}
                stroke={major ? LC.textDim : LC.textMute}
                strokeWidth={major ? 1.5 : 0.8}
              />
            );
          })}
        </Svg>

        <View style={styles.centerText}>
          <Text style={styles.elapsedEyebrow}>ELAPSED</Text>
          <Text style={styles.elapsedValue}>{formatElapsed(elapsedSeconds)}</Text>
          {isSessionActive && earnedMinutes > 0 ? (
            <Text style={styles.unlockedText}>
              +{earnedMinutes} MIN UNLOCKED
            </Text>
          ) : !isSessionActive && elapsedSeconds === 0 ? (
            <Text style={styles.idleHint}>TAP START TO LOCK IN</Text>
          ) : null}
        </View>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        {!isSessionActive ? (
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [styles.bigStartBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Start stopwatch"
          >
            <Text style={styles.bigStartLabel}>START</Text>
          </Pressable>
        ) : (
          <View style={styles.activeRow}>
            <View style={styles.sideBtn} />
            <Pressable
              onPress={handleStop}
              style={({ pressed }) => [styles.stopBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Stop and save session"
            >
              <View style={styles.stopSquare} />
            </Pressable>
            <Pressable
              onPress={handleStop}
              style={({ pressed }) => [styles.endBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="End"
            >
              <Text style={styles.endLabel}>END</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LC.bg,
  },
  topChrome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  recPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,59,92,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.25)',
  },
  recDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: LC.textMute,
  },
  recDotActive: {
    backgroundColor: LC.red,
    shadowColor: LC.red,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  recPillText: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 10,
    color: LC.red,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  // Task pill
  taskPillWrap: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  taskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: LC.red,
  },
  taskEyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    color: LC.textMute,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  taskTitle: {
    fontFamily: Fonts.interMedium,
    fontSize: 14,
    color: LC.text,
    marginTop: 2,
  },
  // Center
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringAbs: {
    position: 'absolute',
  },
  centerText: {
    alignItems: 'center',
    position: 'relative',
  },
  elapsedEyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.5,
    color: LC.textMute,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  elapsedValue: {
    fontFamily: Fonts.display,
    fontSize: 72,
    lineHeight: 84,
    color: LC.text,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  unlockedText: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    color: LC.red,
    letterSpacing: 1.5,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  idleHint: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    color: LC.textMute,
    letterSpacing: 2,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  // Bottom controls
  bottomControls: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  bigStartBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: LC.red,
    borderWidth: 4,
    borderColor: LC.bg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  bigStartLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: '#fff',
    letterSpacing: 2,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  sideBtn: {
    width: 56,
    height: 56,
  },
  stopBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: LC.red,
    borderWidth: 4,
    borderColor: LC.bg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  stopSquare: {
    width: 26,
    height: 26,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  endBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endLabel: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 10,
    color: LC.textDim,
    letterSpacing: 1.5,
  },
});
