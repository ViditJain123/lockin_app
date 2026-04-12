import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts } from '../../constants/Fonts';
import { useAuth } from '../../contexts/AuthContext';
import { useLeaderboardStore, type LeaderboardUser } from '../../store/useLeaderboardStore';

const PINK = '#FF3B5C';
const CARD_BG = '#1C1C1E';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getCurrentMonthLabel(): string {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

function formatHours(hours: number): string {
  if (hours >= 100) return `${Math.round(hours)}h`;
  if (hours >= 10) return `${hours.toFixed(1)}h`;
  return `${hours.toFixed(2)}h`;
}

function getRankColor(rank: number): string {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return 'rgba(255,255,255,0.5)';
}

// ── Current User Card ──────────────────────────────────────────────────

function CurrentUserCard({
  rank,
  hours,
  displayName,
}: {
  rank: number | null;
  hours: number | null;
  displayName: string;
}) {
  return (
    <View style={styles.currentUserCard}>
      <View style={styles.currentUserRankBadge}>
        <Text style={styles.currentUserRankText}>
          {rank != null ? `#${rank}` : '—'}
        </Text>
      </View>
      <View style={styles.currentUserInfo}>
        <Text style={styles.currentUserName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.currentUserLabel}>You</Text>
      </View>
      <Text style={styles.currentUserHours}>
        {hours != null ? formatHours(hours) : '0h'}
      </Text>
    </View>
  );
}

// ── Leaderboard Row ────────────────────────────────────────────────────

function LeaderboardRow({
  item,
  isCurrentUser,
}: {
  item: LeaderboardUser;
  isCurrentUser: boolean;
}) {
  const rankColor = getRankColor(item.rank);

  return (
    <View
      style={[
        styles.row,
        isCurrentUser && styles.rowHighlighted,
      ]}
    >
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, { color: rankColor }]}>
          {item.rank}
        </Text>
      </View>
      <View style={styles.nameContainer}>
        <Text style={styles.nameText} numberOfLines={1}>
          {item.display_name || 'Anonymous'}
        </Text>
        {isCurrentUser && (
          <Text style={styles.youBadge}>You</Text>
        )}
      </View>
      <Text style={styles.hoursText}>{formatHours(item.total_hours)}</Text>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = user?.id;

  const entries = useLeaderboardStore((s) => s.entries);
  const currentUserRank = useLeaderboardStore((s) => s.currentUserRank);
  const currentUserHours = useLeaderboardStore((s) => s.currentUserHours);
  const isLoading = useLeaderboardStore((s) => s.isLoading);
  const fetchLeaderboard = useLeaderboardStore((s) => s.fetchLeaderboard);

  // Find current user's display name from the entries
  const currentUserEntry = entries.find((e) => e.user_id === userId);
  const displayName =
    currentUserEntry?.display_name ||
    user?.user_metadata?.full_name ||
    'You';

  const refresh = useCallback(() => {
    if (!userId) return;
    // Reset throttle so pull-to-refresh always works
    useLeaderboardStore.setState({ lastFetched: null });
    fetchLeaderboard(userId);
  }, [userId, fetchLeaderboard]);

  useFocusEffect(
    useCallback(() => {
      if (userId) fetchLeaderboard(userId);
    }, [userId, fetchLeaderboard])
  );

  const renderItem = useCallback(
    ({ item }: { item: LeaderboardUser }) => (
      <LeaderboardRow item={item} isCurrentUser={item.user_id === userId} />
    ),
    [userId]
  );

  const keyExtractor = useCallback(
    (item: LeaderboardUser) => item.user_id,
    []
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.monthLabel}>{getCurrentMonthLabel()}</Text>
      </View>

      {/* Current User Card */}
      {userId && (
        <CurrentUserCard
          rank={currentUserRank}
          hours={currentUserHours}
          displayName={displayName}
        />
      )}

      {/* List */}
      {isLoading && entries.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={PINK} size="large" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sessions this month yet</Text>
          <Text style={styles.emptySubtext}>
            Start a focus session to appear on the leaderboard
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={PINK}
            />
          }
        />
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 34,
    fontFamily: Fonts.bold,
    color: '#fff',
  },
  monthLabel: {
    fontSize: 14,
    fontFamily: Fonts.interMedium,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },

  // Current user card
  currentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 92, 0.3)',
  },
  currentUserRankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentUserRankText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#fff',
  },
  currentUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  currentUserName: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: '#fff',
  },
  currentUserLabel: {
    fontSize: 12,
    fontFamily: Fonts.interMedium,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  currentUserHours: {
    fontSize: 20,
    fontFamily: Fonts.interBold,
    color: '#fff',
  },

  // List rows
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  rowHighlighted: {
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  nameText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: '#fff',
    flexShrink: 1,
  },
  youBadge: {
    fontSize: 11,
    fontFamily: Fonts.interSemiBold,
    color: PINK,
    marginLeft: 8,
    backgroundColor: 'rgba(255, 59, 92, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  hoursText: {
    fontSize: 15,
    fontFamily: Fonts.interSemiBold,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 8,
  },

  // States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Fonts.interRegular,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 8,
  },
});
