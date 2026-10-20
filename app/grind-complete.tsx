import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  InteractionManager,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ribbon from '../assets/images/ribbon.svg';
import TimelapseStar from '../assets/images/timelapse_start.svg';
import Button3D from '../components/Button3D';
import { Fonts } from '../constants/Fonts';
import { useAppLockStore } from '../store/useAppLockStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { posthog } from '../lib/posthog';

const SCREEN_WIDTH = Math.min(Dimensions.get('window').width, 430);

const MOTIVATIONAL_MESSAGES = [
  "You just outworked 99% of people.",
  "That's how legends are built.",
  "Locked in. No distractions. Pure focus.",
  "Every grind session counts.",
  "You showed up. That's what matters.",
  "Consistency beats talent every time.",
  "Another session in the bag.",
  "Your future self just said thanks.",
  "Built different. Proved it again.",
  "The grind doesn't lie.",
];

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins} minute${mins !== 1 ? 's' : ''}`;
}

export default function GrindCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { grindDurationSeconds, lockedInSeconds: lockedInSecondsParam } = useLocalSearchParams<{
    videoUri: string;
    grindDurationSeconds: string;
    lockedInSeconds: string;
  }>();
  const userName = useOnboardingStore((s) => s.quizAnswers.name);

  const durationSeconds = parseInt(grindDurationSeconds || '0', 10);
  const lockedInSeconds = parseInt(lockedInSecondsParam || grindDurationSeconds || '0', 10);
  const durationText = formatDuration(durationSeconds);

  const earnedSeconds = Math.floor(lockedInSeconds / 4);
  const earnedText = formatDuration(earnedSeconds);
  const isFullyUnlocked = useAppLockStore((s) => s.isFullyUnlocked);
  const isCurrentlyLocked = useAppLockStore((s) => s.isCurrentlyLocked);
  const availableScreenTime = useAppLockStore((s) => s.getAvailableScreenTime());
  const canClaim = !isFullyUnlocked && availableScreenTime >= 60;

  const [showClaimModal, setShowClaimModal] = useState(false);

  const motivationalMessage = useMemo(
    () => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
    []
  );

  // Animation values
  const ribbonScale = useSharedValue(0);
  const ribbonOpacity = useSharedValue(0);
  const starScale = useSharedValue(0);
  const starOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const durationOpacity = useSharedValue(0);
  const durationTranslateY = useSharedValue(20);
  const messageOpacity = useSharedValue(0);
  const messageTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);

  useEffect(() => {
    posthog.capture('grind_complete_mounted', {
      duration_seconds: durationSeconds,
      locked_in_seconds: lockedInSeconds,
      can_claim: canClaim,
      is_fully_unlocked: isFullyUnlocked,
    });
    // Staggered entrance animations
    ribbonOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    ribbonScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));

    starOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    starScale.value = withDelay(400, withSpring(1, { damping: 10, stiffness: 120 }));

    titleOpacity.value = withDelay(600, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    titleTranslateY.value = withDelay(600, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    durationOpacity.value = withDelay(800, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    durationTranslateY.value = withDelay(800, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    messageOpacity.value = withDelay(1000, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    messageTranslateY.value = withDelay(1000, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    buttonTranslateY.value = withDelay(1200, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, []);

  const ribbonAnimStyle = useAnimatedStyle(() => ({
    opacity: ribbonOpacity.value,
  }));

  const starAnimStyle = useAnimatedStyle(() => ({
    opacity: starOpacity.value,
    transform: [{ scale: starScale.value }],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const durationAnimStyle = useAnimatedStyle(() => ({
    opacity: durationOpacity.value,
    transform: [{ translateY: durationTranslateY.value }],
  }));

  const messageAnimStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [{ translateY: messageTranslateY.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const handleDone = () => {
    posthog.capture('grind_complete_done_tapped', {
      duration_seconds: durationSeconds,
      locked_in_seconds: lockedInSeconds,
    });
    try {
      router.back();
    } catch (err: any) {
      posthog.capture('grind_complete_error', {
        phase: 'done',
        error: err?.message ?? String(err),
      });
    }
  };

  const handleClaimConfirm = () => {
    posthog.capture('grind_complete_claim_confirm_tapped', {
      available_screen_time_seconds: availableScreenTime,
      locked_in_seconds: lockedInSeconds,
      grind_duration_seconds: durationSeconds,
    });
    setShowClaimModal(false);
    // Defer the native FamilyControls bridge call off the current event-loop
    // tick so it doesn't run during the router transition. Avoids contention
    // with the modal dismiss + navigation happening on the same frame, which
    // was implicated in the 1h15m session crash report.
    InteractionManager.runAfterInteractions(() => {
      try {
        useAppLockStore.getState().unlockApps();
        posthog.capture('screen_time_claimed', {
          available_screen_time_seconds: availableScreenTime,
          locked_in_seconds: lockedInSeconds,
          grind_duration_seconds: durationSeconds,
        });
      } catch (err: any) {
        posthog.capture('grind_complete_error', {
          phase: 'unlock',
          error: err?.message ?? String(err),
        });
      }
    });
    try {
      router.back();
    } catch (err: any) {
      posthog.capture('grind_complete_error', {
        phase: 'claim_back',
        error: err?.message ?? String(err),
      });
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/night-sky-background.jpeg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }]}>
        {/* Ribbon + Star */}
        <View style={styles.badgeArea}>
          <Animated.View style={[styles.ribbonContainer, ribbonAnimStyle]}>
            <Ribbon width={SCREEN_WIDTH} height={SCREEN_WIDTH} />
          </Animated.View>
          <Animated.View style={[styles.starContainer, starAnimStyle]}>
            <TimelapseStar width={SCREEN_WIDTH * 0.4} height={SCREEN_WIDTH * 0.4} />
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.View style={titleAnimStyle}>
          <Text style={styles.title}>
            {userName ? `${userName}, you crushed it!` : 'You crushed it!'}
          </Text>
          <Text style={styles.motivationalMessage}>{motivationalMessage}</Text>
        </Animated.View>

        {/* Stats Card */}
        <Animated.View style={[styles.statsCard, durationAnimStyle]}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Grind Duration</Text>
            <Text style={styles.statValue}>{durationText}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Screen Time Earned</Text>
            <Text style={[styles.statValue, styles.earnedValue]}>
              {isFullyUnlocked ? 'Unlocked' : earnedText}
            </Text>
          </View>
        </Animated.View>

        {isFullyUnlocked && (
          <Animated.View style={messageAnimStyle}>
            <Text style={styles.unlockedNote}>Apps unlocked until tonight</Text>
          </Animated.View>
        )}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Buttons */}
        <Animated.View style={[styles.buttonContainer, buttonAnimStyle]}>
          {canClaim ? (
            <View style={styles.buttonRow}>
              <View style={styles.halfButton}>
                <Button3D title="Done" onPress={handleDone} />
              </View>
              <View style={styles.halfButton}>
                <Button3D title="Claim" onPress={() => setShowClaimModal(true)} />
              </View>
            </View>
          ) : (
            <Button3D title="Done" onPress={handleDone} />
          )}
        </Animated.View>
      </View>

      {/* Claim Confirmation Modal */}
      <Modal
        visible={showClaimModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowClaimModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Start Screen Time?</Text>
            <Text style={styles.modalBody}>
              You'll be able to use your phone for the next{' '}
              <Text style={styles.modalBold}>{formatMinutes(availableScreenTime)}</Text>
            </Text>
            <Pressable style={styles.modalConfirmButton} onPress={handleClaimConfirm}>
              <Text style={styles.modalConfirmText}>Start Timer</Text>
            </Pressable>
            <Pressable style={styles.modalCancelButton} onPress={() => setShowClaimModal(false)}>
              <Text style={styles.modalCancelText}>Not Now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  badgeArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    height: SCREEN_WIDTH,
  },
  ribbonContainer: {
    position: 'absolute',
  },
  starContainer: {
    position: 'absolute',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  motivationalMessage: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  statsCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  earnedValue: {
    color: '#34d399',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  unlockedNote: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#34d399',
    textAlign: 'center',
    marginTop: 12,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalBody: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalBold: {
    fontFamily: Fonts.bold,
    color: '#34d399',
  },
  modalConfirmButton: {
    width: '100%',
    backgroundColor: '#34d399',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalConfirmText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: '#0E0E0E',
  },
  modalCancelButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
});
