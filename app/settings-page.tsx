import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { DeviceActivitySelectionView } from 'react-native-device-activity';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ClaimScreenTimeModal from '../components/ClaimScreenTimeModal';
import AvatarEditSheet from '../components/profile/AvatarEditSheet';
import InitialsAvatar from '../components/profile/InitialsAvatar';
import TimePicker from '../components/quiz/TimePicker';
import { Fonts } from '../constants/Fonts';
import { cardShadow, RADIUS, T } from '../constants/Theme';
import { useAuth } from '../contexts/AuthContext';
import { buttonPress, optionSelect } from '../lib/haptics';
import { playSound } from '../lib/sound';
import { convertSleepTimeTo24h, upsertUserRow } from '../lib/supabaseUser';
import { computeXP, levelFromXP } from '../lib/xp';
import { useAppLockStore } from '../store/useAppLockStore';
import { useCrystalStore } from '../store/useCrystalStore';
import { useOnboardingStore, type SleepTime } from '../store/useOnboardingStore';
import { usePrefsStore } from '../store/usePrefsStore';
import { useProfileStatsStore } from '../store/useProfileStatsStore';

const TARGET_HOURS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function formatSleepTimeDisplay(sleepTime: SleepTime): string {
  const min = sleepTime.minute.toString().padStart(2, '0');
  return `${sleepTime.hour}:${min} ${sleepTime.period}`;
}

const hoursLabel = (h: number) => `${h} ${h === 1 ? 'hour' : 'hours'}`;

type IconName = keyof typeof Ionicons.glyphMap;

function Row({
  icon,
  title,
  value,
  note,
  onPress,
  danger,
  right,
  last,
}: {
  icon: IconName;
  title: string;
  value?: string;
  note?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
        onPress={
          onPress
            ? () => {
                optionSelect();
                onPress();
              }
            : undefined
        }
        disabled={!onPress && !right}
      >
        <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
          <Ionicons name={icon} size={18} color={danger ? T.bad : T.orange} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, danger && { color: T.bad }]}>{title}</Text>
          {note ? <Text style={styles.rowNote}>{note}</Text> : null}
        </View>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={T.inkMute} /> : null)}
      </Pressable>
      {!last && <View style={styles.separator} />}
    </>
  );
}

