import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '../constants/Fonts';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = 'https://tsojozycisspcfmabtku.supabase.co';

export default function SettingsPageScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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
        {
          text: 'Cancel',
          style: 'cancel',
        },
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

      {/* Settings List */}
      <View style={styles.content}>
        <TouchableOpacity onPress={handleLogout} style={styles.settingsRow}>
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
          style={[styles.settingsRow, styles.deleteRow]}
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
      </View>
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
    paddingTop: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  settingsRowText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: 'white',
  },
  deleteRow: {
    marginTop: 12,
  },
  deleteIconContainer: {
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
  },
});
