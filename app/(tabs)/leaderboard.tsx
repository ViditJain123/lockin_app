import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { useAuth } from '@/contexts/AuthContext';
import {
  useLeaderboardStore,
  type LeaderboardUser,
} from '@/store/useLeaderboardStore';

const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

function getCurrentMonthLabel(): string {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

function formatHoursColon(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0:00';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function padRank(rank: number): string {
  return rank < 10 ? `0${rank}` : String(rank);
}

// ─── Podium (#1) ──────────────────────────────────────────────────────────

function PodiumCard({
  entry,
  isYou,
}: {
  entry: LeaderboardUser;
  isYou: boolean;
}) {
  return (
    <View style={[podium.wrap, isYou && podium.youWrap]}>
      <Text style={podium.watermark} numberOfLines={1}>
        01
      </Text>
      <View style={podium.row}>
        <Text style={podium.rank}>01</Text>
        <View style={podium.nameBlock}>
          <Text style={podium.name} numberOfLines={1}>
            {(entry.display_name || 'Anonymous').toUpperCase()}
          </Text>
          {isYou ? <Text style={podium.youTag}>YOU</Text> : null}
        </View>
        <View style={podium.hoursBlock}>
          <Text style={podium.hoursValue}>{formatHoursColon(entry.total_hours)}</Text>
          <Text style={podium.hoursLabel}>HOURS</Text>
        </View>
      </View>
    </View>
  );
}

const podium = StyleSheet.create({
  wrap: {
    position: 'relative',
    padding: 18,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,59,92,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.35)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  youWrap: {
    backgroundColor: 'rgba(255,59,92,0.14)',
    borderColor: 'rgba(255,59,92,0.5)',
  },
  watermark: {
    position: 'absolute',
    right: -8,
    top: -24,
    fontFamily: Fonts.display,
    fontSize: 180,
    lineHeight: 160,
    color: 'rgba(255,59,92,0.07)',
    letterSpacing: -4,
  },
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rank: {
    fontFamily: Fonts.display,
    fontSize: 56,
    lineHeight: 66,
    color: LC.red,
    letterSpacing: -2,
    includeFontPadding: false,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: LC.text,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  youTag: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: LC.red,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  hoursBlock: {
    alignItems: 'flex-end',
  },
  hoursValue: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 30,
    color: LC.text,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  hoursLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    color: LC.textMute,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});

// ─── Elevated row (#2, #3) ────────────────────────────────────────────────

function ElevatedRow({
  entry,
  isYou,
}: {
  entry: LeaderboardUser;
  isYou: boolean;
}) {
  return (
    <View style={[elevated.row, isYou && elevated.youRow]}>
      <Text style={elevated.rank}>{padRank(entry.rank)}</Text>
      <View style={elevated.nameBlock}>
        <Text
          style={[elevated.name, isYou && elevated.nameYou]}
          numberOfLines={1}
        >
          {entry.display_name || 'Anonymous'}
        </Text>
        {isYou ? <Text style={elevated.youSub}>YOU</Text> : null}
      </View>
      <Text style={elevated.hours}>{formatHoursColon(entry.total_hours)}</Text>
    </View>
  );
}

const elevated = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    marginBottom: 6,
  },
  youRow: {
    backgroundColor: 'rgba(255,59,92,0.1)',
    borderColor: 'rgba(255,59,92,0.4)',
  },
  rank: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 34,
    color: LC.text,
    width: 36,
    textAlign: 'center',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: Fonts.interMedium,
    fontSize: 14,
    color: LC.text,
  },
  nameYou: {
    fontFamily: Fonts.interBold,
    color: LC.text,
  },
  youSub: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: LC.red,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  hours: {
    fontFamily: Fonts.monoMedium,
    fontSize: 13,
    color: LC.text,
    letterSpacing: 0.5,
  },
});

// ─── Plain row (#4+) ──────────────────────────────────────────────────────

function PlainRow({
  entry,
  isYou,
}: {
  entry: LeaderboardUser;
  isYou: boolean;
}) {
  return (
    <View style={[plain.row, isYou && plain.youRow]}>
      <Text style={[plain.rank, isYou && plain.rankYou]}>
        {isYou ? `#${entry.rank}` : String(entry.rank)}
      </Text>
      <View style={plain.nameBlock}>
        <Text
          style={[plain.name, isYou && plain.nameYou]}
          numberOfLines={1}
        >
          {entry.display_name || 'Anonymous'}
        </Text>
      </View>
      <Text style={[plain.hours, isYou && plain.hoursYou]}>
        {formatHoursColon(entry.total_hours)}
      </Text>
    </View>
  );
}

