import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import * as FileSystem from 'expo-file-system/legacy';

import { DEMO_DATA_ENABLED } from '@/lib/config';
import { DEMO_DIR, demoClipsInstalled } from '@/lib/demoTimelapses';
import { supabase } from '@/lib/supabase';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;
export const INVITE_BASE_URL = 'https://lockin.club/invite/';

export interface FriendStory {
  id: string;
  // Signed URL of the timelapse; null for demo stories (rendered as a card)
  videoUrl: string | null;
  durationSeconds: number;
  createdAt: string;
}

export interface Friend {
  id: string;
  name: string;
  story: FriendStory | null;
  // In a session right now
  lockedIn?: boolean;
  // Hours locked in this week (shown on the friends list)
  weekHours?: number;
}

export interface MyStory {
  recordingId: string;
  createdAt: string;
}

interface FriendsState {
  friends: Friend[];
  inviteCode: string | null;
  // Your stories, oldest first (each expires 24h after posting)
  myStories: MyStory[];
  seenStoryIds: string[];
  isLoading: boolean;
  fetchFriends: (userId: string) => Promise<void>;
  acceptInvite: (code: string) => Promise<boolean>;
  postStory: (recordingId: string) => void;
  removeStory: (recordingId: string) => void;
  markSeen: (storyId: string) => void;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

// Dev-only friends so the profile can be previewed before anyone accepts an invite
const DEMO_FRIENDS: Friend[] = [
  { id: 'demo-f1', name: 'Riya Kapoor', lockedIn: true, weekHours: 14.5, story: { id: 'demo-s1', videoUrl: null, durationSeconds: 2 * 3600 + 14 * 60, createdAt: hoursAgo(1) } },
  { id: 'demo-f2', name: 'Kabir Shah', weekHours: 9.25, story: { id: 'demo-s2', videoUrl: null, durationSeconds: 52 * 60, createdAt: hoursAgo(3) } },
  { id: 'demo-f3', name: 'Ananya Rao', lockedIn: true, weekHours: 17, story: { id: 'demo-s3', videoUrl: null, durationSeconds: 3 * 3600 + 5 * 60, createdAt: hoursAgo(6) } },
  { id: 'demo-f4', name: 'Vihaan Joshi', weekHours: 4.5, story: null },
  { id: 'demo-f5', name: 'Isha Nair', weekHours: 11, story: { id: 'demo-s5', videoUrl: null, durationSeconds: 75 * 60, createdAt: hoursAgo(11) } },
  { id: 'demo-f6', name: 'Arjun Desai', weekHours: 2.75, story: null },
  { id: 'demo-f7', name: 'Meera Iyer', weekHours: 6, story: null },
];

export const useFriendsStore = create<FriendsState>()(
  persist(
    (set, get) => ({
      friends: [],
      inviteCode: null,
      myStories: [],
      seenStoryIds: [],
      isLoading: false,

      fetchFriends: async (userId: string) => {
        set({ isLoading: true });
        let friends: Friend[] = [];
        let inviteCode: string | null = get().inviteCode;
        try {
          const { data: me } = await supabase.from('users').select('invite_code').eq('id', userId).maybeSingle();
          if (me?.invite_code) inviteCode = me.invite_code as string;

          const { data: links, error } = await supabase.from('friendships').select('friend_id').eq('user_id', userId);
          if (error) throw error;
          const ids = (links ?? []).map((l) => l.friend_id as string);

          if (ids.length > 0) {
            const [{ data: names }, { data: stories }] = await Promise.all([
              supabase.from('leaderboard_profiles').select('id, display_name').in('id', ids),
              supabase
                .from('stories')
                .select('id, user_id, video_path, duration_seconds, created_at')
                .in('user_id', ids)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false }),
            ]);
            const nameMap = new Map((names ?? []).map((n) => [n.id as string, (n.display_name as string | null) ?? 'Friend']));
            const latest = new Map<string, FriendStory>();
            for (const s of stories ?? []) {
              if (latest.has(s.user_id as string)) continue;
              const { data: signed } = await supabase.storage.from('stories').createSignedUrl(s.video_path as string, 3600);
              latest.set(s.user_id as string, {
                id: s.id as string,
                videoUrl: signed?.signedUrl ?? null,
                durationSeconds: (s.duration_seconds as number) ?? 0,
                createdAt: s.created_at as string,
              });
            }
            friends = ids.map((id) => ({ id, name: nameMap.get(id) ?? 'Friend', story: latest.get(id) ?? null }));
          }
        } catch (e) {
          // Tables not migrated yet / offline: keep going with what we have
          console.warn('[Friends] fetch failed:', (e as Error)?.message ?? e);
        }
        if (friends.length === 0 && DEMO_DATA_ENABLED) {
          // Play the sample clips in demo stories when they're installed
          const clips = (await demoClipsInstalled()) ? ['tl3', 'tl1', 'tl4', 'tl2'] : [];
          let i = 0;
          friends = DEMO_FRIENDS.map((f) =>
            f.story && clips.length
              ? { ...f, story: { ...f.story, videoUrl: `${FileSystem.documentDirectory}${DEMO_DIR}/${clips[i++ % clips.length]}.mp4` } }
              : f
          );
        }
        if (!inviteCode) inviteCode = userId.replace(/-/g, '').slice(0, 8);
        set({ friends, inviteCode, isLoading: false });
      },

      acceptInvite: async (code: string) => {
        try {
          const { data, error } = await supabase.rpc('accept_friend_invite', { code });
          if (error) throw error;
          return !!data;
        } catch (e) {
          console.warn('[Friends] accept invite failed:', (e as Error)?.message ?? e);
          return false;
        }
      },

      postStory: (recordingId) =>
        set((st) => ({
          myStories: [
            ...activeMyStories(st.myStories).filter((x) => x.recordingId !== recordingId),
            { recordingId, createdAt: new Date().toISOString() },
          ],
        })),
      removeStory: (recordingId) => set((st) => ({ myStories: st.myStories.filter((x) => x.recordingId !== recordingId) })),
      markSeen: (storyId) => {
        const seen = get().seenStoryIds;
        if (!seen.includes(storyId)) set({ seenStoryIds: [...seen.slice(-200), storyId] });
      },
    }),
    {
      name: 'lockin-friends',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // v0 kept a single `myStory`
      migrate: (persisted: any, version) => {
        if (version === 0 && persisted) {
          persisted.myStories = persisted.myStory ? [persisted.myStory] : [];
          delete persisted.myStory;
        }
        return persisted;
      },
      partialize: (s) => ({ inviteCode: s.inviteCode, myStories: s.myStories, seenStoryIds: s.seenStoryIds }),
    }
  )
);

/** Your stories that are still inside their 24h window */
export function activeMyStories(list: MyStory[]): MyStory[] {
  return list.filter((s) => Date.now() - new Date(s.createdAt).getTime() < STORY_TTL_MS);
}

export function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  return `${Math.round(mins / 60)}h`;
}
