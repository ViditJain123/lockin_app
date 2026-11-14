import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';
import type { Friend } from '@/store/useFriendsStore';

import InitialsAvatar from './InitialsAvatar';

const SIZE = 66;
const RING = 3;
const GAP = 2;
const OUTER = SIZE + (RING + GAP) * 2;

function StoryRing({ state, children }: { state: 'new' | 'seen' | 'none'; children: React.ReactNode }) {
  const inner = (
    <View style={styles.ringGap}>{children}</View>
  );
  if (state === 'new') {
    return (
      <LinearGradient colors={[T.yellow, T.orange, '#FF3D00']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.ring}>
        {inner}
      </LinearGradient>
    );
  }
  return <View style={[styles.ring, { backgroundColor: state === 'seen' ? 'rgba(255,255,255,0.22)' : 'transparent' }]}>{inner}</View>;
}

interface Props {
  friends: Friend[];
  seenStoryIds: string[];
  me: { id: string; name: string; avatarUrl?: string | null };
  myStoryThumb: string | null;
  hasMyStory: boolean;
  onMyStory: () => void;
  onFriend: (friend: Friend) => void;
  onInvite: () => void;
}

/**
 * Instagram-style story strip: your story first (+ to post a timelapse),
 * then friends (gradient ring = new story), then an invite bubble.
 */
export default function FriendsRow({ friends, seenStoryIds, me, myStoryThumb, hasMyStory, onMyStory, onFriend, onInvite }: Props) {
  // Friends with fresh stories first, then seen, then no story
  const ordered = [...friends].sort((a, b) => rank(a) - rank(b));
  function rank(f: Friend) {
    if (!f.story) return 2;
    return seenStoryIds.includes(f.story.id) ? 1 : 0;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Pressable onPress={onMyStory} style={styles.item} accessibilityRole="button" accessibilityLabel={hasMyStory ? 'View your story' : 'Post a timelapse story'}>
        <StoryRing state={hasMyStory ? 'new' : 'none'}>
          {hasMyStory && myStoryThumb ? (
            <Image source={{ uri: myStoryThumb }} style={styles.thumb} />
          ) : (
            <InitialsAvatar id={me.id} name={me.name} uri={me.avatarUrl} size={SIZE} />
          )}
        </StoryRing>
        {!hasMyStory ? (
          <View style={styles.plus}>
            <Ionicons name="add" size={16} color={T.black} />
          </View>
        ) : null}
        <Text style={styles.name} numberOfLines={1}>
          Your story
        </Text>
      </Pressable>

      {ordered.map((f) => {
        const state = !f.story ? 'none' : seenStoryIds.includes(f.story.id) ? 'seen' : 'new';
        return (
          <Pressable
            key={f.id}
            onPress={() => onFriend(f)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={f.story ? `${f.name}'s story` : f.name}
          >
            <StoryRing state={state}>
              <InitialsAvatar id={f.id} name={f.name} size={SIZE} />
            </StoryRing>
            <Text style={[styles.name, state === 'new' && styles.nameNew]} numberOfLines={1}>
              {f.name.split(' ')[0]}
            </Text>
          </Pressable>
        );
      })}

      <Pressable onPress={onInvite} style={styles.item} accessibilityRole="button" accessibilityLabel="Invite friends">
        <View style={[styles.ring, styles.inviteRing]}>
          <Ionicons name="person-add" size={22} color={T.orange} />
        </View>
        <Text style={[styles.name, { color: T.orange }]}>Invite</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 2,
  },
  item: {
    width: OUTER,
    alignItems: 'center',
  },
  ring: {
    width: OUTER,
    height: OUTER,
    borderRadius: OUTER / 2,
    padding: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGap: {
    padding: GAP,
    borderRadius: OUTER / 2,
    backgroundColor: T.canvas,
  },
  thumb: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: T.sunk,
  },
  plus: {
    position: 'absolute',
    top: OUTER - 26,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.yellow,
    borderWidth: 2.5,
    borderColor: T.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteRing: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,102,0,0.6)',
    backgroundColor: T.orangeSoft,
  },
  name: {
    marginTop: 6,
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: T.inkSoft,
    maxWidth: OUTER + 6,
  },
  nameNew: {
    color: T.ink,
  },
});
