import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DeviceActivitySelectionView,
  blockSelection,
  setFamilyActivitySelectionId,
} from 'react-native-device-activity';

import { useAuth } from '../contexts/AuthContext';
import { Fonts } from '../constants/Fonts';
import { useOnboardingStore, type SleepTime } from '../store/useOnboardingStore';
import { upsertUserRow, convertSleepTimeTo24h } from '../lib/supabaseUser';
import { scheduleSleepTimeLock } from '../lib/appLockScheduler';
import TimePicker from '../components/quiz/TimePicker';

const TARGET_HOURS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function formatSleepTimeDisplay(sleepTime: SleepTime): string {
  const min = sleepTime.minute.toString().padStart(2, '0');
  return `${sleepTime.hour}:${min} ${sleepTime.period}`;
}

export default function SettingsPageScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const userName = user?.user_metadata?.full_name || 'User';
  const userEmail = user?.email || '';

  // Screen time settings
  const sleepTime = useOnboardingStore((s) => s.quizAnswers.sleepTime);
  const targetHours = useOnboardingStore((s) => s.quizAnswers.targetHours);
  const familyActivitySelection = useOnboardingStore((s) => s.quizAnswers.familyActivitySelection);

  const [showSleepTimePicker, setShowSleepTimePicker] = useState(false);
  const [tempSleepTime, setTempSleepTime] = useState<SleepTime>(sleepTime);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [tempSelection, setTempSelection] = useState<string | null>(familyActivitySelection);

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
    useOnboardingStore.getState().setAnswer('sleepTime', tempSleepTime);
    setShowSleepTimePicker(false);

    // Reschedule monitoring
    const time24h = convertSleepTimeTo24h(tempSleepTime);
    const [h, m] = time24h.split(':').map(Number);
    scheduleSleepTimeLock(h, m);

    // Sync to Supabase
    if (user?.id) {
      upsertUserRow(user.id, { sleep_time: time24h }).catch((err) =>
        console.warn('[Settings] Failed to sync sleep time:', err)
      );
    }
  };

  const handleSelectTargetHours = (hours: number) => {
    useOnboardingStore.getState().setAnswer('targetHours', hours);
    setShowTargetPicker(false);

    if (user?.id) {
      upsertUserRow(user.id, { target_hours: hours }).catch((err) =>
        console.warn('[Settings] Failed to sync target hours:', err)
      );
    }
  };

  const handleAppPickerDone = () => {
    useOnboardingStore.getState().setAnswer('familyActivitySelection', tempSelection);
    setShowAppPicker(false);

    if (tempSelection) {
      try {
        setFamilyActivitySelectionId({ id: 'onboardingSelection', familyActivitySelection: tempSelection });
        blockSelection({ activitySelectionToken: tempSelection }, 'settingsSelection');
      } catch (error) {
        console.error('[Settings] Error blocking selection:', error);
      }
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
          </View>
        </View>

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
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </Pressable>

            <View style={styles.separator} />

            {/* Daily Target */}
            <Pressable style={styles.row} onPress={() => setShowTargetPicker(true)}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                <Ionicons name="flame" size={20} color="#eab308" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Daily Target</Text>
                <Text style={styles.rowSubtitle}>{targetHours} {targetHours === 1 ? 'hour' : 'hours'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
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
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
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
});
