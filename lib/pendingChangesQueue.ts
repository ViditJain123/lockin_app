/**
 * Pending Changes Queue
 *
 * Persistent offline queue stored in AsyncStorage.
 * FIFO processing with dedup by type+key.
 * Max 5 retries before dead-letter (never discard data).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'lockin-pending-sync-queue';
const DEAD_LETTER_KEY = 'lockin-dead-letter-queue';
const MAX_RETRIES = 5;

export type PendingChangeType =
  | 'PROFILE_UPDATE'
  | 'TASK_UPSERT'
  | 'TASK_DELETE'
  | 'TASK_RESET'
  | 'BADGE_PUSH'
  | 'GRIND_RECORD';

export interface PendingChange {
  id: string;
  type: PendingChangeType;
  key: string; // dedup key (e.g. task ID, 'profile', badge ID)
  payload: any;
  createdAt: number;
  retryCount: number;
}

let memoryQueue: PendingChange[] | null = null;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Load queue from AsyncStorage into memory
 */
async function loadQueue(): Promise<PendingChange[]> {
  if (memoryQueue !== null) return memoryQueue;

  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    memoryQueue = raw ? JSON.parse(raw) : [];
  } catch {
    memoryQueue = [];
  }
  return memoryQueue!;
}

/**
 * Persist current in-memory queue to AsyncStorage
 */
async function persistQueue(): Promise<void> {
  if (memoryQueue === null) return;
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(memoryQueue));
  } catch (err) {
    console.error('[PendingQueue] Failed to persist:', err);
  }
}

/**
 * Enqueue a change. Deduplicates by type+key — latest payload wins.
 */
export async function enqueueChange(
  type: PendingChangeType,
  key: string,
  payload: any
): Promise<void> {
  const queue = await loadQueue();

  // Dedup: remove existing entry with same type+key
  const idx = queue.findIndex((c) => c.type === type && c.key === key);
  if (idx !== -1) {
    queue.splice(idx, 1);
  }

  queue.push({
    id: generateId(),
    type,
    key,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  });

  await persistQueue();
}

/**
 * Get all pending changes (FIFO order)
 */
export async function getPendingChanges(): Promise<PendingChange[]> {
  return loadQueue();
}

/**
 * Remove a successfully processed change
 */
export async function removeChange(id: string): Promise<void> {
  const queue = await loadQueue();
  const idx = queue.findIndex((c) => c.id === id);
  if (idx !== -1) {
    queue.splice(idx, 1);
    await persistQueue();
  }
}

/**
 * Mark a change as failed. Increments retry count.
 * If max retries exceeded, moves to dead-letter queue.
 */
export async function markChangeFailed(id: string): Promise<void> {
  const queue = await loadQueue();
  const idx = queue.findIndex((c) => c.id === id);
  if (idx === -1) return;

  const change = queue[idx];
  change.retryCount += 1;

  if (change.retryCount >= MAX_RETRIES) {
    // Move to dead-letter queue
    queue.splice(idx, 1);
    try {
      const raw = await AsyncStorage.getItem(DEAD_LETTER_KEY);
      const deadLetter: PendingChange[] = raw ? JSON.parse(raw) : [];
      deadLetter.push(change);
      await AsyncStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(deadLetter));
      console.warn('[PendingQueue] Moved to dead-letter after', MAX_RETRIES, 'retries:', change.type, change.key);
    } catch (err) {
      console.error('[PendingQueue] Failed to write dead-letter:', err);
    }
  }

  await persistQueue();
}

/**
 * Check if queue has pending changes
 */
export async function hasPendingChanges(): Promise<boolean> {
  const queue = await loadQueue();
  return queue.length > 0;
}

/**
 * Clear the in-memory cache (for testing)
 */
export function resetMemoryCache(): void {
  memoryQueue = null;
}
