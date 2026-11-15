import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import ActionSheet, { type ActionSheetOption } from '@/components/ActionSheet';
import PhotoPreviewSheet from '@/components/PhotoPreviewSheet';
import InitialsAvatar from '@/components/profile/InitialsAvatar';
import StoryViewer, { type StoryItem } from '@/components/profile/StoryViewer';
import TimelapsePreviewSheet from '@/components/TimelapsePreviewSheet';
import { Fonts } from '@/constants/Fonts';
import { cardShadow, RADIUS, T } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { PAGE, useHomePager } from '@/contexts/HomePager';
import { useDemoTimelapses } from '@/lib/demoTimelapses';
import { useFocusByDate } from '@/lib/focusData';
import { buttonPress, optionSelect } from '@/lib/haptics';
import { getContentWidth } from '@/lib/responsive';
import { updateMaxStreakIfHigher } from '@/lib/supabaseUser';
import { computeXP, xpProgressInLevel } from '@/lib/xp';
import { useCrystalStore } from '@/store/useCrystalStore';
import { activeMyStories, useFriendsStore, type Friend } from '@/store/useFriendsStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';
import { useSessionStore } from '@/store/useSessionStore';
import { resolveUri, useVideoGalleryStore, type Recording } from '@/store/useVideoGalleryStore';

const M = 16; // screen margin
const SHEET_PAD = 0;
const GRID_GAP = 8;
const CONTENT_W = getContentWidth();
const TILE_W = (CONTENT_W - M * 2 - SHEET_PAD * 2 - GRID_GAP * 2) / 3;
const TILE_H = Math.round(TILE_W * 1.55);
const STORY = 66;
const ME = 54;

function fmtHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${Math.round(hours)}h`;
}

function fmtMinutes(sec: number) {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtClock(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}h` : `${m}m`;
}

// ─── Pieces ───────────────────────────────────────────────────────────────

/** Same surface as the home screen cards: T.card, hairline rim, soft shadow */
function Card({ style, children, radius = RADIUS.lg, glow }: { style?: any; children?: React.ReactNode; radius?: number; glow?: string }) {
  return (
    <View style={[styles.card, { borderRadius: radius }, style]}>
      {glow ? (
        <>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardEdge}
            pointerEvents="none"
          />
        </>
      ) : null}
      {children}
    </View>
  );
}

/** Same bright glossy orange as the record button on home */
function OrangeChip({ size, icon, iconSize }: { size: number; icon: keyof typeof Ionicons.glyphMap; iconSize: number }) {
  return (
    <View style={[styles.orangeChipGlow, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient
        colors={['#FF9A45', T.orange, '#E04800']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.orangeChip, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
          style={{ position: 'absolute', top: 0, left: size * 0.12, right: size * 0.12, height: size * 0.48, borderRadius: size }}
          pointerEvents="none"
        />
        <Ionicons name={icon} size={iconSize} color={T.white} />
      </LinearGradient>
    </View>
  );
}

function LiveDot() {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1);
  }, [p]);
  const halo = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - p.value), transform: [{ scale: 1 + p.value * 1.6 }] }));
  return (
    <View style={styles.liveDotWrap}>
      <Animated.View style={[styles.liveDot, StyleSheet.absoluteFill, halo]} />
      <View style={styles.liveDot} />
    </View>
  );
}

function StoryBubble({ friend, isNew, onPress }: { friend: Friend; isNew: boolean; onPress: () => void }) {
  const avatar = (
    <View style={styles.storyGap}>
      <InitialsAvatar id={friend.id} name={friend.name} size={STORY} />
    </View>
  );
  return (
    <Pressable onPress={onPress} style={styles.storyItem} accessibilityRole="button" accessibilityLabel={friend.story ? `${friend.name}'s story` : friend.name}>
      {isNew ? (
        <LinearGradient colors={[T.yellow, T.orange, '#FF3D00']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.storyRing}>
          {avatar}
        </LinearGradient>
      ) : (
        <View style={[styles.storyRing, { backgroundColor: friend.story ? 'rgba(255,255,255,0.35)' : 'transparent' }]}>{avatar}</View>
      )}
      {friend.lockedIn ? (
        <View style={styles.liveBadge}>
          <LiveDot />
        </View>
      ) : null}
      <Text style={styles.storyName} numberOfLines={1}>
        {friend.name.split(' ')[0]}
      </Text>
    </Pressable>
  );
}