export default function SettingsPageScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, deleteAccount } = useAuth();
  const [editAvatar, setEditAvatar] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
    }, [])
  );

  const quizName = useOnboardingStore((s) => s.quizAnswers.name);
  const userName = quizName?.trim() || user?.user_metadata?.full_name || 'You';
  const userEmail = user?.email || '';

  const totalHours = useProfileStatsStore((s) => s.total_hours);
  const grinds = useProfileStatsStore((s) => s.grinds);
  const streak = useProfileStatsStore((s) => s.streak) ?? 0;
  const trophies = useCrystalStore((s) => s.earnedCrystals.length);
  const level = levelFromXP(computeXP({ totalHours, totalGrinds: grinds }));

  const soundEnabled = usePrefsStore((s) => s.soundEnabled);
  const setSoundEnabled = usePrefsStore((s) => s.setSoundEnabled);

  // Screen time settings
  const sleepTime = useOnboardingStore((s) => s.quizAnswers.sleepTime);
  const targetHours = useOnboardingStore((s) => s.quizAnswers.targetHours);
  const familyActivitySelection = useOnboardingStore((s) => s.quizAnswers.familyActivitySelection);
  const pendingSettings = useOnboardingStore((s) => s.pendingSettings);

  const [showSleepTimePicker, setShowSleepTimePicker] = useState(false);
  const [tempSleepTime, setTempSleepTime] = useState<SleepTime>(sleepTime);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [tempSelection, setTempSelection] = useState<string | null>(familyActivitySelection);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Screen time claim
  const availableScreenTime = useAppLockStore((s) => s.getAvailableScreenTime());
  const isCurrentlyLocked = useAppLockStore((s) => s.isCurrentlyLocked);
  const isFullyUnlocked = useAppLockStore((s) => s.isFullyUnlocked);
  const canClaim = !isFullyUnlocked && isCurrentlyLocked && availableScreenTime >= 60;

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Are you sure?', 'All your sessions, trophies, and progress will be permanently lost.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete Permanently',
                style: 'destructive',
                onPress: async () => {
                  setIsDeletingAccount(true);
                  try {
                    await deleteAccount();
                  } catch (error) {
                    setIsDeletingAccount(false);
                    Alert.alert(
                      'Error',
                      error instanceof Error ? error.message : 'Failed to delete account. Please try again.'
                    );
                  }
                },
              },
            ]);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleSaveSleepTime = () => {
    useOnboardingStore.getState().setPendingSetting('sleepTime', tempSleepTime);
    setShowSleepTimePicker(false);

    // Sync pending to Supabase (do NOT reschedule sleep lock yet)
    if (user?.id) {
      const time24h = convertSleepTimeTo24h(tempSleepTime);
      upsertUserRow(user.id, {
        pending_sleep_time: time24h,
        pending_settings_date: useOnboardingStore.getState().pendingSettings?.scheduledDate,
      }).catch((err) => console.warn('[Settings] Failed to sync pending sleep time:', err));
    }
  };

  const handleSelectTargetHours = (hours: number) => {
    useOnboardingStore.getState().setPendingSetting('targetHours', hours);
    setShowTargetPicker(false);

    // Sync pending to Supabase (do NOT change active target yet)
    if (user?.id) {
      upsertUserRow(user.id, {
        pending_target_hours: hours,
        pending_settings_date: useOnboardingStore.getState().pendingSettings?.scheduledDate,
      }).catch((err) => console.warn('[Settings] Failed to sync pending target hours:', err));
    }
  };

  const handleAppPickerDone = () => {
    useOnboardingStore.getState().setPendingSetting('familyActivitySelection', tempSelection);
    setShowAppPicker(false);

    // Do NOT block apps yet — deferred to next day
    if (user?.id) {
      upsertUserRow(user.id, {
        pending_settings_date: useOnboardingStore.getState().pendingSettings?.scheduledDate,
      }).catch((err) => console.warn('[Settings] Failed to sync pending app selection:', err));
    }
  };

  const version = Constants.expoConfig?.version;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color={T.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>You</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.profile}>
          <Pressable
            onPress={() => {
              optionSelect();
              setEditAvatar(true);
            }}
            style={({ pressed }) => pressed && styles.pressed}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            <InitialsAvatar id={user?.id ?? 'you'} size={64} isMe />
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={12} color={T.black} />
            </View>
          </Pressable>
          <View style={styles.profileText}>
            <Text style={styles.profileName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.profileMeta}>
              Level {level} · {trophies} {trophies === 1 ? 'trophy' : 'trophies'} · {streak}d streak
            </Text>
            <Pressable
              onPress={() => {
                optionSelect();
                setEditAvatar(true);
              }}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.changePhoto}>Change photo</Text>
            </Pressable>
          </View>
        </View>

        {/* Your day */}
        <Text style={styles.sectionTitle}>Your day</Text>
        <View style={styles.card}>
          <Row
            icon="flag-outline"
            title="Daily goal"
            value={hoursLabel(targetHours)}
            note={
              pendingSettings?.targetHours !== undefined
                ? `Changes to ${hoursLabel(pendingSettings.targetHours)} tomorrow`
                : isFullyUnlocked
                  ? 'Reached today ✓'
                  : undefined
            }
            onPress={isFullyUnlocked ? undefined : () => setShowTargetPicker(true)}
          />
          <Row
            icon="moon-outline"
            title="Bedtime"
            value={formatSleepTimeDisplay(sleepTime)}
            note={
              pendingSettings?.sleepTime
                ? `Changes to ${formatSleepTimeDisplay(pendingSettings.sleepTime)} tomorrow`
                : Platform.OS === 'ios'
                  ? 'Blocked apps lock at bedtime'
                  : undefined
            }
            onPress={() => {
              setTempSleepTime(sleepTime);
              setShowSleepTimePicker(true);
            }}
            last={Platform.OS !== 'ios'}
          />
          {Platform.OS === 'ios' && (
            <>
              <Row
                icon="lock-closed-outline"
                title="Blocked apps"
                value={familyActivitySelection ? 'On' : 'Not set'}
                note={pendingSettings?.familyActivitySelection !== undefined ? 'Change applies tomorrow' : 'Reels, feeds, anything you doomscroll'}
                onPress={() => {
                  setTempSelection(familyActivitySelection);
                  setShowAppPicker(true);
                }}
                last={!isFullyUnlocked && !canClaim}
              />
              {isFullyUnlocked ? (
                <Row icon="lock-open-outline" title="Apps unlocked" note={`Until ${formatSleepTimeDisplay(sleepTime)}`} last />
              ) : canClaim ? (
                <Row
                  icon="hourglass-outline"
                  title="Use earned screen time"
                  value={`${Math.floor(availableScreenTime / 60)} min`}
                  onPress={() => setShowClaimModal(true)}
                  last
                />
              ) : null}
            </>
          )}
        </View>
        <Text style={styles.footnote}>Goal and bedtime changes start tomorrow, so the goalposts can't move mid-day.</Text>

        {/* Sessions */}
        <Text style={styles.sectionTitle}>Sessions</Text>
        <View style={styles.card}>
          <Row
            icon="musical-notes-outline"
            title="Sound effects"
            note="Countdown, lock-in and milestone sounds"
            right={
              <Switch
                value={soundEnabled}
                onValueChange={(v) => {
                  optionSelect();
                  setSoundEnabled(v);
                  if (v) playSound('tap');
                }}
                trackColor={{ true: T.orange, false: T.sunk }}
                ios_backgroundColor={T.sunk}
              />
            }
            last
          />
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          {userEmail ? <Row icon="person-outline" title={userEmail} /> : null}
          <Row icon="log-out-outline" title="Log out" onPress={handleLogout} />
          <Row
            icon="trash-outline"
            title={isDeletingAccount ? 'Deleting…' : 'Delete account'}
            onPress={isDeletingAccount ? undefined : handleDeleteAccount}
            danger
            last
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerWordmark}>
            LOCKIN <Text style={{ color: T.orange }}>CLUB</Text>
          </Text>
          {version ? <Text style={styles.footerVersion}>v{version}</Text> : null}
        </View>
      </ScrollView>

      <AvatarEditSheet visible={editAvatar} onClose={() => setEditAvatar(false)} userId={user?.id ?? 'you'} />

      {/* Bedtime picker */}
      <Modal
        visible={showSleepTimePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSleepTimePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowSleepTimePicker(false)} hitSlop={8}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Bedtime</Text>
            <Pressable onPress={handleSaveSleepTime} hitSlop={8}>
              <Text style={styles.modalDone}>Save</Text>
            </Pressable>
          </View>
          <Text style={styles.modalHint}>Lockin nudges you to wind down an hour before, and blocked apps lock at this time.</Text>
          <View style={styles.timePickerContainer}>
            <TimePicker
              hour={tempSleepTime.hour}
              minute={tempSleepTime.minute}
              period={tempSleepTime.period}
              onTimeChange={(hour, minute, period) => setTempSleepTime({ hour, minute, period })}
              fadeColor={T.canvas}
              textColor={T.ink}
            />
          </View>
        </View>
      </Modal>

      {/* Daily goal picker */}
      <Modal
        visible={showTargetPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTargetPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowTargetPicker(false)} hitSlop={8}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Daily goal</Text>
            <View style={{ width: 56 }} />
          </View>
          <Text style={styles.modalHint}>How many focused hours a day? Hitting it unlocks your apps until bedtime.</Text>
          <ScrollView contentContainerStyle={styles.targetGrid}>
            {TARGET_HOURS_OPTIONS.map((h) => {
              const selected = h === (pendingSettings?.targetHours ?? targetHours);
              return (
                <Pressable
                  key={h}
                  style={({ pressed }) => [styles.targetOption, selected && styles.targetOptionSelected, pressed && styles.pressed]}
                  onPress={() => {
                    optionSelect();
                    handleSelectTargetHours(h);
                  }}
                >
                  <Text style={[styles.targetValue, selected && styles.targetValueSelected]}>{h}</Text>
                  <Text style={[styles.targetUnit, selected && styles.targetValueSelected]}>{h === 1 ? 'hour' : 'hours'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Blocked apps picker */}
      <Modal
        visible={showAppPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAppPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ width: 56 }} />
            <Text style={styles.modalTitle}>Blocked apps</Text>
            <Pressable onPress={handleAppPickerDone} hitSlop={8}>
              <Text style={styles.modalDone}>Done</Text>
            </Pressable>
          </View>
          {__DEV__ && Platform.OS === 'ios' && !Platform.isPad && (
            <Text style={styles.modalHint}>The app list is empty on the Simulator. Test on a physical device.</Text>
          )}
          <View style={{ flex: 1 }}>
            <DeviceActivitySelectionView
              style={{ flex: 1 }}
              familyActivitySelection={tempSelection}
              onSelectionChange={(event) => {
                setTempSelection(event.nativeEvent.familyActivitySelection ?? null);
              }}
            />
          </View>
        </View>
      </Modal>

      <ClaimScreenTimeModal visible={showClaimModal} onClose={() => setShowClaimModal(false)} source="settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.canvas,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: T.ink,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: T.card,
    borderRadius: RADIUS.lg,
    ...cardShadow,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: T.ink,
  },
  profileMeta: {
    marginTop: 2,
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: T.inkSoft,
  },
  changePhoto: {
    marginTop: 6,
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: T.orange,
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.white,
    borderWidth: 2,
    borderColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: T.inkSoft,
    marginTop: 26,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: T.card,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...cardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 60,
  },
  rowPressed: {
    backgroundColor: T.sunk,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: T.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: {
    backgroundColor: T.badSoft,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15.5,
    fontFamily: Fonts.semiBold,
    color: T.ink,
  },
  rowNote: {
    marginTop: 2,
    fontSize: 12.5,
    fontFamily: Fonts.medium,
    color: T.inkMute,
  },
  rowValue: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: T.inkSoft,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.lineStrong,
    marginLeft: 62,
  },
  footnote: {
    marginTop: 8,
    marginHorizontal: 20,
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: T.inkMute,
    lineHeight: 17,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 4,
  },
  footerWordmark: {
    fontFamily: Fonts.dmSansBold,
    fontSize: 13,
    letterSpacing: 1.5,
    color: T.inkMute,
  },
  footerVersion: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: T.inkMute,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: T.canvas,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: T.ink,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: T.inkSoft,
    width: 56,
  },
  modalDone: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: T.orange,
    width: 56,
    textAlign: 'right',
  },
  modalHint: {
    marginHorizontal: 24,
    marginTop: 4,
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: T.inkSoft,
    lineHeight: 20,
  },
  timePickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 20,
  },
  targetOption: {
    width: '30.5%',
    aspectRatio: 1.15,
    borderRadius: RADIUS.md,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  targetOptionSelected: {
    backgroundColor: T.orange,
    borderColor: T.orange,
  },
  targetValue: {
    fontSize: 30,
    fontFamily: Fonts.bold,
    color: T.ink,
  },
  targetUnit: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: T.inkMute,
  },
  targetValueSelected: {
    color: T.white,
  },
});
