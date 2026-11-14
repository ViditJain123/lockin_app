import { create } from 'zustand';

import { DEMO_DATA_ENABLED } from '@/lib/config';
import { supabase } from '@/lib/supabase';

// Usernames, search and friend requests (migration 008). Until that migration
// is applied the calls fail; in demo mode we fall back to a local directory so
// the UI can be tried out.

export type Relation = 'none' | 'sent' | 'received' | 'friend';

export interface UserHit {
  id: string;
  username: string;
  name: string;
  status: Relation;
}

export type UsernameResult = 'ok' | 'taken' | 'invalid' | 'error';

export const USERNAME_RE = /^[a-z0-9._]{3,20}$/;

const DEMO_DIRECTORY: UserHit[] = [
  { id: 'demo-u1', username: 'aarav.codes', name: 'Aarav Mehta', status: 'none' },
  { id: 'demo-u2', username: 'riya_k', name: 'Riya Kapoor', status: 'friend' },
  { id: 'demo-u3', username: 'kabirshah', name: 'Kabir Shah', status: 'friend' },
  { id: 'demo-u4', username: 'isha.nair', name: 'Isha Nair', status: 'none' },
  { id: 'demo-u5', username: 'dev.malhotra', name: 'Dev Malhotra', status: 'none' },
  { id: 'demo-u6', username: 'sara.studies', name: 'Sara Khan', status: 'none' },
  { id: 'demo-u7', username: 'rohan_g', name: 'Rohan Gupta', status: 'none' },
  { id: 'demo-u8', username: 'tara.bose', name: 'Tara Bose', status: 'received' },
  { id: 'demo-u9', username: 'neelverma', name: 'Neel Verma', status: 'received' },
  { id: 'demo-u10', username: 'zoya.ali', name: 'Zoya Ali', status: 'none' },
];

interface State {
  username: string | null;
  requests: UserHit[]; // people who asked you
  demo: Record<string, Relation>; // demo-mode overrides
  loadMe: (userId: string) => Promise<void>;
  setUsername: (userId: string, name: string) => Promise<UsernameResult>;
  search: (q: string) => Promise<UserHit[]>;
  sendRequest: (id: string) => Promise<Relation>;
  accept: (id: string) => Promise<void>;
  decline: (id: string) => Promise<void>;
}

const clean = (q: string) => q.trim().replace(/^@/, '').toLowerCase();

export const useFriendRequestsStore = create<State>()((set, get) => {
  const demoStatus = (u: UserHit): Relation => get().demo[u.id] ?? u.status;
  const demoRequests = () => DEMO_DIRECTORY.filter((u) => demoStatus(u) === 'received').map((u) => ({ ...u, status: 'received' as Relation }));
  const setDemo = (id: string, r: Relation) => set((s) => ({ demo: { ...s.demo, [id]: r } }));
  const isDemoId = (id: string) => id.startsWith('demo-');

  return {
    username: null,
    requests: [],
    demo: {},

    loadMe: async (userId) => {
      try {
        const [{ data: me, error }, { data: incoming, error: e2 }] = await Promise.all([
          supabase.from('users').select('username').eq('id', userId).maybeSingle(),
          supabase.from('friend_requests').select('from_id, created_at').eq('to_id', userId).order('created_at', { ascending: false }),
        ]);
        if (error || e2) throw error ?? e2;
        const ids = (incoming ?? []).map((r) => r.from_id as string);
        let requests: UserHit[] = [];
        if (ids.length) {
          const { data: profiles } = await supabase.from('leaderboard_profiles').select('id, display_name, username').in('id', ids);
          const map = new Map((profiles ?? []).map((p) => [p.id as string, p]));
          requests = ids.map((id) => ({
            id,
            username: (map.get(id)?.username as string) ?? '',
            name: (map.get(id)?.display_name as string) ?? 'Someone',
            status: 'received',
          }));
        }
        set({ username: (me?.username as string | null) ?? null, requests });
      } catch (e) {
        console.warn('[FriendRequests] load failed:', (e as Error)?.message ?? e);
        if (DEMO_DATA_ENABLED) set({ requests: demoRequests() });
      }
    },

    setUsername: async (userId, name) => {
      const u = clean(name);
      if (!USERNAME_RE.test(u)) return 'invalid';
      try {
        const { error } = await supabase.from('users').update({ username: u }).eq('id', userId);
        if (error) {
          if (error.code === '23505') return 'taken';
          throw error;
        }
        set({ username: u });
        return 'ok';
      } catch (e) {
        console.warn('[FriendRequests] set username failed:', (e as Error)?.message ?? e);
        if (DEMO_DATA_ENABLED) {
          if (DEMO_DIRECTORY.some((d) => d.username === u)) return 'taken';
          set({ username: u });
          return 'ok';
        }
        return 'error';
      }
    },

    search: async (q) => {
      const term = clean(q);
      if (term.length < 2) return [];
      try {
        const { data, error } = await supabase.rpc('search_users', { q: term });
        if (error) throw error;
        return (data ?? []).map((r: any) => ({
          id: r.id,
          username: r.username,
          name: r.display_name ?? r.username,
          status: r.status as Relation,
        }));
      } catch (e) {
        if (!DEMO_DATA_ENABLED) {
          console.warn('[FriendRequests] search failed:', (e as Error)?.message ?? e);
          return [];
        }
        return DEMO_DIRECTORY.filter((u) => u.username.startsWith(term) || u.name.toLowerCase().includes(term)).map((u) => ({
          ...u,
          status: demoStatus(u),
        }));
      }
    },

    sendRequest: async (id) => {
      if (isDemoId(id)) {
        const u = DEMO_DIRECTORY.find((d) => d.id === id);
        const next: Relation = u && demoStatus(u) === 'received' ? 'friend' : 'sent';
        setDemo(id, next);
        set({ requests: get().requests.filter((r) => r.id !== id) });
        return next;
      }
      const { data, error } = await supabase.rpc('send_friend_request', { target: id });
      if (error) throw error;
      const next: Relation = data === 'friends' ? 'friend' : 'sent';
      set({ requests: get().requests.filter((r) => r.id !== id) });
      return next;
    },

    accept: async (id) => {
      set({ requests: get().requests.filter((r) => r.id !== id) });
      if (isDemoId(id)) return setDemo(id, 'friend');
      const { error } = await supabase.rpc('accept_friend_request', { requester: id });
      if (error) throw error;
    },

    decline: async (id) => {
      set({ requests: get().requests.filter((r) => r.id !== id) });
      if (isDemoId(id)) return setDemo(id, 'none');
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id;
      if (!me) return;
      const { error } = await supabase.from('friend_requests').delete().eq('from_id', id).eq('to_id', me);
      if (error) throw error;
    },
  };
});
