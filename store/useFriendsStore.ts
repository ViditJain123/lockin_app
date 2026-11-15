import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import * as FileSystem from 'expo-file-system/legacy';

import { DEMO_DATA_ENABLED } from '@/lib/config';
import { DEMO_DIR, demoClipsInstalled } from '@/lib/demoTimelapses';
import {
  deleteStory,
  fetchMyViewCounts,
  prefetchStory,
  pruneStoryCache,
  recordView,
  storiesConfigured,
  storyVideoUrl,
  uploadStory,
} from '@/lib/storiesApi';
import { supabase } from '@/lib/supabase';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface FriendStory {
  id: string;
  // CDN URL of the timelapse; null for demo stories (rendered as a card)
  videoUrl: string | null;
  durationSeconds: number;
  createdAt: string;
}

export interface Friend {
  id: string;
  name: string;
  // Their newest live story (drives the ring), and all of them oldest first
  story: FriendStory | null;
  stories?: FriendStory[];
  // In a session right now
  lockedIn?: boolean;
  // Hours locked in this week (shown on the friends list)
  weekHours?: number;
}

export interface MyStory {
  recordingId: string;
  createdAt: string;
  // Set once the video is on the server. Absent = this device only.
  storyId?: string;
  status?: 'uploading' | 'posted' | 'failed';
  // Upload progress 0..1 while status is 'uploading'
  progress?: number;
  viewCount?: number;
}

/** The bits of a recording needed to post it */
export interface StorySource {
  id: string;
  // Absolute file URI of the timelapse
  videoUri: string;
  durationSeconds: number;
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
  postStory: (source: StorySource) => Promise<void>;
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
                .order('created_at', { ascending: true }),
            ]);
            const nameMap = new Map((names ?? []).map((n) => [n.id as string, (n.display_name as string | null) ?? 'Friend']));
            const byUser = new Map<string, FriendStory[]>();
            for (const s of stories ?? []) {
              const videoUrl = storyVideoUrl(s.video_path as string);
              if (!videoUrl) continue;
              const list = byUser.get(s.user_id as string) ?? [];
              list.push({
                id: s.id as string,
                videoUrl,
                durationSeconds: (s.duration_seconds as number) ?? 0,
                createdAt: s.created_at as string,
              });
              byUser.set(s.user_id as string, list);
            }
            friends = ids.map((id) => {
              const list = byUser.get(id) ?? [];
              return { id, name: nameMap.get(id) ?? 'Friend', story: list[list.length - 1] ?? null, stories: list };
            });

            // Keep only live stories on disk, and fetch the first few unseen
            // ones now so they open instantly.
            const live = friends.flatMap((f) => f.stories ?? []);
            pruneStoryCache(live.map((st) => st.id));
            const seen = get().seenStoryIds;
            live
              .filter((st) => st.videoUrl && !seen.includes(st.id))
              .slice(0, 3)
              .forEach((st) => prefetchStory(st.id, st.videoUrl!));
          }

          if (storiesConfigured()) {
            const counts = await fetchMyViewCounts(userId);
            set((st) => ({
              myStories: st.myStories.map((m) => (m.storyId && counts.has(m.storyId) ? { ...m, viewCount: counts.get(m.storyId) } : m)),
            }));
          }
        } catch (e) {
          // Tables not migrated yet / offline: keep going with what we have
          console.warn('[Friends] fetch failed:', (e as Error)?.message ?? e);
        }
        if (friends.length === 0 && DEMO_DATA_ENABLED) {
          // Play the sample clips in demo stories when they're installed
          const clips = (await demoClipsInstalled()) ? ['tl3', 'tl5', 'tl4', 'tl6'] : [];
          let i = 0;
          friends = DEMO_FRIENDS.map((f) => {
            if (!f.story) return f;
            const story = clips.length
              ? { ...f.story, videoUrl: `${FileSystem.documentDirectory}${DEMO_DIR}/${clips[i++ % clips.length]}.mp4` }
              : f.story;
            return { ...f, story, stories: [story] };
          });
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

      postStory: async (source) => {
        const recordingId = source.id;
        const patch = (changes: Partial<MyStory>) =>
          set((st) => ({ myStories: st.myStories.map((x) => (x.recordingId === recordingId ? { ...x, ...changes } : x)) }));
        const online = storiesConfigured();

        // Show it in "Your story" right away; the upload runs behind it
        set((st) => ({
          myStories: [
            ...activeMyStories(st.myStories).filter((x) => x.recordingId !== recordingId),
            { recordingId, createdAt: new Date().toISOString(), status: online ? 'uploading' : 'posted', progress: 0 },
          ],
        }));
        if (!online) return;

        try {
          const { data } = await supabase.auth.getSession();
          const userId = data.session?.user?.id;
          if (!userId) throw new Error('Not signed in');

          let lastStep = 0;
          const posted = await uploadStory(userId, source.videoUri, source.durationSeconds, (fraction) => {
            // Persisted store: only write every 5%
            const step = Math.floor(fraction * 20);
            if (step !== lastStep) {
              lastStep = step;
              patch({ progress: fraction });
            }
          });

          // Removed while it was uploading: take it back down
          if (!get().myStories.some((x) => x.recordingId === recordingId)) {
            deleteStory(posted.storyId).catch(() => {});
            return;
          }
          patch({ storyId: posted.storyId, createdAt: posted.createdAt, status: 'posted', progress: 1, viewCount: 0 });
        } catch (e) {
          console.warn('[Stories] post failed:', (e as Error)?.message ?? e);
          patch({ status: 'failed', progress: 0 });
        }
      },
      removeStory: (recordingId) => {
        const existing = get().myStories.find((x) => x.recordingId === recordingId);
        set((st) => ({ myStories: st.myStories.filter((x) => x.recordingId !== recordingId) }));
        if (existing?.storyId) {
          deleteStory(existing.storyId).catch((e) => console.warn('[Stories] delete failed:', (e as Error)?.message ?? e));
        }
      },
      markSeen: (storyId) => {
        const seen = get().seenStoryIds;
        if (seen.includes(storyId)) return;
        set({ seenStoryIds: [...seen.slice(-200), storyId] });
        // Real friend stories have uuid ids; your own ("mine-…") and demo ones don't
        if (UUID_RE.test(storyId) && storiesConfigured()) recordView(storyId).catch(() => {});
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
      // An upload that was mid-flight when the app closed did not finish
      merge: (persisted: any, current) => ({
        ...current,
        ...(persisted ?? {}),
        myStories: ((persisted?.myStories ?? []) as MyStory[]).map((m) =>
          m.status === 'uploading' ? { ...m, status: 'failed' as const, progress: 0 } : m
        ),
      }),
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
