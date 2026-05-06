import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import ActionSheet, { type ActionSheetOption } from '@/components/ActionSheet';
import CrystalGrid from '@/components/CrystalGrid';
import { LCChip } from '@/components/lc/LCChip';
import PhotoPreviewSheet from '@/components/PhotoPreviewSheet';
import TimelapsePreviewSheet from '@/components/TimelapsePreviewSheet';
import VideoGridItem from '@/components/VideoGridItem';
import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { useAuth } from '@/contexts/AuthContext';
import { getContentWidth } from '@/lib/responsive';
import { updateMaxStreakIfHigher } from '@/lib/supabaseUser';
import { useCrystalStore } from '@/store/useCrystalStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';
import { useSessionStore } from '@/store/useSessionStore';
import { resolveUri, useVideoGalleryStore, type Recording } from '@/store/useVideoGalleryStore';

const GRID_GAP = 4;
const GRID_COLUMNS = 3;
const GRID_H_PADDING = 16;
const GRID_ITEM_WIDTH =
  (getContentWidth() - GRID_H_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

function formatHoursColon(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function SettingsGear({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={LC.text} strokeWidth={1.8} />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={LC.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type ProfileViewMode = 'timelapses' | 'medals';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [previewUri, setPreviewUri] = useState('');
  const [previewDuration, setPreviewDuration] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [photoPreviewUri, setPhotoPreviewUri] = useState('');
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [viewMode, setViewMode] = useState<ProfileViewMode>('timelapses');
  const [actionSheetRec, setActionSheetRec] = useState<Recording | null>(null);

  // Honor `?tab=medals` query param (set by Home → LockinXPCard tap).
  const params = useLocalSearchParams<{ tab?: string }>();
  useEffect(() => {
    if (params?.tab === 'medals') setViewMode('medals');
    else if (params?.tab === 'timelapses') setViewMode('timelapses');
  }, [params?.tab]);

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
      if (sessions.length === 0) {
        await fetchAndStoreBaseline(user.id);
      } else {
        recomputeFromSessions(user.id);
      }
      const currentStats = useProfileStatsStore.getState();
      await updateMaxStreakIfHigher(user.id, currentStats.streak);
      useCrystalStore.getState().checkAndAwardCrystals({
        totalHours: currentStats.total_hours,
        totalGrinds: currentStats.grinds,
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
    if (rec.type === 'photo') {
      const path = rec.cardUri ?? rec.thumbnailUri;
      if (!path) return;
      setPhotoPreviewUri(resolveUri(path));
      setShowPhotoPreview(true);
      return;
    }
    if (!rec.videoUri) return;
    setPreviewUri(resolveUri(rec.videoUri));
    setPreviewDuration(rec.sessionDurationSeconds);
    setShowPreview(true);
  }, []);

  const handleLongPress = useCallback((rec: Recording) => {
    setActionSheetRec(rec);
  }, []);

  const actionSheetOptions: ActionSheetOption[] = React.useMemo(() => {
    const rec = actionSheetRec;
    if (!rec) return [];
    const isPhoto = rec.type === 'photo';
    const sharePath = isPhoto
      ? rec.cardUri
        ? resolveUri(rec.cardUri)
        : null
      : rec.videoUri
        ? resolveUri(rec.videoUri)
        : null;
    if (!sharePath) return [];

    const deleteLabel = isPhoto ? 'Delete Photo' : 'Delete Video';
    const savedLabel = isPhoto ? 'Photo saved to your gallery.' : 'Video saved to your gallery.';

    return [
      {
        label: 'Share',
        onPress: async () => {
          try {
            await shareAsync(sharePath, isPhoto ? { mimeType: 'image/jpeg' } : undefined);
          } catch {}
        },
      },
      {
        label: 'Save to Gallery',
        onPress: async () => {
          try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
              await MediaLibrary.saveToLibraryAsync(sharePath);
              Alert.alert('Saved', savedLabel);
            }
          } catch {}
        },
      },
      {
        label: deleteLabel,
        destructive: true,
        onPress: () => {
          Alert.alert(deleteLabel, 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                removeRecording(rec.id);
                // Photos: delete both raw photo and rendered card.
                // Timelapses: delete the .mp4 plus the thumbnail.
                if (isPhoto) {
                  if (rec.photoUri) {
                    try {
                      await FileSystem.deleteAsync(resolveUri(rec.photoUri), {
                        idempotent: true,
                      });
                    } catch {}
                  }
                  if (rec.cardUri) {
                    try {
                      await FileSystem.deleteAsync(resolveUri(rec.cardUri), {
                        idempotent: true,
                      });
                    } catch {}
                  }
                } else {
                  try {
                    await FileSystem.deleteAsync(sharePath, { idempotent: true });
                  } catch {}
                  if (rec.thumbnailUri) {
                    try {
                      await FileSystem.deleteAsync(resolveUri(rec.thumbnailUri), {
                        idempotent: true,
                      });
                    } catch {}
                  }
                }
              },
            },
          ]);
        },
      },
    ];
  }, [actionSheetRec, removeRecording]);

  // ─── Derived values ─────────────────────────────────────────────────────

  const displayName: string =
    (user?.user_metadata?.full_name as string | undefined)?.trim() || 'User';
  const initial = displayName.charAt(0).toUpperCase() || '?';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const sessionsText =
    hasHydrated && grinds != null ? String(grinds).padStart(2, '0') : '—';
  const hoursText =
    hasHydrated && total_hours != null ? formatHoursColon(total_hours) : '—';
  const streakText =
    hasHydrated && streak != null ? String(streak).padStart(2, '0') : '—';

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LC.text} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.brandMark}>
            LOCKIN<Text style={styles.brandMarkAccent}>CLUB</Text>
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings-page')}
            style={({ pressed }) => [styles.gearBtn, pressed && styles.pressed]}
            hitSlop={10}
          >
            <SettingsGear size={16} />
          </Pressable>
        </View>

        {/* Identity row: avatar + name + streak chip */}
        <View style={styles.identityRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarShadow}>
              <LinearGradient
                colors={[LC.red, LC.redDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <View style={styles.avatarHighlight} pointerEvents="none" />
                <Text style={styles.avatarInitial}>{initial}</Text>
              </LinearGradient>
            </View>
          )}
          <View style={styles.nameBlock}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName.toUpperCase()}
            </Text>
            {hasHydrated && streak != null && streak > 0 ? (
              <View style={styles.chipsRow}>
                <LCChip tone="red">{`🔥 ${streak} DAY STREAK`}</LCChip>
              </View>
            ) : null}
          </View>
        </View>

        {/* Counters strip */}
        <View style={styles.countersRow}>
          <View style={styles.counterCell}>
            <Text style={styles.counterValue}>{sessionsText}</Text>
            <Text style={styles.counterLabel}>SESSIONS</Text>
          </View>
          <View style={styles.counterDivider} />
          <View style={styles.counterCell}>
            <Text style={styles.counterValue}>{hoursText}</Text>
            <Text style={styles.counterLabel}>TOTAL HRS</Text>
          </View>
          <View style={styles.counterDivider} />
          <View style={styles.counterCell}>
            <Text style={styles.counterValue}>{streakText}</Text>
            <Text style={styles.counterLabel}>STREAK</Text>
          </View>
        </View>

        {/* Tabs — inline toggle, no navigation */}
        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => setViewMode('timelapses')}
            style={({ pressed }) => [
              viewMode === 'timelapses' ? styles.tabActiveWrap : styles.tabWrap,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Timelapses"
          >
            <Text
              style={[
                styles.tabLabel,
                viewMode === 'timelapses' && styles.tabLabelActive,
              ]}
            >
              TIMELAPSES
            </Text>
            {viewMode === 'timelapses' ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
          <Pressable
            onPress={() => setViewMode('medals')}
            style={({ pressed }) => [
              viewMode === 'medals' ? styles.tabActiveWrap : styles.tabWrap,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Medals"
          >
            <Text
              style={[styles.tabLabel, viewMode === 'medals' && styles.tabLabelActive]}
            >
              MEDALS
            </Text>
            {viewMode === 'medals' ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
        </View>

        {/* Content swap */}
        {viewMode === 'timelapses' ? (
          <View style={styles.gridSection}>
            {recordings.length === 0 ? (
              <View style={styles.emptyGridState}>
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyBoxLabel}>no grinds yet</Text>
                </View>
                <Text style={styles.emptySubtitle}>
                  Hit LOCK IN to start a session. Your timelapses land here.
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {recordings.map((rec) => (
                  <VideoGridItem
                    key={rec.id}
                    recording={rec}
                    width={GRID_ITEM_WIDTH}
                    onPress={() => handleTap(rec)}
                    onLongPress={() => handleLongPress(rec)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.medalsSection}>
            <CrystalGrid />
          </View>
        )}
      </ScrollView>

      <TimelapsePreviewSheet
        visible={showPreview}
        videoUri={previewUri}
        sessionDurationSeconds={previewDuration}
        onClose={() => setShowPreview(false)}
      />

      <PhotoPreviewSheet
        visible={showPhotoPreview}
        cardUri={photoPreviewUri}
        onClose={() => setShowPhotoPreview(false)}
      />

      <ActionSheet
        visible={actionSheetRec !== null && actionSheetOptions.length > 0}
        onClose={() => setActionSheetRec(null)}
        options={actionSheetOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LC.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandMark: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    letterSpacing: 2.5,
    color: LC.text,
    textTransform: 'uppercase',
  },
  brandMarkAccent: {
    color: LC.red,
  },
  gearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  // Identity row
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 14,
    paddingBottom: 20,
  },
  avatarShadow: {
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
    borderRadius: 32,
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarInitial: {
    fontFamily: Fonts.display,
    fontSize: 34,
    lineHeight: 36,
    color: '#fff',
    textAlign: 'center',
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: LC.bgCard,
  },
  nameBlock: {
    flex: 1,
  },
  userName: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 30,
    color: LC.text,
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  // Counters
  countersRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 18,
  },
  counterCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  counterValue: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 26,
    color: LC.text,
    letterSpacing: 0.5,
  },
  counterLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    color: LC.textMute,
    letterSpacing: 1.5,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  counterDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: LC.border,
  },
  // Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: LC.border,
    marginBottom: 12,
  },
  tabActiveWrap: {
    paddingBottom: 10,
    position: 'relative',
  },
  tabWrap: {
    paddingBottom: 10,
  },
  tabLabel: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: LC.text,
  },
  tabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    backgroundColor: LC.red,
  },
  // Grid
  gridSection: {
    marginHorizontal: -4,
    paddingHorizontal: 0,
  },
  medalsSection: {
    marginHorizontal: -20,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  emptyGridState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyBox: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: LC.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBoxLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  emptySubtitle: {
    fontFamily: Fonts.interRegular,
    fontSize: 13,
    color: LC.textMute,
    textAlign: 'center',
  },
});