function Tile({ rec, onPress, onLongPress }: { rec: Recording; onPress: () => void; onLongPress: () => void }) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.96 }] }]}>
      {rec.thumbnailUri ? <Image source={{ uri: resolveUri(rec.thumbnailUri) }} style={StyleSheet.absoluteFill} /> : null}
      <LinearGradient colors={['transparent', 'transparent', 'rgba(0,0,0,0.7)']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <Text style={styles.tileDur}>{fmtClock(rec.sessionDurationSeconds)}</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const pager = useHomePager();
  const { user } = useAuth();
  const userId = user?.id ?? 'you';

  const [refreshing, setRefreshing] = useState(false);
  const [previewUri, setPreviewUri] = useState('');
  const [previewDuration, setPreviewDuration] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [photoPreviewUri, setPhotoPreviewUri] = useState('');
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [actionSheetRec, setActionSheetRec] = useState<Recording | null>(null);
  const [storyPicker, setStoryPicker] = useState(false);
  const [viewer, setViewer] = useState<{ items: StoryItem[]; start: number } | null>(null);

  // Stats
  const recordings = useVideoGalleryStore((s) => s.recordings);
  const removeRecording = useVideoGalleryStore((s) => s.removeRecording);
  const total_hours = useProfileStatsStore((s) => s.total_hours);
  const grinds = useProfileStatsStore((s) => s.grinds);
  const streak = useProfileStatsStore((s) => s.streak);
  const recomputeFromSessions = useProfileStatsStore((s) => s.recomputeFromSessions);
  const fetchAndStoreBaseline = useProfileStatsStore((s) => s.fetchAndStoreBaseline);
  const sessions = useSessionStore((s) => s.sessions);
  const quizName = useOnboardingStore((s) => s.quizAnswers.name);

  // Friends + stories
  const friends = useFriendsStore((s) => s.friends);
  const seenStoryIds = useFriendsStore((s) => s.seenStoryIds);
  const myStoriesRaw = useFriendsStore((s) => s.myStories);
  const fetchFriends = useFriendsStore((s) => s.fetchFriends);
  const postStoryRaw = useFriendsStore((s) => s.postStory);
  const postStory = useCallback(
    (rec: Recording) => {
      if (!rec.videoUri) return;
      postStoryRaw({ id: rec.id, videoUri: resolveUri(rec.videoUri), durationSeconds: rec.sessionDurationSeconds });
    },
    [postStoryRaw]
  );
  const removeStory = useFriendsStore((s) => s.removeStory);
  const markSeen = useFriendsStore((s) => s.markSeen);

  const demoTimelapses = useDemoTimelapses();
  const timelapses = useMemo(() => {
    const real = recordings.filter((r) => r.type === 'timelapse' && r.videoUri);
    return real.length > 0 ? real : demoTimelapses;
  }, [recordings, demoTimelapses]);
  const myStories = useMemo(
    () =>
      activeMyStories(myStoriesRaw)
        .map((st) => ({ st, rec: timelapses.find((r) => r.id === st.recordingId) }))
        .filter((x): x is { st: (typeof myStoriesRaw)[number]; rec: Recording } => !!x.rec?.videoUri),
    [myStoriesRaw, timelapses]
  );
  const postedIds = useMemo(() => new Set(myStories.map((x) => x.rec.id)), [myStories]);
  const myStoryRec = myStories.length ? myStories[myStories.length - 1].rec : null;
  const myStoryLabel = useMemo(() => {
    if (myStories.length === 0) return 'Add story';
    if (myStories.some((x) => x.st.status === 'failed')) return 'Tap to retry';
    const uploading = myStories.find((x) => x.st.status === 'uploading');
    if (uploading) return `Posting ${Math.round((uploading.st.progress ?? 0) * 100)}%`;
    return myStories.length > 1 ? `Your story · ${myStories.length}` : 'Your story';
  }, [myStories]);

  const refreshStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      if (sessions.length === 0) await fetchAndStoreBaseline(user.id);
      else recomputeFromSessions(user.id);
      const st = useProfileStatsStore.getState();
      await updateMaxStreakIfHigher(user.id, st.streak);
      useCrystalStore.getState().checkAndAwardCrystals({ totalHours: st.total_hours, totalGrinds: st.grinds });
    } catch (err) {
      console.warn('[Profile] Failed to refresh stats:', err);
    }
  }, [user?.id, sessions.length, recomputeFromSessions, fetchAndStoreBaseline]);

  useEffect(() => {
    refreshStats();
    if (user?.id) fetchFriends(user.id);
  }, [refreshStats, user?.id, fetchFriends]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await Promise.all([refreshStats(), fetchFriends(user.id)]);
    setRefreshing(false);
  }, [user?.id, refreshStats, fetchFriends]);

  // ─── Identity ───────────────────────────────────────────────────────────
  const displayName =
    quizName?.trim() || (user?.user_metadata?.full_name as string | undefined)?.trim() || 'You';
  const { level, fraction: levelFraction } = xpProgressInLevel(computeXP({ totalHours: total_hours ?? 0, totalGrinds: grinds ?? 0 }));

  // ─── Timelapse grid ─────────────────────────────────────────────────────
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

  const actionSheetOptions: ActionSheetOption[] = useMemo(() => {
    const rec = actionSheetRec;
    if (!rec) return [];
    const isPhoto = rec.type === 'photo';
    const sharePath = isPhoto ? (rec.cardUri ? resolveUri(rec.cardUri) : null) : rec.videoUri ? resolveUri(rec.videoUri) : null;
    if (!sharePath) return [];
    const deleteLabel = isPhoto ? 'Delete Photo' : 'Delete Video';

    const opts: ActionSheetOption[] = [];
    if (!isPhoto) {
      if (!postedIds.has(rec.id)) opts.push({ label: 'Add to your story', onPress: () => postStory(rec) });
    }
    opts.push(
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
              Alert.alert('Saved', isPhoto ? 'Photo saved to your gallery.' : 'Video saved to your gallery.');
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
                removeStory(rec.id);
                const paths = isPhoto ? [rec.photoUri, rec.cardUri] : [rec.videoUri, rec.thumbnailUri];
                for (const p of paths) {
                  if (!p) continue;
                  try {
                    await FileSystem.deleteAsync(resolveUri(p), { idempotent: true });
                  } catch {}
                }
              },
            },
          ]);
        },
      }
    );
    return opts;
  }, [actionSheetRec, removeRecording, postStory, removeStory, postedIds]);

  // ─── Stories ────────────────────────────────────────────────────────────
  // Timelapses you haven't put in your story yet, newest first
  const storyPickerOptions: ActionSheetOption[] = useMemo(
    () =>
      [...timelapses]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter((r) => !postedIds.has(r.id))
        .slice(0, 5)
        .map((r) => ({
          label: `Add ${fmtMinutes(r.sessionDurationSeconds)} timelapse · ${new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          onPress: () => postStory(r),
        })),
    [timelapses, postedIds, postStory]
  );

  const addStory = () => {
    optionSelect();
    if (timelapses.length === 0) {
      Alert.alert('No timelapse yet', 'Record a timelapse session, then add it here for your friends.');
      return;
    }
    if (storyPickerOptions.length === 0) {
      Alert.alert('All in', 'Every timelapse you have is already in your story.');
      return;
    }
    setStoryPicker(true);
  };

  const viewMyStories = () => {
    optionSelect();
    if (myStories.length === 0) return addStory();
    // An upload that didn't go through: tapping tries again
    const failed = myStories.filter((x) => x.st.status === 'failed');
    if (failed.length > 0) {
      failed.forEach((x) => postStory(x.rec));
      return;
    }
    setViewer({
      start: 0,
      items: myStories.map(({ st, rec }) => ({
        key: `mine-${st.recordingId}`,
        userId,
        name: displayName,
        videoUri: resolveUri(rec.videoUri!),
        durationSeconds: rec.sessionDurationSeconds,
        createdAt: st.createdAt,
        isMine: true,
        storyId: st.storyId,
        viewCount: st.viewCount,
      })),
    });
  };

  const onFriend = (f: Friend) => {
    optionSelect();
    if (!f.story) return;
    // Play every friend story in strip order, starting at the tapped one
    const withStories = [...friends]
      .filter((x) => x.story)
      .sort((a, b) => Number(seenStoryIds.includes(a.story!.id)) - Number(seenStoryIds.includes(b.story!.id)));
    // Each friend's stories play oldest to newest
    const items: StoryItem[] = withStories.flatMap((x) =>
      (x.stories?.length ? x.stories : [x.story!]).map((st) => ({
        key: st.id,
        userId: x.id,
        name: x.name,
        videoUri: st.videoUrl,
        durationSeconds: st.durationSeconds,
        createdAt: st.createdAt,
      }))
    );
    setViewer({ items, start: Math.max(0, items.findIndex((it) => it.userId === f.id)) });
  };



  const goInvite = () => {
    buttonPress();
    router.push('/add-friends' as any);
  };


  const focusByDate = useFocusByDate();
  // Lifetime minutes locked in (sessions + demo history in dev)
  const lifetimeHours = useMemo(() => {
    let mins = 0;
    for (const m of Object.values(focusByDate)) mins += m;
    return Math.max(total_hours ?? 0, mins / 60);
  }, [focusByDate, total_hours]);

  const sortedTimelapses = useMemo(
    () => [...timelapses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [timelapses]
  );

  // Live friends first, then fresh stories, then everyone else
  const orderedFriends = useMemo(() => {
    const score = (f: Friend) => (f.lockedIn ? 0 : f.story && !seenStoryIds.includes(f.story.id) ? 1 : f.story ? 2 : 3);
    return [...friends].sort((a, b) => score(a) - score(b));
  }, [friends, seenStoryIds]);

  const goFriends = () => {
    optionSelect();
    router.push('/friends' as any);
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.white} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {(
            <Pressable
              onPress={() => (pager ? pager.goTo(PAGE.home) : router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={10}
              style={{ marginRight: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={26} color={T.white} />
            </Pressable>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.subRow}>
              <Text style={styles.subLevel}>LV {level}</Text>
              <View style={styles.subDot} />
              <Ionicons name="flame" size={12} color={T.orange} />
              <Text style={styles.subText}>
                {streak ?? 0} day streak
              </Text>
            </View>
          </View>
          <Pressable onPress={goInvite} hitSlop={8} accessibilityRole="button" accessibilityLabel="Add friends">
            <Card radius={14} style={styles.inviteBtn}>
              <View style={styles.inviteInner}>
                <Ionicons name="person-add-outline" size={19} color={T.ink} />
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Stories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
          <View style={styles.storyItem}>
            <Pressable onPress={viewMyStories} accessibilityRole="button" accessibilityLabel={myStoryRec ? 'View your story' : 'Add a story'}>
              {myStoryRec?.thumbnailUri ? (
                <LinearGradient colors={[T.yellow, T.orange, '#FF3D00']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.storyRing}>
                  <View style={styles.storyGap}>
                    <Image source={{ uri: resolveUri(myStoryRec.thumbnailUri) }} style={styles.myThumb} />
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.storyRing}>
                  <View style={styles.addStory}>
                    <Ionicons name="add" size={30} color={T.orange} />
                  </View>
                </View>
              )}
            </Pressable>
            {myStoryRec ? (
              <Pressable onPress={addStory} hitSlop={8} style={styles.addBadge} accessibilityRole="button" accessibilityLabel="Add to your story">
                <Ionicons name="add" size={16} color={T.white} />
              </Pressable>
            ) : null}
            <Text style={styles.storyName} numberOfLines={1}>{myStoryLabel}</Text>
          </View>
          {orderedFriends.map((f) => (
            <StoryBubble key={f.id} friend={f} isNew={!!f.story && !seenStoryIds.includes(f.story.id)} onPress={() => onFriend(f)} />
          ))}
        </ScrollView>

        {/* Stat cards */}
        <View style={styles.bento}>
          <Svg style={styles.bentoGlow} width={CONTENT_W + 80} height={212 + 140} pointerEvents="none">
            <Defs>
              <RadialGradient id="bentoGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0" stopColor={T.orange} stopOpacity={0.55} />
                <Stop offset="0.45" stopColor={T.orange} stopOpacity={0.22} />
                <Stop offset="1" stopColor={T.orange} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#bentoGlow)" />
          </Svg>
          <Pressable onPress={() => router.push('/analytics' as any)} style={{ flex: 1.1 }} accessibilityRole="button" accessibilityLabel="Lifetime hours locked in">
            <Card style={styles.bigCard} glow="glowBig">
              <View style={styles.cardPad}>
                <Text style={styles.bigValue}>
                  {fmtHours(lifetimeHours).slice(0, -1)}
                  <Text style={styles.bigUnit}>{fmtHours(lifetimeHours).slice(-1)}</Text>
                </Text>
                <Text style={styles.bigLabel}>Locked in{'\n'}lifetime</Text>
                <View style={{ flex: 1 }} />
                <OrangeChip size={40} icon="time" iconSize={18} />
              </View>
            </Card>
          </Pressable>
          <View style={styles.bentoCol}>
            <Card style={styles.smallCard} glow="glowSmall">
              <View style={styles.smallPad}>
                <View>
                  <Text style={styles.smallValue}>{timelapses.length}</Text>
                  <Text style={styles.smallLabel}>Timelapses</Text>
                </View>
                <OrangeChip size={34} icon="videocam" iconSize={16} />
              </View>
            </Card>
            <Pressable onPress={goFriends} accessibilityRole="button" accessibilityLabel={`${friends.length} friends`}>
              <Card style={styles.smallCard} glow="glowSmall2">
                <View style={styles.smallPad}>
                  <View>
                    <Text style={styles.smallValue}>{friends.length}</Text>
                    <Text style={styles.smallLabel}>Friends</Text>
                  </View>
                  <OrangeChip size={34} icon="people" iconSize={16} />
                </View>
              </Card>
            </Pressable>
          </View>
        </View>

        {/* Timelapses on a white sheet */}
        <View style={styles.sheet}>

          {sortedTimelapses.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="videocam" size={22} color={T.orange} />
              </View>
              <Text style={styles.emptyTitle}>No timelapses yet</Text>
              <Text style={styles.emptySub}>Record a session and it lands here, ready for your story.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {sortedTimelapses.map((rec) => (
                <Tile
                  key={rec.id}
                  rec={rec}
                  onPress={() => handleTap(rec)}
                  onLongPress={() => setActionSheetRec(rec)}
                />
              ))}
            </View>
          )}
          {sortedTimelapses.length > 0 ? <Text style={styles.hint}>Hold a timelapse to post it to your story</Text> : null}
        </View>
      </ScrollView>

      <TimelapsePreviewSheet visible={showPreview} videoUri={previewUri} sessionDurationSeconds={previewDuration} onClose={() => setShowPreview(false)} />
      <PhotoPreviewSheet visible={showPhotoPreview} cardUri={photoPreviewUri} onClose={() => setShowPhotoPreview(false)} />
      <ActionSheet visible={actionSheetRec !== null && actionSheetOptions.length > 0} onClose={() => setActionSheetRec(null)} options={actionSheetOptions} />
      <ActionSheet visible={storyPicker} onClose={() => setStoryPicker(false)} options={storyPickerOptions} />

      {viewer ? (
        <StoryViewer
          visible
          stories={viewer.items}
          startIndex={viewer.start}
          onClose={() => setViewer(null)}
          onSeen={markSeen}
          onDeleteMine={(story) => {
            removeStory(story.key.replace(/^mine-/, ''));
            setViewer(null);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.canvas,
    overflow: 'hidden',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: M + 4,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: T.white,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  subLevel: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    color: T.yellow,
  },
  subDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 2,
  },
  subText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.75)',
  },
  inviteBtn: {
    width: 42,
    height: 42,
  },
  inviteInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addBadge: {
    position: 'absolute',
    top: STORY - 14,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.orange,
    borderWidth: 2,
    borderColor: T.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stories
  stories: {
    gap: 12,
    paddingHorizontal: M + 2,
    paddingTop: 22,
    paddingBottom: 4,
  },
  storyItem: {
    width: STORY + 12,
    alignItems: 'center',
  },
  storyRing: {
    padding: 2.5,
    borderRadius: 999,
  },
  storyGap: {
    padding: 2.5,
    borderRadius: 999,
    backgroundColor: T.canvas,
  },
  addStory: {
    width: STORY + 5,
    height: STORY + 5,
    borderRadius: (STORY + 5) / 2,
    backgroundColor: T.card,
    borderWidth: 1.5,
    borderColor: T.lineStrong,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myThumb: {
    width: STORY,
    height: STORY,
    borderRadius: STORY / 2,
  },
  storyName: {
    marginTop: 7,
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: T.inkSoft,
  },
  liveBadge: {
    position: 'absolute',
    top: STORY - 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#14100C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotWrap: {
    width: 8,
    height: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.good,
  },

  // Bento
  bento: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: M,
    marginTop: 22,
  },
  bentoGlow: {
    position: 'absolute',
    top: -70,
    left: -40,
  },
  bentoCol: {
    flex: 1,
    gap: 12,
  },
  card: {
    backgroundColor: T.card,
    overflow: 'hidden',
    ...cardShadow,
  },
  bigCard: {
    height: 212,
  },
  cardEdge: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
  },
  bigUnit: {
    fontSize: 34,
    color: T.orange,
  },
  cardPad: {
    flex: 1,
    padding: 18,
  },
  bigValue: {
    fontFamily: Fonts.display,
    fontSize: 64,
    lineHeight: 64,
    color: T.ink,
  },
  bigLabel: {
    marginTop: 2,
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    lineHeight: 19,
    color: T.inkSoft,
  },
  chip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallCard: {
    height: 100,
  },
  smallPad: {
    flex: 1,
    padding: 14,
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  smallValue: {
    fontFamily: Fonts.display,
    fontSize: 40,
    lineHeight: 42,
    color: T.white,
  },
  smallLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: T.inkSoft,
  },
  orangeChipGlow: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  orangeChip: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,220,180,0.5)',
  },
  chipSm: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Timelapse grid
  sheet: {
    marginTop: 18,
    marginHorizontal: M,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: T.white,
    borderWidth: 2,
    borderColor: T.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tileDur: {
    position: 'absolute',
    left: 10,
    bottom: 8,
    fontFamily: Fonts.display,
    fontSize: 22,
    color: T.white,
  },
  hint: {
    marginTop: 2,
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: T.inkMute,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,102,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: T.ink,
  },
  emptySub: {
    marginTop: 4,
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: T.inkMute,
    textAlign: 'center',
  },
});
