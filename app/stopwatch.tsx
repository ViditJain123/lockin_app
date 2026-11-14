import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import 'react-native-get-random-values';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { v4 as uuidv4 } from 'uuid';

import CountdownOverlay from '@/components/CountdownOverlay';
import { formatHM, REELS_PER_MINUTE } from '@/components/dashboard/TodayCard';
import Mascot from '@/components/Mascot';
import FocusSoundPicker from '@/components/session/FocusSoundPicker';
import SessionModeSwitch from '@/components/session/SessionModeSwitch';
import SessionToast from '@/components/session/SessionToast';
import ShutterButton from '@/components/session/ShutterButton';
import { useSessionMilestones } from '@/components/session/useSessionMilestones';
import { Fonts } from '@/constants/Fonts';
import { cardShadow, T } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { getLocalDateString } from '@/lib/dateUtils';
import * as Haptics from '@/lib/haptics';
import { posthog } from '@/lib/posthog';
import { playFocusSound, stopFocusSound } from '@/lib/focusSound';
import { playSound } from '@/lib/sound';
import { sendSessionEvent } from '@/lib/tinybird';
import { useAppLockStore } from '@/store/useAppLockStore';
import { usePrefsStore } from '@/store/usePrefsStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';
import { useRecordingStore } from '@/store/useRecordingStore';
import { useSessionStore } from '@/store/useSessionStore';

const RING = 248;
const RING_STROKE = 8;
const AMBIENT_AFTER_MS = 12_000;
const AWAY_NOTIFICATION_ID = 'phone-down-away';