const plain = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 2,
  },
  youRow: {
    backgroundColor: 'rgba(255,59,92,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.4)',
  },
  rank: {
    fontFamily: Fonts.monoRegular,
    fontSize: 12,
    color: LC.textDim,
    width: 40,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  rankYou: {
    fontFamily: Fonts.monoBold,
    color: LC.red,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: Fonts.interRegular,
    fontSize: 13,
    color: LC.textDim,
  },
  nameYou: {
    fontFamily: Fonts.interBold,
    color: LC.text,
  },
  hours: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
    color: LC.textDim,
  },
  hoursYou: {
    color: LC.text,
    fontFamily: Fonts.monoMedium,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────

const VISIBLE_PLAIN_MAX_RANK = 6;

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = user?.id;

  const entries = useLeaderboardStore((s) => s.entries);
  const currentUserRank = useLeaderboardStore((s) => s.currentUserRank);
  const currentUserHours = useLeaderboardStore((s) => s.currentUserHours);
  const isLoading = useLeaderboardStore((s) => s.isLoading);
  const fetchLeaderboard = useLeaderboardStore((s) => s.fetchLeaderboard);

  const currentUserEntry = entries.find((e) => e.user_id === userId);
  const displayName =
    currentUserEntry?.display_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    'You';

  const refresh = useCallback(() => {
    if (!userId) return;
    useLeaderboardStore.setState({ lastFetched: null });
    fetchLeaderboard(userId);
  }, [userId, fetchLeaderboard]);

  useFocusEffect(
    useCallback(() => {
      console.log(
        '[LeaderboardScreen] focus — userId:',
        userId,
        'entries:',
        entries.length,
        'isLoading:',
        isLoading,
      );
      if (userId) fetchLeaderboard(userId);
    }, [userId, fetchLeaderboard, entries.length, isLoading]),
  );

  // Resolve the user's effective rank: prefer the server-reported rank, but fall
  // back to their position inside `entries` (found via user_id) when the store
  // doesn't have it yet. Some accounts only surface through the full leaderboard
  // list, not the per-user rank query.
  const effectiveUserRank =
    currentUserRank ?? currentUserEntry?.rank ?? null;
  const effectiveUserHours =
    currentUserHours ?? currentUserEntry?.total_hours ?? null;

  // Partition the entries for render. The top 1-N rows come from `entries`;
  // if the current user sits below that, we show an ellipsis + sticky YOU row.
  const layout = useMemo(() => {
    const podiumEntry = entries.find((e) => e.rank === 1) || null;
    const row2 = entries.find((e) => e.rank === 2) || null;
    const row3 = entries.find((e) => e.rank === 3) || null;
    const plainEntries = entries
      .filter((e) => e.rank >= 4 && e.rank <= VISIBLE_PLAIN_MAX_RANK)
      .sort((a, b) => a.rank - b.rank);

    const userInTopVisible =
      effectiveUserRank != null && effectiveUserRank <= VISIBLE_PLAIN_MAX_RANK;

    const showStickyYou = !userInTopVisible && effectiveUserRank != null;

    // Synthetic "you" entry for the sticky row when the current user isn't in
    // the fetched top entries.
    const stickyYouEntry: LeaderboardUser | null = showStickyYou
      ? {
          user_id: userId ?? 'you',
          display_name: displayName,
          total_hours: effectiveUserHours ?? 0,
          rank: effectiveUserRank ?? 0,
        }
      : null;

    return {
      podiumEntry,
      row2,
      row3,
      plainEntries,
      showEllipsis: showStickyYou,
      stickyYouEntry,
    };
  }, [entries, effectiveUserRank, effectiveUserHours, userId, displayName]);

  const totalCount = entries.length;
  const eyebrowText = (() => {
    if (effectiveUserRank != null && totalCount > 0) {
      return `${getCurrentMonthLabel()} · #${effectiveUserRank} OF ${totalCount}`;
    }
    return getCurrentMonthLabel();
  })();

  const hasEntries = entries.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{eyebrowText}</Text>
        <Text style={styles.title}>THE RANKS.</Text>
      </View>

      {/* Body */}
      {isLoading && !hasEntries ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={LC.red} size="large" />
        </View>
      ) : !hasEntries ? (
        <View style={styles.centerState}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyLabel}>no ranks yet</Text>
          </View>
          <Text style={styles.emptySub}>
            Start a grind to appear on the board.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: layout.stickyYouEntry ? 220 : 140 },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refresh}
                tintColor={LC.red}
              />
            }
          >
            {layout.podiumEntry ? (
              <PodiumCard
                entry={layout.podiumEntry}
                isYou={layout.podiumEntry.user_id === userId}
              />
            ) : null}

            {layout.row2 ? (
              <ElevatedRow
                entry={layout.row2}
                isYou={layout.row2.user_id === userId}
              />
            ) : null}
            {layout.row3 ? (
              <ElevatedRow
                entry={layout.row3}
                isYou={layout.row3.user_id === userId}
              />
            ) : null}

            {layout.plainEntries.map((entry) => (
              <PlainRow
                key={entry.user_id}
                entry={entry}
                isYou={entry.user_id === userId}
              />
            ))}

            {layout.showEllipsis ? (
              <Text style={styles.ellipsis}>···</Text>
            ) : null}
          </ScrollView>

          {/* Sticky YOU row */}
          {layout.stickyYouEntry ? (
            <View
              style={[
                styles.stickyWrap,
                { bottom: insets.bottom + 110 },
              ]}
              pointerEvents="none"
            >
              <PlainRow entry={layout.stickyYouEntry} isYou />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LC.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  eyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 42,
    lineHeight: 50,
    color: LC.text,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  ellipsis: {
    textAlign: 'center',
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: LC.textMute,
    letterSpacing: 4,
    paddingVertical: 10,
  },
  // Sticky YOU row
  stickyWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  // States
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 120,
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
  emptyLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  emptySub: {
    fontFamily: Fonts.interRegular,
    fontSize: 13,
    color: LC.textMute,
    textAlign: 'center',
  },
});
