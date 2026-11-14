import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LCBackButton } from '@/components/lc/LCBackButton';
import InitialsAvatar from '@/components/profile/InitialsAvatar';
import { Fonts } from '@/constants/Fonts';
import { RADIUS, T } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { buttonPress } from '@/lib/haptics';
import { timeAgo, useFriendsStore, type Friend } from '@/store/useFriendsStore';

function fmtHours(h?: number) {
  if (!h) return '0h';
  const m = Math.round(h * 60);
  return m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`;
}

function Row({ f, rank, isNew }: { f: Friend; rank: number; isNew: boolean }) {
  const avatar = (
    <View style={styles.gap}>
      <InitialsAvatar id={f.id} name={f.name} size={46} />
    </View>
  );
  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>
      {isNew ? (
        <LinearGradient colors={[T.yellow, T.orange, '#FF3D00']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.ring}>
          {avatar}
        </LinearGradient>
      ) : (
        <View style={[styles.ring, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>{avatar}</View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>
          {f.name}
        </Text>
        {f.lockedIn ? (
          <Text style={[styles.sub, { color: T.good }]}>● Locked in now</Text>
        ) : f.story ? (
          <Text style={styles.sub}>Posted a timelapse · {timeAgo(f.story.createdAt)} ago</Text>
        ) : (
          <Text style={styles.sub}>Offline</Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.hours}>{fmtHours(f.weekHours)}</Text>
        <Text style={styles.hoursLabel}>THIS WEEK</Text>
      </View>
    </View>
  );
}

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const friends = useFriendsStore((s) => s.friends);
  const seen = useFriendsStore((s) => s.seenStoryIds);
  const fetchFriends = useFriendsStore((s) => s.fetchFriends);

  useEffect(() => {
    if (user?.id && friends.length === 0) fetchFriends(user.id);
  }, [user?.id, friends.length, fetchFriends]);

  // Ranked by hours this week: a tiny leaderboard among friends
  const ranked = useMemo(() => [...friends].sort((a, b) => (b.weekHours ?? 0) - (a.weekHours ?? 0)), [friends]);
  const live = friends.filter((f) => f.lockedIn).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <LCBackButton />
        <Text style={styles.title}>Friends</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.sumCell}>
            <Text style={styles.sumValue}>{friends.length}</Text>
            <Text style={styles.sumLabel}>FRIENDS</Text>
          </View>
          <View style={styles.sumDivider} />
          <View style={styles.sumCell}>
            <Text style={[styles.sumValue, { color: T.good }]}>{live}</Text>
            <Text style={styles.sumLabel}>LOCKED IN NOW</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            buttonPress();
            router.push('/invite' as any);
          }}
          style={({ pressed }) => [styles.inviteWrap, pressed && { transform: [{ scale: 0.98 }] }]}
          accessibilityRole="button"
          accessibilityLabel="Invite friends"
        >
          <LinearGradient colors={['#FF8A33', T.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.invite}>
            <Ionicons name="person-add" size={18} color={T.white} />
            <Text style={styles.inviteText}>Invite friends</Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.section}>RANKED BY THIS WEEK</Text>
        {ranked.length === 0 ? (
          <Text style={styles.empty}>No friends yet. Send your link and lock in together.</Text>
        ) : (
          ranked.map((f, i) => <Row key={f.id} f={f} rank={i + 1} isNew={!!f.story && !seen.includes(f.story.id)} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  title: { fontFamily: Fonts.bold, fontSize: 20, color: T.ink },
  summary: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.line,
  },
  sumCell: { flex: 1, alignItems: 'center' },
  sumValue: { fontFamily: Fonts.display, fontSize: 36, lineHeight: 38, color: T.ink },
  sumLabel: { fontFamily: Fonts.monoMedium, fontSize: 9.5, letterSpacing: 1.4, color: T.inkMute },
  sumDivider: { width: 1, backgroundColor: T.line },
  inviteWrap: {
    marginTop: 12,
    borderRadius: RADIUS.lg,
    shadowColor: T.orange,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  invite: {
    height: 54,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  inviteText: { fontFamily: Fonts.bold, fontSize: 16, color: T.white },
  section: {
    marginTop: 26,
    marginBottom: 10,
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: T.inkMute,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.line,
  },
  rank: { width: 18, textAlign: 'center', fontFamily: Fonts.display, fontSize: 20, color: T.inkMute },
  ring: { padding: 2, borderRadius: 999 },
  gap: { padding: 2, borderRadius: 999, backgroundColor: T.card },
  name: { fontFamily: Fonts.bold, fontSize: 15, color: T.ink },
  sub: { marginTop: 2, fontFamily: Fonts.medium, fontSize: 12, color: T.inkMute },
  hours: { fontFamily: Fonts.display, fontSize: 22, lineHeight: 24, color: T.ink },
  hoursLabel: { fontFamily: Fonts.monoMedium, fontSize: 8.5, letterSpacing: 1.2, color: T.inkMute },
  empty: { fontFamily: Fonts.medium, fontSize: 13, color: T.inkMute, textAlign: 'center', marginTop: 20 },
});
