/**
 * Conflict Resolver
 *
 * Pure functions for merging local and remote data.
 * No side effects — takes both sides and returns the merged result.
 */

import { Task } from '../store/useTaskStore';
import { EarnedBadge } from '../store/useBadgeStore';
import { GrindSession } from '../store/useGrindsStore';
import { DailyActivity } from './statsService';

// ─── Stats: Higher-value-wins ────────────────────────────

export interface StatValues {
  totalHours: number;
  totalGrinds: number;
  currentStreak: number;
}

export function resolveStats(local: StatValues, remote: StatValues): StatValues {
  return {
    totalHours: Math.max(local.totalHours, remote.totalHours),
    totalGrinds: Math.max(local.totalGrinds, remote.totalGrinds),
    currentStreak: Math.max(local.currentStreak, remote.currentStreak),
  };
}

// ─── Tasks: Last-write-wins + union ─────────────────────

export interface TaskWithTimestamp extends Task {
  updatedAt: string; // ISO string
}

export function resolveTasks(
  local: TaskWithTimestamp[],
  remote: TaskWithTimestamp[]
): TaskWithTimestamp[] {
  const merged = new Map<string, TaskWithTimestamp>();

  // Add all remote tasks
  for (const task of remote) {
    merged.set(task.id, task);
  }

  // Overlay local tasks — if newer or remote doesn't have it
  for (const task of local) {
    const existing = merged.get(task.id);
    if (!existing) {
      merged.set(task.id, task);
    } else {
      const localTime = new Date(task.updatedAt).getTime();
      const remoteTime = new Date(existing.updatedAt).getTime();
      if (localTime > remoteTime) {
        merged.set(task.id, task);
      }
    }
  }

  return Array.from(merged.values());
}

// ─── Badges: Union merge ────────────────────────────────

export function resolveBadges(
  local: EarnedBadge[],
  remote: EarnedBadge[]
): EarnedBadge[] {
  const merged = new Map<string, EarnedBadge>();

  // Add all remote badges
  for (const badge of remote) {
    merged.set(badge.badgeId, badge);
  }

  // Union with local — keep earlier earnedAt for duplicates
  for (const badge of local) {
    const existing = merged.get(badge.badgeId);
    if (!existing) {
      merged.set(badge.badgeId, badge);
    } else if (badge.earnedAt < existing.earnedAt) {
      merged.set(badge.badgeId, badge);
    }
  }

  return Array.from(merged.values());
}

// ─── Profile: Last-write-wins ───────────────────────────

export interface ProfileWithTimestamp<T> {
  data: T;
  updatedAt: number; // epoch ms
}

export function resolveProfile<T>(
  local: ProfileWithTimestamp<T>,
  remote: ProfileWithTimestamp<T>
): ProfileWithTimestamp<T> {
  return local.updatedAt > remote.updatedAt ? local : remote;
}

// ─── Heatmap: Max-per-date ──────────────────────────────

export function resolveHeatmap(
  local: Record<string, number>,
  remote: DailyActivity[]
): Record<string, number> {
  const merged: Record<string, number> = { ...local };

  for (const entry of remote) {
    const existing = merged[entry.date] || 0;
    merged[entry.date] = Math.max(existing, entry.totalMinutes);
  }

  return merged;
}

// ─── Grinds: Union by ID ────────────────────────────────

export function resolveGrinds(
  local: GrindSession[],
  remote: GrindSession[]
): GrindSession[] {
  const merged = new Map<string, GrindSession>();

  for (const grind of remote) {
    merged.set(grind.id, grind);
  }

  for (const grind of local) {
    if (!merged.has(grind.id)) {
      merged.set(grind.id, grind);
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
