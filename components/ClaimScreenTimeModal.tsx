import React from 'react';
import { InteractionManager, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { RADIUS, T, cardShadow } from '@/constants/Theme';
import { posthog } from '@/lib/posthog';
import { useAppLockStore } from '@/store/useAppLockStore';

export function formatMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins} minute${mins !== 1 ? 's' : ''}`;
}

interface ClaimScreenTimeModalProps {
  visible: boolean;
  onClose: () => void;
  // Analytics source tag, e.g. 'dashboard' or 'blocked_apps'
  source: string;
}

// Confirms spending earned screen time, then unlocks the blocked apps
export default function ClaimScreenTimeModal({ visible, onClose, source }: ClaimScreenTimeModalProps) {
  const availableScreenTime = useAppLockStore((s) => s.getAvailableScreenTime());

  const handleConfirm = () => {
    posthog.capture('screen_time_claim_confirm_tapped', {
      available_screen_time_seconds: availableScreenTime,
      source,
    });
    onClose();
    // Defer the native FamilyControls bridge call off the modal-dismiss frame
    // (mirrors the pattern in grind-complete.tsx that fixed a 1h15m crash).
    InteractionManager.runAfterInteractions(() => {
      try {
        useAppLockStore.getState().unlockApps();
        posthog.capture('screen_time_claimed', {
          available_screen_time_seconds: availableScreenTime,
          source,
        });
      } catch (err: any) {
        posthog.capture('home_claim_error', {
          phase: 'unlock',
          error: err?.message ?? String(err),
        });
      }
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Start Screen Time?</Text>
          <Text style={styles.body}>
            You'll be able to use your phone for the next{' '}
            <Text style={styles.bold}>{formatMinutes(availableScreenTime)}</Text>
          </Text>
          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Start Timer</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Not Now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  card: {
    width: '100%',
    backgroundColor: T.card,
    borderRadius: RADIUS.lg,
    padding: 28,
    alignItems: 'center',
    ...cardShadow,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: T.ink,
    marginBottom: 12,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: T.inkSoft,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  bold: {
    fontFamily: Fonts.bold,
    color: T.orange,
  },
  confirmButton: {
    width: '100%',
    backgroundColor: T.orange,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: T.white, // white on orange button
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: T.inkMute,
  },
});
