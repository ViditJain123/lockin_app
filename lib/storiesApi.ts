/**
 * Stories service.
 *
 * Videos live in S3 and play through CloudFront; rows live in Supabase.
 * The app talks to the AWS Lambda only to get an upload link and to delete a
 * story. Reading the feed, counting views and listing viewers go straight to
 * Supabase under row level security.
 */
import * as FileSystem from 'expo-file-system/legacy';

import { STORIES_API_URL, STORIES_CDN_URL } from './config';
import { supabase } from './supabase';
import { compressForStory } from './timelapseModule';

const CACHE_DIR = `${FileSystem.cacheDirectory}stories/`;

export const storiesConfigured = () => !!STORIES_API_URL && !!STORIES_CDN_URL;

/** Public playback URL for a story's S3 key */
export function storyVideoUrl(videoPath: string): string | null {
  if (!STORIES_CDN_URL || !videoPath.startsWith('v/')) return null;
  return `${STORIES_CDN_URL.replace(/\/$/, '')}/${videoPath}`;
}

async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return token;
}

async function api<T>(method: 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${STORIES_API_URL.replace(/\/$/, '')}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(json?.error ?? `Stories API ${res.status}`);
  return json as T;
}

export interface PostedStory {
  storyId: string;
  createdAt: string;
}

/**
 * Shrinks the timelapse, uploads it straight to S3 and records the story.
 * `onProgress` receives 0..1 while the upload runs.
 */
export async function uploadStory(
  userId: string,
  localVideoUri: string,
  durationSeconds: number,
  onProgress?: (fraction: number) => void
): Promise<PostedStory> {
  // Smaller copy for sharing (about a third of the size). Falls back to the
  // original if the native exporter is missing or fails.
  let uploadUri = localVideoUri;
  let tempUri: string | null = null;
  try {
    tempUri = await compressForStory(localVideoUri);
    if (tempUri) uploadUri = tempUri;
  } catch (e) {
    console.warn('[Stories] compress failed, uploading original:', (e as Error)?.message ?? e);
  }

  let storyId: string | null = null;
  try {
    const info = await FileSystem.getInfoAsync(uploadUri);
    if (!info.exists || !info.size) throw new Error('Timelapse file is missing');

    const ticket = await api<{ storyId: string; videoPath: string; uploadUrl: string; uploadHeaders: Record<string, string> }>(
      'POST',
      '/stories/upload-url',
      { sizeBytes: info.size }
    );
    storyId = ticket.storyId;

    const task = FileSystem.createUploadTask(
      ticket.uploadUrl,
      uploadUri,
      { httpMethod: 'PUT', uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT, headers: ticket.uploadHeaders },
      (p) => {
        if (p.totalBytesExpectedToSend > 0) onProgress?.(p.totalBytesSent / p.totalBytesExpectedToSend);
      }
    );
    const result = await task.uploadAsync();
    if (!result || result.status < 200 || result.status >= 300) {
      throw new Error(`Upload failed (${result?.status ?? 'no response'})`);
    }

    const { data, error } = await supabase
      .from('stories')
      .insert({ id: ticket.storyId, user_id: userId, video_path: ticket.videoPath, duration_seconds: Math.round(durationSeconds) })
      .select('created_at')
      .single();
    if (error) throw error;

    return { storyId: ticket.storyId, createdAt: data.created_at as string };
  } catch (e) {
    // Don't leave an uploaded file behind with no story pointing at it
    if (storyId) deleteStory(storyId).catch(() => {});
    throw e;
  } finally {
    if (tempUri) FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});
  }
}

export async function deleteStory(storyId: string): Promise<void> {
  await api('DELETE', `/stories/${storyId}`);
}

/** Records that the signed-in user watched a friend's story (once per story). */
export async function recordView(storyId: string): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const viewerId = data.session?.user?.id;
  if (!viewerId) return;
  const { error } = await supabase
    .from('story_views')
    .upsert({ story_id: storyId, viewer_id: viewerId }, { onConflict: 'story_id,viewer_id', ignoreDuplicates: true });
  if (error) console.warn('[Stories] view not recorded:', error.message);
}

export interface StoryViewer {
  id: string;
  name: string;
  viewedAt: string;
}

/** Who watched one of your stories, most recent first. */
export async function fetchViewers(storyId: string): Promise<StoryViewer[]> {
  const { data: views, error } = await supabase
    .from('story_views')
    .select('viewer_id, viewed_at')
    .eq('story_id', storyId)
    .order('viewed_at', { ascending: false });
  if (error) throw error;
  const ids = (views ?? []).map((v) => v.viewer_id as string);
  if (ids.length === 0) return [];
  const { data: names } = await supabase.from('leaderboard_profiles').select('id, display_name, username').in('id', ids);
  const nameMap = new Map(
    (names ?? []).map((n) => [n.id as string, ((n.display_name as string | null) || (n.username as string | null) || 'Friend') as string])
  );
  return (views ?? []).map((v) => ({
    id: v.viewer_id as string,
    name: nameMap.get(v.viewer_id as string) ?? 'Friend',
    viewedAt: v.viewed_at as string,
  }));
}

/** View counts for your own live stories, keyed by story id. */
export async function fetchMyViewCounts(userId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('stories')
    .select('id, story_views(count)')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString());
  if (error) throw error;
  const out = new Map<string, number>();
  for (const row of data ?? []) {
    const agg = (row as any).story_views;
    out.set(row.id as string, Number(Array.isArray(agg) ? agg[0]?.count ?? 0 : agg?.count ?? 0));
  }
  return out;
}

// ─── On-device cache ─────────────────────────────────────────────────────────
// Each story is downloaded at most once per device, so replays are instant and
// cost no bandwidth.

const cachePath = (storyId: string) => `${CACHE_DIR}${storyId}.mp4`;
const inFlight = new Map<string, Promise<string | null>>();

/** Local file for a story if it has already been downloaded, else null. */
export async function cachedStoryUri(storyId: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(cachePath(storyId));
    return info.exists && info.size ? info.uri : null;
  } catch {
    return null;
  }
}

/** Downloads a story into the cache (no-op if it is already there). */
export function prefetchStory(storyId: string, url: string): Promise<string | null> {
  const running = inFlight.get(storyId);
  if (running) return running;
  const job = (async () => {
    const hit = await cachedStoryUri(storyId);
    if (hit) return hit;
    const tmp = `${cachePath(storyId)}.part`;
    try {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      const res = await FileSystem.downloadAsync(url, tmp);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      await FileSystem.moveAsync({ from: tmp, to: cachePath(storyId) });
      return cachePath(storyId);
    } catch {
      FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => {});
      return null;
    } finally {
      inFlight.delete(storyId);
    }
  })();
  inFlight.set(storyId, job);
  return job;
}

/** Removes cached videos for stories that are no longer in the feed. */
export async function pruneStoryCache(keepIds: string[]): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) return;
    const keep = new Set(keepIds);
    for (const name of await FileSystem.readDirectoryAsync(CACHE_DIR)) {
      const id = name.split('.')[0];
      if (!keep.has(id) && !inFlight.has(id)) {
        await FileSystem.deleteAsync(`${CACHE_DIR}${name}`, { idempotent: true });
      }
    }
  } catch {}
}