function formatElapsed(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

/**
 * Phone-down mode: a lock-in without the camera. Only time spent with Lockin
 * open counts — leaving the app pauses the session, and coming back tells you
 * how long you were gone. After a few seconds untouched the screen dims to a
 * quiet ambient clock so the phone can sit face-up on the desk.
 */
export default function PhoneDownScreen() {
  useKeepAwake();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const isSessionActive = useRecordingStore((s) => s.isSessionActive);
  const isFinishing = useRecordingStore((s) => s.isFinishing);
  const setIsSessionActive = useRecordingStore((s) => s.setIsSessionActive);
  const setIsFinishing = useRecordingStore((s) => s.setIsFinishing);

  const [isCountingDown, setIsCountingDown] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [awayCount, setAwayCount] = useState(0);
  const [awaySeconds, setAwaySeconds] = useState(0);
  const [ambient, setAmbient] = useState(false);

  // Focused time = accumulated + (now - activeSince) while foregrounded
  const accumulatedMsRef = useRef(0);
  const activeSinceRef = useRef<number | null>(null);
  const awaySinceRef = useRef<number | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const isActiveRef = useRef(false);
  const ambientTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { toast, setToast, goalProgress, todayMinutes, goalMinutes } = useSessionMilestones(
    elapsedSeconds,
    isSessionActive
  );

  const focusedSeconds = useCallback(() => {
    const live = activeSinceRef.current ? Date.now() - activeSinceRef.current : 0;
    return Math.floor((accumulatedMsRef.current + live) / 1000);
  }, []);

  // Tick
  useEffect(() => {
    if (!isSessionActive) return;
    const id = setInterval(() => setElapsedSeconds(focusedSeconds()), 500);
    return () => clearInterval(id);
  }, [isSessionActive, focusedSeconds]);

  // Leaving the app pauses the clock; returning resumes it and says how long you were gone
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (!isActiveRef.current) return;
      if (state !== 'active') {
        if (activeSinceRef.current) {
          accumulatedMsRef.current += Date.now() - activeSinceRef.current;
          activeSinceRef.current = null;
          awaySinceRef.current = Date.now();
        }
        // Only nudge once really backgrounded (not for Control Centre pulls)
        if (state === 'background') {
          Notifications.scheduleNotificationAsync({
            identifier: AWAY_NOTIFICATION_ID,
            content: {
              title: 'Your lock-in is paused',
              body: 'Nothing on there is worth it. Come back and keep the clock running.',
            },
            trigger: null,
          }).catch(() => {});
        }
      } else if (!activeSinceRef.current) {
        activeSinceRef.current = Date.now();
        Notifications.dismissNotificationAsync(AWAY_NOTIFICATION_ID).catch(() => {});
        const gone = awaySinceRef.current ? Math.round((Date.now() - awaySinceRef.current) / 1000) : 0;
        awaySinceRef.current = null;
        // Ignore blips like pulling down Control Centre
        if (gone >= 3) {
          setAwayCount((n) => n + 1);
          setAwaySeconds((s) => s + gone);
          playSound('away');
          Haptics.awayWarning();
          setToast(`You left for ${gone < 60 ? `${gone}s` : formatHM(gone / 60)} · that didn't count`);
          wake();
        }
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ambient dim after a while untouched
  const scheduleAmbient = useCallback(() => {
    if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current);
    ambientTimerRef.current = setTimeout(() => {
      if (isActiveRef.current) setAmbient(true);
    }, AMBIENT_AFTER_MS);
  }, []);

  const wake = useCallback(() => {
    setAmbient(false);
    if (isActiveRef.current) scheduleAmbient();
  }, [scheduleAmbient]);

  // Release the recording flag if we leave mid-session
  useEffect(() => {
    return () => {
      if (isActiveRef.current) setIsSessionActive(false);
      if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current);
      Notifications.dismissNotificationAsync(AWAY_NOTIFICATION_ID).catch(() => {});
    };
  }, [setIsSessionActive]);

  // Never leave the background sound playing after this screen goes away
  useEffect(() => () => {
    stopFocusSound();
  }, []);

  const startSession = useCallback(() => {
    accumulatedMsRef.current = 0;
    activeSinceRef.current = Date.now();
    sessionStartRef.current = new Date();
    isActiveRef.current = true;
    setElapsedSeconds(0);
    setAwayCount(0);
    setAwaySeconds(0);
    setIsSessionActive(true);
    scheduleAmbient();
    playFocusSound(usePrefsStore.getState().focusSound);
    posthog.capture('session_started', { mode: 'phone_down' });
  }, [setIsSessionActive, scheduleAmbient]);

  const handleCountdownComplete = useCallback(() => {
    setIsCountingDown(false);
    startSession();
  }, [startSession]);

  const handleStop = useCallback(async () => {
    const endTime = new Date();
    const startTime = sessionStartRef.current || endTime;
    const lockedInSeconds = focusedSeconds();

    isActiveRef.current = false;
    activeSinceRef.current = null;
    if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current);
    setAmbient(false);
    setIsSessionActive(false);
    setIsFinishing(true);
    stopFocusSound();
    playSound('unlock');
    Haptics.unlockPattern();

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
      mode: 'phone_down',
      locked_in_seconds: lockedInSeconds,
      duration_seconds: Math.round((endTime.getTime() - startTime.getTime()) / 1000),
      away_count: awayCount,
      away_seconds: awaySeconds,
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
      console.warn('[PhoneDown] Tinybird send FAILED:', err);
    });

    setIsFinishing(false);

    router.replace({
      pathname: '/photo-capture',
      params: { lockedInSeconds: String(lockedInSeconds), sessionId },
    } as any);
  }, [user, setIsSessionActive, setIsFinishing, router, focusedSeconds, awayCount, awaySeconds]);

  // Mascot: slow breathing while locked in, the odd blink
  const breathe = useSharedValue(0);
  const eye = useSharedValue(1);
  useEffect(() => {
    breathe.value = isSessionActive
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) })
          ),
          -1
        )
      : withTiming(0);
    eye.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3600 }),
        withTiming(0, { duration: 90 }),
        withTiming(1, { duration: 120 })
      ),
      -1
    );
  }, [isSessionActive, breathe, eye]);

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.04 }, { translateY: -breathe.value * 3 }],
  }));

  const ambientStyle = useAnimatedStyle(() => ({
    opacity: withTiming(ambient ? 1 : 0, { duration: ambient ? 900 : 250 }),
  }));

  const r = (RING - RING_STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const earnedMinutes = Math.floor(elapsedSeconds / 60);
  const canExit = !isSessionActive && !isFinishing && !isCountingDown;
  const goalLeft = Math.max(0, goalMinutes - todayMinutes);

  return (
    <View style={styles.container} onTouchStart={isSessionActive ? wake : undefined}>
      <StatusBar barStyle="light-content" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.side}>
          {canExit && (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={T.ink} />
            </Pressable>
          )}
        </View>
        {isSessionActive || isCountingDown ? (
          <View style={[styles.modePill, isSessionActive && styles.modePillLive]}>
            {isSessionActive && <View style={styles.liveDot} />}
            <Text style={[styles.modeText, isSessionActive && styles.modeTextLive]}>
              {isSessionActive ? 'LOCKED IN' : 'PHONE DOWN'}
            </Text>
          </View>
        ) : (
          <SessionModeSwitch value="nocamera" onChange={() => router.replace('/record' as any)} />
        )}
        <View style={styles.side} />
      </View>

      {/* Background sound */}
      {!isCountingDown && (
        <View style={styles.soundRow}>
          <FocusSoundPicker sessionActive={isSessionActive} />
        </View>
      )}

      <SessionToast message={toast} top={insets.top + 64} variant="light" />

      {/* Centre */}
      <View style={styles.center}>
        <View style={styles.ringWrap}>
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            <Circle cx={RING / 2} cy={RING / 2} r={r} stroke={T.sunk} strokeWidth={RING_STROKE} fill="none" />
            {goalProgress >= 0.01 && (
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={r}
                stroke={T.orange}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${circ * goalProgress} ${circ}`}
                transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
              />
            )}
          </Svg>
          <Animated.View style={mascotStyle}>
            <Mascot size={132} rightEyeOpen={eye} />
          </Animated.View>
        </View>

        <Text style={styles.timer}>{formatElapsed(elapsedSeconds)}</Text>

        {isSessionActive ? (
          <Text style={styles.sub}>
            <Text style={styles.subStrong}>+{earnedMinutes} min</Text> earned · ~{earnedMinutes * REELS_PER_MINUTE} reels skipped
          </Text>
        ) : (
          <Text style={styles.sub}>No camera. Just you and the work.</Text>
        )}

        <View style={styles.chips}>
          <View style={styles.chip}>
            <Ionicons name="flag-outline" size={13} color={T.orange} />
            <Text style={styles.chipText}>{goalLeft <= 0 ? 'Goal done today' : `${formatHM(goalLeft)} to goal`}</Text>
          </View>
          {awayCount > 0 && (
            <View style={[styles.chip, styles.chipWarn]}>
              <Ionicons name="exit-outline" size={13} color={T.bad} />
              <Text style={[styles.chipText, { color: T.bad }]}>
                Left {awayCount}× · {formatHM(awaySeconds / 60) === '0m' ? `${awaySeconds}s` : formatHM(awaySeconds / 60)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 18 }]}>
        <ShutterButton
          variant="light"
          isRecording={isSessionActive || isFinishing}
          disabled={isFinishing || isCountingDown}
          onStart={() => setIsCountingDown(true)}
          onStop={handleStop}
          onHoldCancelled={() => setToast('Keep holding to stop')}
        />
        <Text style={styles.rule}>
          {isSessionActive ? 'Leaving Lockin pauses the clock' : 'Keep Lockin open · leave the phone on the desk'}
        </Text>
      </View>

      {/* Ambient: OLED-dark clock while the phone sits untouched */}
      <Animated.View pointerEvents={ambient ? 'auto' : 'none'} style={[styles.ambient, ambientStyle]}>
        <Pressable style={styles.ambientInner} onPress={wake} accessibilityLabel="Wake screen">
          <Mascot size={44} rightEyeOpen={eye} />
          <Text style={styles.ambientTimer}>{formatElapsed(elapsedSeconds)}</Text>
          <Text style={styles.ambientHint}>Locked in · tap to wake</Text>
        </Pressable>
      </Animated.View>

      <CountdownOverlay variant="light" isVisible={isCountingDown} onComplete={handleCountdownComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.canvas,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  side: {
    width: 42,
    height: 42,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  soundRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: T.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.lineStrong,
  },
  modePillLive: {
    backgroundColor: T.orange,
    borderColor: T.orange,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: T.white,
  },
  modeText: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: T.ink,
  },
  modeTextLive: {
    color: T.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrap: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    marginTop: 22,
    fontFamily: Fonts.display,
    fontSize: 76,
    lineHeight: 82,
    color: T.ink,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  sub: {
    marginTop: 2,
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: T.inkSoft,
  },
  subStrong: {
    fontFamily: Fonts.bold,
    color: T.orange,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: T.card,
    ...cardShadow,
  },
  chipWarn: {
    backgroundColor: T.badSoft,
  },
  chipText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: T.ink,
  },
  bottom: {
    alignItems: 'center',
  },
  rule: {
    marginTop: 12,
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: T.inkMute,
  },
  ambient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 80,
  },
  ambientInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  ambientTimer: {
    fontFamily: Fonts.display,
    fontSize: 64,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  ambientHint: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
  },
});
