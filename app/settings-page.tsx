import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DeviceActivitySelectionView,
} from 'react-native-device-activity';

import { useAuth } from '../contexts/AuthContext';
import { Fonts } from '../constants/Fonts';
import { useAppLockStore } from '../store/useAppLockStore';
import { useOnboardingStore, type SleepTime } from '../store/useOnboardingStore';
import { upsertUserRow, convertSleepTimeTo24h } from '../lib/supabaseUser';
import TimePicker from '../components/quiz/TimePicker';

const TARGET_HOURS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function formatSleepTimeDisplay(sleepTime: SleepTime): string {
  const min = sleepTime.minute.toString().padStart(2, '0');
  return `${sleepTime.hour}:${min} ${sleepTime.period}`;
}

export default function SettingsPageScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, deleteAccount } = useAuth();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const userName = user?.user_metadata?.full_name || 'User';
  const userEmail = user?.email || '';

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
            Alert.alert(
              'Are you sure?',
              'All your sessions, badges, and progress will be permanently lost.',
              [
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
              ]
            );
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
      }).catch((err) =>
        console.warn('[Settings] Failed to sync pending sleep time:', err)
      );
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
      }).catch((err) =>
        console.warn('[Settings] Failed to sync pending target hours:', err)
      );
    }
  };

  const handleAppPickerDone = () => {
    useOnboardingStore.getState().setPendingSetting('familyActivitySelection', tempSelection);
    setShowAppPicker(false);

    // Do NOT block apps yet — deferred to next day
    if (user?.id) {
      upsertUserRow(user.id, {
        pending_settings_date: useOnboardingStore.getState().pendingSettings?.scheduledDate,
      }).catch((err) =>
        console.warn('[Settings] Failed to sync pending app selection:', err)
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView>
        {/* Screen Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SCREEN TIME</Text>
          <View style={styles.card}>
            {/* Sleep Time */}
            <Pressable style={styles.row} onPress={() => { setTempSleepTime(sleepTime); setShowSleepTimePicker(true); }}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="moon" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Sleep Time</Text>
                <Text style={styles.rowSubtitle}>{formatSleepTimeDisplay(sleepTime)}</Text>
                {pendingSettings?.sleepTime && (
                  <Text style={styles.pendingText}>Changing to {formatSleepTimeDisplay(pendingSettings.sleepTime)} tomorrow</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </Pressable>

            <View style={styles.separator} />

            {/* Daily Target */}
            <Pressable
              style={[styles.row, isFullyUnlocked && { opacity: 0.5 }]}
              onPress={isFullyUnlocked ? undefined : () => setShowTargetPicker(true)}
              disabled={isFullyUnlocked}
            >
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                <Ionicons name="flame" size={20} color="#eab308" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Daily Target</Text>
                <Text style={styles.rowSubtitle}>
                  {isFullyUnlocked
                    ? `${targetHours} ${targetHours === 1 ? 'hour' : 'hours'} — Target reached ✓`
                    : `${targetHours} ${targetHours === 1 ? 'hour' : 'hours'}`}
                </Text>
                {pendingSettings?.targetHours !== undefined && (
                  <Text style={styles.pendingText}>Changing to {pendingSettings.targetHours} {pendingSettings.targetHours === 1 ? 'hour' : 'hours'} tomorrow</Text>
                )}
              </View>
              {!isFullyUnlocked && <Ionicons name="chevron-forward" size={18} color="#666" />}
            </Pressable>

            <View style={styles.separator} />

            {/* Blocked Apps */}
            <Pressable style={styles.row} onPress={() => { setTempSelection(familyActivitySelection); setShowAppPicker(true); }}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="lock-closed" size={20} color="#ef4444" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Blocked Apps</Text>
                <Text style={styles.rowSubtitle}>{familyActivitySelection ? 'Configured' : 'Not set'}</Text>
                {pendingSettings?.familyActivitySelection !== undefined && (
                  <Text style={styles.pendingText}>Change pending — takes effect tomorrow</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </Pressable>

            {isFullyUnlocked ? (
              <>
                <View style={styles.separator} />
                <View style={styles.row}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                    <Ionicons name="lock-open" size={20} color="#34d399" />
                  </View>
                  <View style={styles.rowTextContainer}>
                    <Text style={[styles.rowTitle, { color: '#34d399' }]}>Apps Unlocked</Text>
                    <Text style={styles.rowSubtitle}>Unlocked until {formatSleepTimeDisplay(sleepTime)}</Text>
                  </View>
                </View>
              </>
            ) : canClaim ? (
              <>
                <View style={styles.separator} />
                <Pressable style={styles.row} onPress={() => setShowClaimModal(true)}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                    <Ionicons name="play" size={20} color="#34d399" />
                  </View>
                  <View style={styles.rowTextContainer}>
                    <Text style={[styles.rowTitle, { color: '#34d399' }]}>Claim Screen Time</Text>
                    <Text style={styles.rowSubtitle}>{Math.floor(availableScreenTime / 60)} minutes available</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#666" />
                </Pressable>
              </>
            ) : null}
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="person" size={20} color="#3b82f6" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>{userName}</Text>
                <Text style={styles.rowSubtitle}>{userEmail}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <Pressable style={styles.row} onPress={handleLogout}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Ionicons name="log-out-outline" size={20} color="#ec4899" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: '#ec4899' }]}>Log Out</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </Pressable>

            <View style={styles.separator} />

            <Pressable style={styles.row} onPress={handleDeleteAccount} disabled={isDeletingAccount}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.rowTitle, { color: '#ef4444' }]}>
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </Text>
              </View>
              {!isDeletingAccount && <Ionicons name="chevron-forward" size={18} color="#666" />}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Sleep Time Picker Modal */}
      <Modal visible={showSleepTimePicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSleepTimePicker(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowSleepTimePicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Sleep Time</Text>
            <Pressable onPress={handleSaveSleepTime}>
              <Text style={styles.modalDoneText}>Save</Text>
            </Pressable>
          </View>
          <View style={styles.timePickerContainer}>
            <TimePicker
              hour={tempSleepTime.hour}
              minute={tempSleepTime.minute}
              period={tempSleepTime.period}
              onTimeChange={(hour, minute, period) => setTempSleepTime({ hour, minute, period })}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Target Hours Picker Modal */}
      <Modal visible={showTargetPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTargetPicker(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowTargetPicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Daily Target</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={styles.targetList}>
            {TARGET_HOURS_OPTIONS.map((h) => (
              <Pressable key={h} style={[styles.targetOption, h === targetHours && styles.targetOptionSelected]} onPress={() => handleSelectTargetHours(h)}>
                <Text style={[styles.targetOptionText, h === targetHours && styles.targetOptionTextSelected]}>
                  {h} {h === 1 ? 'hour' : 'hours'}
                </Text>
                {h === targetHours && <Ionicons name="checkmark" size={22} color="#007AFF" />}
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* App Selection Modal */}
      <Modal visible={showAppPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAppPicker(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ width: 60 }} />
            <Text style={styles.modalTitle}>Blocked Apps</Text>
            <Pressable onPress={handleAppPickerDone}>
              <Text style={styles.modalDoneText}>Done</Text>
            </Pressable>
          </View>
          {__DEV__ && Platform.OS === 'ios' && !Platform.isPad && (
            <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 12, fontSize: 13 }}>
              Note: App list is empty on Simulator. Test on a physical device.
            </Text>
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
        </SafeAreaView>
      </Modal>

      {/* Claim Screen Time Modal */}
      <Modal visible={showClaimModal} animationType="fade" transparent onRequestClose={() => setShowClaimModal(false)}>
        <View style={styles.claimModalOverlay}>
          <View style={styles.claimModalCard}>
            <Text style={styles.claimModalTitle}>Start Screen Time?</Text>
            <Text style={styles.claimModalBody}>
              You'll be able to use your phone for the next{' '}
              <Text style={styles.claimModalBold}>{Math.floor(availableScreenTime / 60)} minutes</Text>
            </Text>
            <Pressable
              style={styles.claimModalConfirmButton}
              onPress={() => {
                setShowClaimModal(false);
                useAppLockStore.getState().unlockApps();
              }}
            >
              <Text style={styles.claimModalConfirmText}>Start Timer</Text>
            </Pressable>
            <Pressable style={styles.claimModalCancelButton} onPress={() => setShowClaimModal(false)}>
              <Text style={styles.claimModalCancelText}>Not Now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: '#fff',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#fff',
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#888',
    marginTop: 2,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#eab308',
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#333',
    marginLeft: 64,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: '#fff',
  },
  modalCancelText: {
    fontSize: 17,
    fontFamily: Fonts.regular,
    color: '#007AFF',
  },
  modalDoneText: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: '#007AFF',
  },
  timePickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  targetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#1a1a1a',
  },
  targetOptionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  targetOptionText: {
    fontSize: 17,
    fontFamily: Fonts.medium,
    color: '#fff',
  },
  targetOptionTextSelected: {
    color: '#007AFF',
  },
  claimModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  claimModalCard: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  claimModalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  claimModalBody: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  claimModalBold: {
    fontFamily: Fonts.bold,
    color: '#34d399',
  },
  claimModalConfirmButton: {
    width: '100%',
    backgroundColor: '#34d399',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  claimModalConfirmText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: '#000',
  },
  claimModalCancelButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  claimModalCancelText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
});
