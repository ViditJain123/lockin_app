/**
 * Sync Engine
 *
 * Central coordinator for database-first sync.
 * Replaces all scattered sync logic with a single pull/push flow.
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

import { supabase } from './supabase';
import {
  pullUserProfile,
  pullUserTasks,
  pullUserBadges,
  pushUserProfile,
  pushTaskUpsert,
  pushTaskDelete,
  pushTasksResetForNewDay,
  pushNewBadges,
} from './syncService';
import { fetchUserStats, fetchDailyActivity, updateStatsAfterSave } from './statsService';
import { recordSession } from './sessionService';
import {
  resolveStats,
  resolveTasks,
  resolveBadges,
  resolveProfile,
  resolveHeatmap,
  resolveGrinds,
  TaskWithTimestamp,
} from './conflictResolver';
import {
  enqueueChange as enqueueToQueue,
  getPendingChanges,
  removeChange,
  markChangeFailed,
  PendingChangeType,
} from './pendingChangesQueue';

import { useTaskStore } from '../store/useTaskStore';
import { useBadgeStore } from '../store/useBadgeStore';
import { useGrindsStore } from '../store/useGrindsStore';
import { useHeatmapStore } from '../store/useHeatmapStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useProfileStore } from '../store/useProfileStore';

// ─── State ──────────────────────────────────────────────

let isOnline = true;
let isSyncing = false;
let lastSyncAt: number | null = null;
let syncError: string | null = null;

// Listener subscriptions
let netInfoUnsubscribe: (() => void) | null = null;
let appStateSubscription: { remove: () => void } | null = null;

// Staleness threshold (30 seconds)
const STALE_THRESHOLD_MS = 30 * 1000;

// Change listeners for React hook
type SyncStateListener = () => void;
const listeners = new Set<SyncStateListener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function subscribeSyncState(listener: SyncStateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSyncState() {
  return { isOnline, isSyncing, lastSyncAt, syncError };
}

// ─── Initialization ─────────────────────────────────────

export function initializeSyncEngine(): void {
  // NetInfo listener
  netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const wasOffline = !isOnline;
    isOnline = state.isConnected ?? false;
    notifyListeners();

    // Offline → Online transition: flush queue + pull
    if (wasOffline && isOnline) {
      console.log('[SyncEngine] Back online, flushing + pulling');
      getCurrentUserId().then((uid) => {
        if (uid) {
          flushPendingQueue(uid).then(() => performFullPull(uid));
        }
      });
    }
  });

  // AppState listener — pull if stale when foregrounded
  appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      const stale = lastSyncAt === null || Date.now() - lastSyncAt > STALE_THRESHOLD_MS;
      if (stale && isOnline) {
        getCurrentUserId().then((uid) => {
          if (uid) performFullPull(uid);
        });
      }
    }
  });

  console.log('[SyncEngine] Initialized');
}

export function teardownSyncEngine(): void {
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  console.log('[SyncEngine] Torn down');
}

// ─── Full Pull ──────────────────────────────────────────

export async function performFullPull(userId: string): Promise<void> {
  if (isSyncing) return;
  if (!isOnline) return;

  isSyncing = true;
  syncError = null;
  notifyListeners();

  try {
    // Parallel fetch all data from Supabase
    const [remoteProfile, remoteTasks, remoteBadges, remoteStats, remoteActivity, remoteGrinds] =
      await Promise.all([
        pullUserProfile(userId),
        pullUserTasks(userId),
        pullUserBadges(userId),
        fetchUserStats(userId),
        fetchDailyActivity(userId, 12),
        fetchRemoteGrinds(userId),
      ]);

    // ── Resolve Profile ──
    if (remoteProfile) {
      const localStore = useOnboardingStore.getState();
      const localUpdatedAt = localStore.localUpdatedAt || 0;

      // If remote profile exists, user has completed onboarding
      const remoteUpdatedAt = Date.now(); // We don't have a timestamp from remote, treat as current
      const resolved = resolveProfile(
        { data: localStore.quizAnswers, updatedAt: localUpdatedAt },
        { data: remoteProfile, updatedAt: remoteUpdatedAt }
      );

      localStore.updateFromRemote(resolved.data, true);
    }

    // ── Resolve Tasks ──
    const localTasks = useTaskStore.getState().tasks;
    const localTasksWithTs: TaskWithTimestamp[] = localTasks.map((t) => ({
      ...t,
      updatedAt: (t as any).updatedAt || t.createdAt,
    }));
    const remoteTasksWithTs: TaskWithTimestamp[] = remoteTasks.map((t) => ({
      ...t,
      updatedAt: (t as any).updatedAt || t.createdAt,
    }));
    const resolvedTasks = resolveTasks(localTasksWithTs, remoteTasksWithTs);
    useTaskStore.getState().updateFromRemote(resolvedTasks);

    // ── Resolve Badges ──
    const localBadges = useBadgeStore.getState().earnedBadges;
    const resolvedBadges = resolveBadges(localBadges, remoteBadges);
    useBadgeStore.getState().updateFromRemote(resolvedBadges);

    // ── Resolve Stats ──
    if (remoteStats) {
      const localProfileStore = useProfileStore.getState();
      const resolvedStats = resolveStats(
        {
          totalHours: localProfileStore.totalHours,
          totalGrinds: localProfileStore.totalGrinds,
          currentStreak: localProfileStore.currentStreak,
        },
        {
          totalHours: remoteStats.totalHours,
          totalGrinds: remoteStats.totalGrinds,
          currentStreak: remoteStats.currentStreak,
        }
      );
      localProfileStore.updateFromRemote(resolvedStats);
    }

    // ── Resolve Heatmap ──
    const localHeatmap = useHeatmapStore.getState().activityByDate;
    const resolvedHeatmap = resolveHeatmap(localHeatmap, remoteActivity);
    useHeatmapStore.getState().updateFromRemote(resolvedHeatmap);

    // ── Resolve Grinds ──
    const localGrinds = useGrindsStore.getState().grinds;
    const resolvedGrinds = resolveGrinds(localGrinds, remoteGrinds);
    useGrindsStore.getState().updateFromRemote(resolvedGrinds);

    lastSyncAt = Date.now();
    console.log('[SyncEngine] Full pull complete');
  } catch (err: any) {
    syncError = err.message || 'Sync failed';
    console.error('[SyncEngine] Pull error:', err);
  } finally {
    isSyncing = false;
    notifyListeners();
  }
}

// ─── Flush Pending Queue ────────────────────────────────

export async function flushPendingQueue(userId: string): Promise<void> {
  if (!isOnline) return;

  const changes = await getPendingChanges();
  if (changes.length === 0) return;

  console.log('[SyncEngine] Flushing', changes.length, 'pending changes');

  for (const change of changes) {
    try {
      let success = false;

      switch (change.type) {
        case 'PROFILE_UPDATE':
          success = await pushUserProfile(userId, change.payload);
          break;

        case 'TASK_UPSERT':
          success = await pushTaskUpsert(userId, change.payload);
          break;

        case 'TASK_DELETE':
          success = await pushTaskDelete(userId, change.payload.taskId);
          break;

        case 'TASK_RESET':
          success = await pushTasksResetForNewDay(
            userId,
            change.payload.completedOneTimeIds,
            change.payload.dailyTaskIds
          );
          break;

        case 'BADGE_PUSH':
          success = await pushNewBadges(userId, change.payload);
          break;

        case 'GRIND_RECORD': {
          const { durationMs } = change.payload;
          const [sessionOk, statsOk] = await Promise.all([
            recordSession(userId, durationMs),
            updateStatsAfterSave(userId, durationMs / 1000),
          ]);
          success = sessionOk && statsOk;
          break;
        }

        case 'STATS_UPDATE':
          success = await updateStatsAfterSave(userId, change.payload.durationSeconds);
          break;
      }

      if (success) {
        await removeChange(change.id);
      } else {
        await markChangeFailed(change.id);
      }
    } catch (err) {
      console.error('[SyncEngine] Flush error for', change.type, ':', err);
      await markChangeFailed(change.id);
    }
  }
}

// ─── Enqueue Change ─────────────────────────────────────

export async function enqueueChange(
  type: PendingChangeType,
  key: string,
  payload: any
): Promise<void> {
  await enqueueToQueue(type, key, payload);

  // If online, flush immediately
  if (isOnline) {
    const uid = await getCurrentUserId();
    if (uid) {
      flushPendingQueue(uid).catch((err) =>
        console.error('[SyncEngine] Immediate flush failed:', err)
      );
    }
  }
}

// ─── Helpers ────────────────────────────────────────────

async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

async function fetchRemoteGrinds(userId: string): Promise<import('../store/useGrindsStore').GrindSession[]> {
  const { data, error } = await supabase
    .from('grinds')
    .select('id, created_at, duration_ms')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SyncEngine] fetchRemoteGrinds error:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    durationSeconds: (row.duration_ms || 0) / 1000,
  }));
}
