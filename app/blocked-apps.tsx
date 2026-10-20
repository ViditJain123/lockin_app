import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DeviceActivitySelectionView } from 'react-native-device-activity';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import ClaimScreenTimeModal, { formatMinutes } from '@/components/ClaimScreenTimeModal';
import { LCBackButton } from '@/components/lc/LCBackButton';
import { BrandColors } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { useAuth } from '@/contexts/AuthContext';
import { buttonPress } from '@/lib/haptics';
import { upsertUserRow } from '@/lib/supabaseUser';
import { useAppLockStore } from '@/store/useAppLockStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';

const ORANGE = BrandColors.palette.orange;
const YELLOW = BrandColors.palette.yellow;

export default function BlockedAppsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const targetHours = useOnboardingStore((s) => s.quizAnswers.targetHours);
  const familyActivitySelection = useOnboardingStore((s) => s.quizAnswers.familyActivitySelection);
  const pendingSelection = useOnboardingStore((s) => s.pendingSettings?.familyActivitySelection);

  const isFullyUnlocked = useAppLockStore((s) => s.isFullyUnlocked);
  const isCurrentlyLocked = useAppLockStore((s) => s.isCurrentlyLocked);
  const dailyFocusSeconds = useAppLockStore((s) => s.dailyFocusSeconds);
  const availableScreenTime = useAppLockStore((s) => s.getAvailableScreenTime());
  const canClaim = !isFullyUnlocked && isCurrentlyLocked && availableScreenTime >= 60;

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [tempSelection, setTempSelection] = useState<string | null>(familyActivitySelection);

  const focusLeftSeconds = Math.max(targetHours * 3600 - dailyFocusSeconds, 0);

  const status = isFullyUnlocked
    ? {
        icon: 'lock-open' as const,
        color: YELLOW,
        title: 'Apps unlocked',
        subtitle: `You hit your ${targetHours}h target. Everything stays unlocked until bedtime.`,
      }
    : isCurrentlyLocked
      ? {
          icon: 'lock-closed' as const,
          color: ORANGE,
          title: "You're locked in",
          subtitle: `${formatMinutes(focusLeftSeconds)} of focus left until everything unlocks.`,
        }
      : {
          icon: 'hourglass' as const,
          color: YELLOW,
          title: 'Screen time running',
          subtitle: 'Your apps lock again when the time you claimed runs out.',
        };

  // Same rule as Settings: a new selection only takes effect tomorrow
  const handleAppPickerDone = () => {
    useOnboardingStore.getState().setPendingSetting('familyActivitySelection', tempSelection);
    setShowAppPicker(false);
    if (user?.id) {
      upsertUserRow(user.id, {
        pending_settings_date: useOnboardingStore.getState().pendingSettings?.scheduledDate,
      }).catch((err) => console.warn('[BlockedApps] Failed to sync pending app selection:', err));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        <LCBackButton />
        <Text style={styles.title}>Blocked Apps</Text>

        {/* Status */}
        <View style={styles.statusArt}>
          <Svg width={220} height={220} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="statusGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={status.color} stopOpacity={0.5} />
                <Stop offset="1" stopColor={BrandColors.palette.ink} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={110} cy={110} r={110} fill="url(#statusGlow)" />
          </Svg>
          <Ionicons name={status.icon} size={68} color={status.color} />
        </View>
        <Text style={styles.statusTitle}>{status.title}</Text>
        <Text style={styles.statusSubtitle}>{status.subtitle}</Text>

        {/* Earned screen time */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>EARNED SCREEN TIME</Text>
          <Text style={styles.earned}>{formatMinutes(availableScreenTime)}</Text>
          <Text style={styles.cardHint}>Every 4 minutes of focus earns 1 minute of screen time.</Text>
          {canClaim && (
            <Pressable
              onPress={() => {
                buttonPress();
                setShowClaimModal(true);
              }}
              style={({ pressed }) => [styles.claimButton, pressed && styles.pressed]}
            >
              <Text style={styles.claimText}>Claim screen time</Text>
            </Pressable>
          )}
        </View>

        {/* Apps to block */}
        <Pressable
          onPress={() => {
            setTempSelection(familyActivitySelection);
            setShowAppPicker(true);
          }}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.rowIcon}>
            <Ionicons name="apps" size={20} color={ORANGE} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Apps to block</Text>
            <Text style={styles.rowSubtitle}>{familyActivitySelection ? 'Configured' : 'Not set'}</Text>
            {pendingSelection !== undefined && (
              <Text style={styles.pendingText}>Change pending — takes effect tomorrow</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
        </Pressable>
      </ScrollView>

      <ClaimScreenTimeModal
        visible={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        source="blocked_apps"
      />

      {/* Apple's app picker */}
      <Modal
        visible={showAppPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAppPicker(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAppPicker(false)} hitSlop={8}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Apps to block</Text>
            <Pressable onPress={handleAppPickerDone} hitSlop={8}>
              <Text style={styles.modalDone}>Done</Text>
            </Pressable>
          </View>
          <Text style={styles.modalNote}>Changes take effect tomorrow.</Text>
          <View style={styles.picker}>
            <DeviceActivitySelectionView
              style={styles.picker}
              familyActivitySelection={tempSelection}
              onSelectionChange={(event) => {
                setTempSelection(event.nativeEvent.familyActivitySelection ?? null);
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.palette.ink,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontFamily: Fonts.semiBold,
    color: BrandColors.palette.white,
  },
  statusArt: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  statusTitle: {
    fontSize: 26,
    fontFamily: Fonts.semiBold,
    color: BrandColors.palette.white,
    textAlign: 'center',
  },
  statusSubtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  card: {
    marginTop: 28,
    padding: 20,
    borderRadius: 26,
    backgroundColor: '#1A1A1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,201,60,0.25)',
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: Fonts.monoSemiBold,
    letterSpacing: 1.5,
    color: YELLOW,
  },
  earned: {
    marginTop: 6,
    fontSize: 40,
    fontFamily: Fonts.light,
    color: BrandColors.palette.white,
  },
  cardHint: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.55)',
  },
  claimButton: {
    marginTop: 16,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: ORANGE,
    alignItems: 'center',
  },
  claimText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: BrandColors.palette.white,
  },
  row: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,102,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: BrandColors.palette.white,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.55)',
  },
  pendingText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: YELLOW,
  },
  pressed: {
    opacity: 0.8,
  },
  modal: {
    flex: 1,
    backgroundColor: BrandColors.palette.ink,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: BrandColors.palette.white,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.6)',
  },
  modalDone: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: ORANGE,
  },
  modalNote: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    paddingBottom: 8,
  },
  picker: {
    flex: 1,
  },
});
