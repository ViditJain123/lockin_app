import { useMemo } from 'react';

import { DEMO_DATA_ENABLED } from '@/lib/config';
import { getLocalDateString } from '@/lib/dateUtils';
import { useAppLockStore } from '@/store/useAppLockStore';
import { useScreenTimeLogStore } from '@/store/useScreenTimeLogStore';
import { type LocalSession, useSessionStore } from '@/store/useSessionStore';

export interface DayFocus {
  date: string;
  focusMin: number; // locked-in minutes
  screenMin: number; // screen-time minutes
}

// Deterministic pseudo-random so demo data doesn't jump between renders
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function demoFocus(daysAgo: number) {
  const base = 70 + Math.sin(daysAgo / 4) * 60 + rand(daysAgo) * 120;
  return rand(daysAgo + 99) < 0.15 ? 0 : Math.max(0, Math.round(base));
}
function demoScreen(daysAgo: number) {
  return Math.round(25 + rand(daysAgo + 7) * 110);
}

/** Minutes locked in per local date (YYYY-MM-DD). */
export function useFocusByDate(): Record<string, number> {
  const sessions = useSessionStore((s) => s.sessions);
  return useMemo(() => {
    const out: Record<string, number> = {};
    if (DEMO_DATA_ENABLED) {
      for (let d = 0; d < 200; d++) {
        const dt = new Date();
        dt.setDate(dt.getDate() - d);
        out[getLocalDateString(dt)] = demoFocus(d);
      }
    }
    for (const s of sessions) {
      out[s.date] = (out[s.date] ?? 0) + (s.total_locked_in_seconds || 0) / 60;
    }
    return out;
  }, [sessions]);
}

/** Monday-first days of the current week with lock-in and screen time. */
export function useThisWeek() {
  const focusByDate = useFocusByDate();
  const log = useScreenTimeLogStore((s) => s.byDate);
  const todayUsed = useAppLockStore((s) => s.usedScreenTimeSeconds);

  return useMemo(() => {
    const now = new Date();
    const todayIndex = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setHours(12, 0, 0, 0);
    monday.setDate(monday.getDate() - todayIndex);
    const todayKey = getLocalDateString(now);

    const day = (offset: number): DayFocus => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + offset);
      const key = getLocalDateString(d);
      const daysAgo = Math.round((now.getTime() - d.getTime()) / 86400000);
      let screenMin = (log[key] ?? 0) / 60;
      if (key === todayKey) screenMin = Math.max(screenMin, todayUsed / 60);
      if (DEMO_DATA_ENABLED && screenMin === 0) screenMin = demoScreen(daysAgo);
      return { date: key, focusMin: focusByDate[key] ?? 0, screenMin };
    };

    const days = Array.from({ length: 7 }, (_, i) => (i <= todayIndex ? day(i) : { date: '', focusMin: 0, screenMin: 0 }));
    let lastWeekFocus = 0;
    for (let i = 0; i <= todayIndex; i++) lastWeekFocus += day(i - 7).focusMin;

    return { days, todayIndex, lastWeekFocus, today: days[todayIndex] };
  }, [focusByDate, log, todayUsed]);
}

/** Sessions for the rhythm chart (plus generated ones in demo mode). */
export function useRhythmSessions(days: number): LocalSession[] {
  const sessions = useSessionStore((s) => s.sessions);
  return useMemo(() => {
    if (!DEMO_DATA_ENABLED) return sessions;
    const out: LocalSession[] = [...sessions];
    for (let d = 0; d < days; d++) {
      for (const h of [7, 9, 10, 11, 14, 15, 16, 20, 21, 22]) {
        if (rand(d * 31 + h) < 0.35) continue;
        const st = new Date();
        st.setDate(st.getDate() - d);
        st.setHours(h, Math.floor(rand(d + h) * 30), 0, 0);
        if (st.getTime() > Date.now()) continue;
        const mins = 10 + Math.floor(rand(d * h + 3) * 50);
        out.push({
          session_id: `demo-${d}-${h}`,
          date: getLocalDateString(st),
          total_locked_in_seconds: mins * 60,
          created_at: st.toISOString(),
          time_started: st.toISOString(),
          time_ended: new Date(st.getTime() + mins * 60000).toISOString(),
        });
      }
    }
    return out;
  }, [sessions, days]);
}
