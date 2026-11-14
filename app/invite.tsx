import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { LCBackButton } from '@/components/lc/LCBackButton';
import Mascot from '@/components/Mascot';
import InitialsAvatar from '@/components/profile/InitialsAvatar';
import { Fonts } from '@/constants/Fonts';
import { RADIUS, T } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { buttonPress } from '@/lib/haptics';
import { INVITE_BASE_URL, useFriendsStore } from '@/store/useFriendsStore';

const HERO_H = 290;

function Floating({ children, x, y, delay }: { children: React.ReactNode; x: number; y: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      )
    );
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -t.value * 8 }] }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: y }, style]}>{children}</Animated.View>;
}

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const friends = useFriendsStore((s) => s.friends);
  const inviteCode = useFriendsStore((s) => s.inviteCode);
  const fetchFriends = useFriendsStore((s) => s.fetchFriends);

  useEffect(() => {
    if (user?.id && !inviteCode) fetchFriends(user.id);
  }, [user?.id, inviteCode, fetchFriends]);

  const code = inviteCode ?? (user?.id ?? '').replace(/-/g, '').slice(0, 8);
  const link = `${INVITE_BASE_URL}${code}`;
  const message = `Lock in with me on Lockin Club. We can see each other's focus timelapses and race on the ranks. ${link}`;

  const shareSheet = async () => {
    buttonPress();
    try {
      await Share.share({ message, url: link });
    } catch {}
  };
  const open = async (url: string) => {
    buttonPress();
    try {
      await Linking.openURL(url);
    } catch {
      shareSheet();
    }
  };

  const enc = encodeURIComponent(message);
  const channels: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }[] = [
    { icon: 'chatbubble', label: 'Messages', onPress: () => open(`sms:&body=${enc}`) },
    { icon: 'logo-whatsapp', label: 'WhatsApp', onPress: () => open(`whatsapp://send?text=${enc}`) },
    { icon: 'mail', label: 'Mail', onPress: () => open(`mailto:?subject=${encodeURIComponent('Lock in with me')}&body=${enc}`) },
    { icon: 'share-outline', label: 'More', onPress: shareSheet },
  ];

  // Faces floating around the mascot: your friends if you have some
  const faces = (friends.length ? friends : [
    { id: 'a', name: 'Riya K' },
    { id: 'b', name: 'Kabir S' },
    { id: 'c', name: 'Ananya R' },
  ]).slice(0, 3);
  const spots = [
    { x: 18, y: 40, size: 62, delay: 0 },
    { x: 290, y: 30, size: 44, delay: 600 },
    { x: 54, y: 200, size: 46, delay: 1200 },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <LCBackButton />
        <Text style={styles.title}>Invite</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero: mascot on a glow with friends floating around */}
      <View style={styles.hero}>
        <View style={styles.glow} pointerEvents="none">
          <Svg width={320} height={320}>
            <Defs>
              <RadialGradient id="g" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FFD36B" stopOpacity={0.55} />
                <Stop offset="0.45" stopColor={T.orange} stopOpacity={0.28} />
                <Stop offset="1" stopColor={T.orange} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={160} cy={160} r={160} fill="url(#g)" />
          </Svg>
        </View>
        <Mascot size={150} />
        {faces.map((f, i) => (
          <Floating key={f.id} x={spots[i].x} y={spots[i].y} delay={spots[i].delay}>
            <View style={styles.faceRim}>
              <InitialsAvatar id={f.id} name={f.name} size={spots[i].size} />
            </View>
          </Floating>
        ))}
        <View style={[styles.dot, { left: 250, top: 210, backgroundColor: T.yellow }]} />
        <View style={[styles.dot, { left: 120, top: 26, backgroundColor: T.good }]} />
        <View style={[styles.dot, { left: 310, top: 140, backgroundColor: T.orange }]} />
      </View>

      <View style={styles.body}>
        <Text style={styles.h1}>Invite your friends</Text>
        <Text style={styles.sub}>
          Lock in together. Friends see each other&apos;s timelapse stories and race on the ranks.
        </Text>

        <Text style={styles.label}>Share your link</Text>
        <Pressable onPress={shareSheet} style={({ pressed }) => [styles.linkBox, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel="Share invite link">
          <Text style={styles.linkText} numberOfLines={1}>
            {link.replace('https://', '')}
          </Text>
          <View style={styles.linkBtn}>
            <Ionicons name="paper-plane" size={15} color={T.black} />
          </View>
        </Pressable>

        <View style={styles.channels}>
          {channels.map((c) => (
            <Pressable key={c.label} onPress={c.onPress} style={styles.channel} accessibilityRole="button" accessibilityLabel={`Invite via ${c.label}`}>
              <View style={styles.channelIcon}>
                <Ionicons name={c.icon} size={22} color={T.ink} />
              </View>
              <Text style={styles.channelLabel}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.countRow}>
          <Ionicons name="people" size={16} color={T.yellow} />
          <Text style={styles.countText}>
            {friends.length === 0
              ? 'No friends yet. Your first invite starts the club.'
              : `${friends.length} ${friends.length === 1 ? 'friend' : 'friends'} locking in with you`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: T.ink,
  },
  hero: {
    height: HERO_H,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  glow: {
    position: 'absolute',
    top: (HERO_H - 320) / 2,
  },
  faceRim: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    opacity: 0.8,
  },
  body: {
    paddingHorizontal: 20,
  },
  h1: {
    fontFamily: Fonts.display,
    fontSize: 44,
    lineHeight: 46,
    color: T.ink,
    letterSpacing: 0.5,
  },
  sub: {
    marginTop: 6,
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 21,
    color: T.inkSoft,
  },
  label: {
    marginTop: 26,
    marginBottom: 8,
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.inkMute,
    textTransform: 'uppercase',
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingLeft: 16,
    paddingRight: 7,
    borderRadius: RADIUS.md,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.lineStrong,
  },
  linkText: {
    flex: 1,
    fontFamily: Fonts.monoMedium,
    fontSize: 14,
    color: T.ink,
  },
  linkBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: T.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  channel: {
    alignItems: 'center',
    gap: 6,
  },
  channelIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: T.inkSoft,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: T.yellowSoft,
  },
  countText: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: T.ink,
  },
});
