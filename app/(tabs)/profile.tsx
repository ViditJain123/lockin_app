import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  Pressable,
  ActionSheetIOS,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { Fonts } from '../../constants/Fonts';
import { useAuth } from '../../contexts/AuthContext';
import { updateMaxStreakIfHigher } from '../../lib/supabaseUser';
import { useSessionStore } from '../../store/useSessionStore';
import { useBadgeStore } from '../../store/useBadgeStore';
import { useVideoGalleryStore, resolveUri, type Recording } from '../../store/useVideoGalleryStore';
import { useProfileStatsStore } from '../../store/useProfileStatsStore';
import VideoGridItem from '../../components/VideoGridItem';
import FeaturedBadges from '../../components/FeaturedBadges';
import TimelapsePreviewSheet from '../../components/TimelapsePreviewSheet';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 4;
const GRID_COLUMNS = 3;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 32 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
const PINK = '#FF3B5C';

function formatStat(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m >= 100 ? `${Math.round(m)}M` : `${parseFloat(m.toFixed(1))}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return k >= 100 ? `${Math.round(k)}K` : `${parseFloat(k.toFixed(1))}K`;
  }
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, '');
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [previewUri, setPreviewUri] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const { user } = useAuth();
  const recordings = useVideoGalleryStore((s) => s.recordings);
  const removeRecording = useVideoGalleryStore((s) => s.removeRecording);

  const total_hours = useProfileStatsStore((s) => s.total_hours);
  const grinds = useProfileStatsStore((s) => s.grinds);
  const streak = useProfileStatsStore((s) => s.streak);
  const hasHydrated = useProfileStatsStore((s) => s.hasHydrated);

  const recomputeFromSessions = useProfileStatsStore((s) => s.recomputeFromSessions);
  const fetchAndStoreBaseline = useProfileStatsStore((s) => s.fetchAndStoreBaseline);
  const sessions = useSessionStore((s) => s.sessions);

  const refreshStatsAndBadges = useCallback(async () => {
    if (!user?.id) return;
    try {
      // On first launch with no local sessions, fetch baseline from Tinybird once
      if (sessions.length === 0) {
        console.log('[Profile] refreshStatsAndBadges: no local sessions, fetching baseline');
        await fetchAndStoreBaseline(user.id);
      } else {
        console.log('[Profile] refreshStatsAndBadges: recomputing from', sessions.length, 'local sessions');
        recomputeFromSessions(user.id);
      }

      const currentStats = useProfileStatsStore.getState();
      console.log('[Profile] refreshStatsAndBadges result:', {
        total_hours: currentStats.total_hours,
        grinds: currentStats.grinds,
        streak: currentStats.streak,
        baselineFetched: currentStats.baselineFetched,
      });
      const maxStreak = await updateMaxStreakIfHigher(user.id, currentStats.streak);
      useBadgeStore.getState().checkAndAwardBadges({
        totalHours: currentStats.total_hours,
        totalGrinds: currentStats.grinds,
        currentStreak: maxStreak,
      });
    } catch (err) {
      console.warn('[Profile] Failed to refresh stats/badges:', err);
    }
  }, [user?.id, sessions.length, recomputeFromSessions, fetchAndStoreBaseline]);

  useEffect(() => {
    refreshStatsAndBadges();
  }, [refreshStatsAndBadges]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await refreshStatsAndBadges();
    setRefreshing(false);
  }, [user?.id, refreshStatsAndBadges]);

  const handleTap = useCallback((rec: Recording) => {
    setPreviewUri(resolveUri(rec.videoUri));
    setShowPreview(true);
  }, []);

  const handleLongPress = useCallback((rec: Recording) => {
    if (Platform.OS === 'ios') {
      const videoPath = resolveUri(rec.videoUri);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Share', 'Save to Gallery', 'Delete', 'Cancel'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 3,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            try { await shareAsync(videoPath); } catch {}
          } else if (buttonIndex === 1) {
            try {
              const { status } = await MediaLibrary.requestPermissionsAsync();
              if (status === 'granted') {
                await MediaLibrary.saveToLibraryAsync(videoPath);
                Alert.alert('Saved', 'Video saved to your gallery.');
              }
            } catch {}
          } else if (buttonIndex === 2) {
            Alert.alert('Delete Video', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  removeRecording(rec.id);
                  try { await FileSystem.deleteAsync(videoPath, { idempotent: true }); } catch {}
                  if (rec.thumbnailUri) {
                    try { await FileSystem.deleteAsync(resolveUri(rec.thumbnailUri), { idempotent: true }); } catch {}
                  }
                },
              },
            ]);
          }
        }
      );
    }
  }, [removeRecording]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 8 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View />
          <View style={styles.topBarRight}>
            <Pressable
              style={({ pressed }) => [styles.topBarIcon, pressed && styles.topBarIconPressed]}
              onPress={() => router.push('/trophies-page')}
            >
              <Ionicons name="trophy-outline" size={22} color="#fff" />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.topBarIcon, pressed && styles.topBarIconPressed]}
              onPress={() => router.push('/settings-page')}
            >
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Avatar + Name */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            {user?.user_metadata?.avatar_url ? (
              <Image
                source={{ uri: user.user_metadata.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.user_metadata?.full_name
                    ? user.user_metadata.full_name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : '?'}
                </Text>
              </View>
            )}
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>{hasHydrated && streak != null ? streak : '-'}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.user_metadata?.full_name || 'User'}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{hasHydrated && total_hours != null ? (total_hours < 1 ? Math.round(total_hours * 60) : formatStat(total_hours)) : '-'}</Text>
            <Text style={styles.statLabel}>{hasHydrated && total_hours != null && total_hours < 1 ? 'Mins' : 'Hours'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{hasHydrated && grinds != null ? formatStat(grinds) : '-'}</Text>
            <Text style={styles.statLabel}>Grinds</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{hasHydrated && streak != null ? streak : '-'}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Badge Collection */}
        <FeaturedBadges />

        {/* Video Grid */}
        <View style={styles.gridSection}>
          {recordings.length === 0 ? (
            <View style={styles.emptyGridState}>
              <Ionicons name="videocam-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyGridTitle}>No grinds yet</Text>
              <Text style={styles.emptyGridSubtitle}>
                Start recording to see your grinds here
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {recordings.map((rec) => (
                <VideoGridItem
                  key={rec.id}
                  recording={rec}
                  size={GRID_ITEM_SIZE}
                  onPress={() => handleTap(rec)}
                  onLongPress={() => handleLongPress(rec)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TimelapsePreviewSheet
        visible={showPreview}
        videoUri={previewUri}
        onClose={() => setShowPreview(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 16,
  },
  topBarIcon: {
    padding: 4,
  },
  topBarIconPressed: {
    opacity: 0.5,
    transform: [{ scale: 0.85 }],
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: PINK,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontFamily: Fonts.bold,
    color: 'rgba(255,255,255,0.4)',
  },
  streakBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: PINK,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
  },
  streakBadgeText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  gridSection: {
    minHeight: 200,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  emptyGridState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyGridTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  emptyGridSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
    textAlign: 'center',
  },
});
