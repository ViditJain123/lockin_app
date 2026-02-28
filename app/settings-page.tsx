import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DeviceActivitySelectionView,
  blockSelection,
  isAvailable as isDeviceActivityAvailable,
} from 'react-native-device-activity';

import { Fonts } from '../constants/Fonts';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { initializeDailyBlock } from '../lib/blockingService';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useEarnedTimeStore } from '../store/useEarnedTimeStore';

const SUPABASE_URL = 'https://tsojozycisspcfmabtku.supabase.co';

export default function SettingsPageScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const userEmail = user?.email;
  const userName = user?.user_metadata?.full_name || 'User';
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAppPickerVisible, setIsAppPickerVisible] = useState(false);
  const [tempSelection, setTempSelection] = useState<string | null>(null);

  // Onboarding store for app selection
  const quizAnswers = useOnboardingStore((s) => s.quizAnswers);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  // Earned time store
  const earnedTimeToday = useEarnedTimeStore((s) => s.earnedTimeToday);
  const usedTimeToday = useEarnedTimeStore((s) => s.usedTimeToday);
  const totalGrindSecondsToday = useEarnedTimeStore((s) => s.totalGrindSecondsToday);
  const remainingMinutes = Math.floor(Math.max(0, earnedTimeToday - usedTimeToday) / 60);

  // Daily target progress
  const targetHours = quizAnswers.targetHours || 4;
  const targetSeconds = targetHours * 3600;
  const targetProgress = Math.min(1, totalGrindSecondsToday / targetSeconds);
  const targetReached = totalGrindSecondsToday >= targetSeconds;

  // Format time for display
  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.access_token) {
                throw new Error('No active session');
              }

              const response = await fetch(
                `${SUPABASE_URL}/functions/v1/delete-user`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete account');
              }

              await signOut();
            } catch (error) {
              setIsDeleting(false);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete account. Please try again.'
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleOpenAppPicker = () => {
    setTempSelection(quizAnswers.familyActivitySelection);
    setIsAppPickerVisible(true);
  };

  const handleAppPickerDone = () => {
    if (tempSelection) {
      setAnswer('familyActivitySelection', tempSelection);
      // Re-block with new selection
      try {
        blockSelection({ activitySelectionToken: tempSelection });
        initializeDailyBlock(tempSelection);
      } catch (error) {
        console.error('Error updating blocked apps:', error);
      }
    }
    setIsAppPickerVisible(false);
  };

  const showDeviceActivitySettings = Platform.OS === 'ios' && isDeviceActivityAvailable();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>Today's Screen Time</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatMinutes(earnedTimeToday)}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatMinutes(usedTimeToday)}</Text>
              <Text style={styles.statLabel}>Used</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statValueHighlight]}>{remainingMinutes}m</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        {/* Screen Time Settings Section */}
        {showDeviceActivitySettings && (
          <>
            <Text style={styles.sectionTitle}>Screen Time</Text>

            {/* Modify Blocked Apps */}
            <TouchableOpacity onPress={handleOpenAppPicker} style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <View style={[styles.iconContainer, styles.blueIconContainer]}>
                  <Ionicons name="apps-outline" size={22} color="#007AFF" />
                </View>
                <View>
                  <Text style={styles.settingsRowText}>Blocked Apps</Text>
                  <Text style={styles.settingsRowSubtext}>Modify which apps are blocked</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>

            {/* Daily Target */}
            <View style={[styles.settingsRow, styles.marginTop]}>
              <View style={styles.settingsRowLeft}>
                <View style={[styles.iconContainer, styles.greenIconContainer]}>
                  <Ionicons name="flag-outline" size={22} color="#34C759" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsRowText}>Daily Target: {targetHours}hr</Text>
                  <Text style={styles.settingsRowSubtext}>
                    {targetReached
                      ? 'Target reached! Phone unlocked'
                      : `${formatMinutes(totalGrindSecondsToday)} / ${targetHours}hr grind today`}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { width: `${targetProgress * 100}%` }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Rate Info */}
            <View style={[styles.settingsRow, styles.marginTop]}>
              <View style={styles.settingsRowLeft}>
                <View style={[styles.iconContainer, styles.greenIconContainer]}>
                  <Ionicons name="time-outline" size={22} color="#34C759" />
                </View>
                <View>
                  <Text style={styles.settingsRowText}>Rate: 4:1</Text>
                  <Text style={styles.settingsRowSubtext}>1hr work = 15min screen time</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>

        {/* Account Info */}
        <View style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <View style={[styles.iconContainer, styles.blueIconContainer]}>
              <Ionicons name="person-outline" size={22} color="#007AFF" />
            </View>
            <View>
              <Text style={styles.settingsRowText}>{userName}</Text>
              {userEmail && (
                <Text style={styles.settingsRowSubtext}>{userEmail}</Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={[styles.settingsRow, styles.marginTop]}>
          <View style={styles.settingsRowLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="log-out-outline" size={22} color="#FF3B5C" />
            </View>
            <Text style={styles.settingsRowText}>Log Out</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.4)" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={[styles.settingsRow, styles.marginTop]}
          disabled={isDeleting}
        >
          <View style={styles.settingsRowLeft}>
            <View style={[styles.iconContainer, styles.deleteIconContainer]}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FF3B5C" />
              ) : (
                <Ionicons name="trash-outline" size={22} color="#FF3B5C" />
              )}
            </View>
            <Text style={styles.settingsRowText}>
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.4)" />
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>

      {/* App Selection Modal */}
      <Modal
        visible={isAppPickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAppPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsAppPickerVisible(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Apps</Text>
            <TouchableOpacity onPress={handleAppPickerDone} style={styles.modalDoneButton}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
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
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: 'white',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Stats Card
  statsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  statsCardTitle: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: 'white',
    marginBottom: 4,
  },
  statValueHighlight: {
    color: '#FF3B5C',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Section
  sectionTitle: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Settings Rows
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  marginTop: {
    marginTop: 12,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  blueIconContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  greenIconContainer: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  deleteIconContainer: {
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
  },
  settingsRowText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: 'white',
  },
  settingsRowSubtext: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  // Progress bar for daily target
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCancelButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 17,
    fontFamily: Fonts.regular,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: 'white',
  },
  modalDoneButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  modalDoneText: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: '#007AFF',
  },
  pickerContainer: {
    flex: 1,
  },
  picker: {
    flex: 1,
  },
});
