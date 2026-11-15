import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, runOnJS, type SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Mascot from '@/components/Mascot';
import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';
import { optionSelect } from '@/lib/haptics';
import { cachedStoryUri, fetchViewers, prefetchStory, type StoryViewer as Viewer } from '@/lib/storiesApi';
import { timeAgo } from '@/store/useFriendsStore';

import InitialsAvatar from './InitialsAvatar';

const STORY_MS = 6000;

export interface StoryItem {
  key: string;
  userId: string;
  name: string;
  videoUri: string | null;
  durationSeconds: number;
  createdAt: string;
  isMine?: boolean;
  // Your own stories only: server id (once uploaded) and how many friends watched
  storyId?: string;
  viewCount?: number;
}

const isRemote = (uri: string | null) => !!uri && /^https?:/.test(uri);

function fmtDuration(sec: number) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  return m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${Math.floor(m / 60)}h`;
}

function Segment({ index, current, progress }: { index: number; current: number; progress: SharedValue<number> }) {
  const fill = useAnimatedStyle(() => ({
    width: `${(index < current ? 1 : index > current ? 0 : progress.value) * 100}%`,
  }));
  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.segmentFill, fill]} />
    </View>
  );
}

interface Props {
  stories: StoryItem[];
  startIndex: number;
  visible: boolean;
  onClose: () => void;
  onSeen: (key: string) => void;
  onDeleteMine?: (story: StoryItem) => void;
}

/** Full-screen timelapse stories: tap right/left to skip, auto-advances. */
export default function StoryViewer({ stories, startIndex, visible, onClose, onSeen, onDeleteMine }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(startIndex);
  const progress = useSharedValue(0);
  const story = stories[index];
  // What the player is given: the downloaded copy when there is one, else the stream
  const [source, setSource] = useState<{ key: string; uri: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [viewers, setViewers] = useState<Viewer[] | 'loading' | null>(null);

  useEffect(() => {
    if (visible) setIndex(startIndex);
  }, [visible, startIndex]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= stories.length) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [stories.length, onClose]);

  // Pick the source for this story and warm up the next one
  useEffect(() => {
    setReady(false);
    setViewers(null);
    if (!visible || !story?.videoUri) return;
    const { key, videoUri } = story;
    if (!isRemote(videoUri)) {
      setSource({ key, uri: videoUri });
    } else {
      let cancelled = false;
      cachedStoryUri(key).then((local) => {
        if (!cancelled) setSource({ key, uri: local ?? videoUri });
      });
      const upNext = stories[index + 1];
      if (upNext && isRemote(upNext.videoUri)) prefetchStory(upNext.key, upNext.videoUri!);
      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, visible, story?.key]);

  // The countdown only runs once there is something on screen, and pauses
  // while the viewer list is open.
  const playing = visible && !!story && (ready || !story.videoUri) && viewers === null;
  useEffect(() => {
    if (!playing) return;
    onSeen(story.key);
    progress.value = 0;
    progress.value = withTiming(1, { duration: STORY_MS, easing: Easing.linear }, (done) => {
      if (done) runOnJS(next)();
    });
    return () => cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playing, story?.key]);

  const showViewers = () => {
    if (!story?.storyId) return;
    optionSelect();
    setViewers('loading');
    fetchViewers(story.storyId)
      .then(setViewers)
      .catch(() => setViewers([]));
  };

  if (!story) return null;

  const onTap = (x: number) => {
    optionSelect();
    if (x < width / 3) setIndex((i) => Math.max(0, i - 1));
    else next();
  };

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="overFullScreen" transparent onRequestClose={onClose}>
      <StatusBar style="light" />
      <View style={styles.root}>
        {story.videoUri ? (
          source?.key === story.key ? (
            <Video
              key={story.key}
              source={{ uri: source.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
              onReadyForDisplay={() => setReady(true)}
              onError={() => {
                // A cached copy that won't play: fall back to the stream once, then skip
                if (isRemote(story.videoUri) && source.uri !== story.videoUri) setSource({ key: story.key, uri: story.videoUri! });
                else next();
              }}
            />
          ) : null
        ) : (
          <LinearGradient colors={['#FF8A33', '#FF6600', '#7A2600']} style={[StyleSheet.absoluteFill, styles.demo]}>
            <Mascot size={180} />
            <Text style={styles.demoKicker}>TIMELAPSE</Text>
            <Text style={styles.demoBig}>{fmtDuration(story.durationSeconds)}</Text>
            <Text style={styles.demoSub}>locked in, phone down</Text>
          </LinearGradient>
        )}

        <LinearGradient colors={['rgba(0,0,0,0.55)', 'transparent']} style={styles.topShade} pointerEvents="none" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.bottomShade} pointerEvents="none" />

        {story.videoUri && !ready ? <ActivityIndicator style={StyleSheet.absoluteFill} color={T.white} /> : null}

        <Pressable style={StyleSheet.absoluteFill} onPress={(e) => onTap(e.nativeEvent.locationX)} />

        <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <View style={styles.segments}>
            {stories.map((s, i) => (
              <Segment key={s.key} index={i} current={index} progress={progress} />
            ))}
          </View>
          <View style={styles.header}>
            <InitialsAvatar id={story.userId} name={story.name} size={34} />
            <Text style={styles.headerName} numberOfLines={1}>
              {story.isMine ? 'Your story' : story.name}
            </Text>
            <Text style={styles.headerTime}>{timeAgo(story.createdAt)}</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close story">
              <Ionicons name="close" size={28} color={T.white} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]} pointerEvents="box-none">
          <View style={styles.caption}>
            <Ionicons name="time" size={14} color={T.yellow} />
            <Text style={styles.captionText}>
              {story.isMine ? 'You' : story.name.split(' ')[0]} locked in for {fmtDuration(story.durationSeconds)}
            </Text>
          </View>
          <View style={styles.actions}>
            {story.isMine && story.storyId ? (
              <Pressable
                onPress={showViewers}
                style={styles.viewsBtn}
                accessibilityRole="button"
                accessibilityLabel={`${story.viewCount ?? 0} views. Show who watched`}
              >
                <Ionicons name="eye-outline" size={18} color={T.white} />
                <Text style={styles.viewsText}>{story.viewCount ?? 0}</Text>
              </Pressable>
            ) : null}
            {story.isMine && onDeleteMine ? (
              <Pressable onPress={() => onDeleteMine(story)} style={styles.deleteBtn} accessibilityRole="button" accessibilityLabel="Remove story">
                <Ionicons name="trash-outline" size={18} color={T.white} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {viewers !== null ? (
          <Pressable style={styles.viewersBackdrop} onPress={() => setViewers(null)} accessibilityLabel="Close viewer list">
            <Pressable style={[styles.viewersSheet, { paddingBottom: insets.bottom + 16 }]}>
              <Text style={styles.viewersTitle}>
                {viewers === 'loading' ? 'Viewers' : viewers.length === 1 ? '1 viewer' : `${viewers.length} viewers`}
              </Text>
              {viewers === 'loading' ? (
                <ActivityIndicator color={T.white} style={{ marginVertical: 20 }} />
              ) : viewers.length === 0 ? (
                <Text style={styles.viewersEmpty}>No one has watched this yet.</Text>
              ) : (
                <ScrollView style={{ maxHeight: 320 }}>
                  {viewers.map((v) => (
                    <View key={v.id} style={styles.viewerRow}>
                      <InitialsAvatar id={v.id} name={v.name} size={34} />
                      <Text style={styles.viewerName} numberOfLines={1}>
                        {v.name}
                      </Text>
                      <Text style={styles.headerTime}>{timeAgo(v.viewedAt)}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  demo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoKicker: {
    marginTop: 28,
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    letterSpacing: 3,
    color: 'rgba(14,14,14,0.6)',
  },
  demoBig: {
    fontFamily: Fonts.display,
    fontSize: 110,
    lineHeight: 112,
    color: '#0E0E0E',
  },
  demoSub: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: 'rgba(14,14,14,0.75)',
  },
  topShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  bottomShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  segments: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    backgroundColor: T.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  headerName: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: T.white,
    maxWidth: 180,
  },
  headerTime: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(14,14,14,0.6)',
  },
  captionText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: T.white,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(14,14,14,0.6)',
  },
  viewsText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: T.white,
  },
  viewersBackdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  viewersSheet: {
    paddingTop: 18,
    paddingHorizontal: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#161616',
  },
  viewersTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: T.white,
    marginBottom: 10,
  },
  viewersEmpty: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginVertical: 16,
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  viewerName: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: T.white,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(14,14,14,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
