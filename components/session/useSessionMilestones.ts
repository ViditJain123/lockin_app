import { useEffect, useMemo, useRef, useState } from 'react';

import { REELS_PER_MINUTE } from '@/components/dashboard/TodayCard';
import { getLocalDateString } from '@/lib/dateUtils';
import { goalReachedPattern, milestonePulse } from '@/lib/haptics';
import { playSound } from '@/lib/sound';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useSessionStore } from '@/store/useSessionStore';

const MILESTONE_EVERY_SECONDS = 5 * 60;

/**
 * Live session feedback shared by the timelapse and phone-down screens:
 * a soft ping + pulse every 5 minutes, and a fanfare when today's goal is hit
 * mid-session. Returns a short message to show as a toast, and goal progress.
 */
export function useSessionMilestones(elapsedSeconds: number, isActive: boolean) {
  const targetHours = useOnboardingStore((s) => s.quizAnswers.targetHours) || 4;
  const sessions = useSessionStore((s) => s.sessions);

  // Focus already banked today before this session started
  const bankedMinutes = useMemo(() => {
    const today = getLocalDateString();
    return sessions
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + (s.total_locked_in_seconds || 0) / 60, 0);
    // Only snapshot when a session starts, so it doesn't jump on save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const goalMinutes = targetHours * 60;
  const todayMinutes = bankedMinutes + elapsedSeconds / 60;
  const goalProgress = goalMinutes > 0 ? Math.min(todayMinutes / goalMinutes, 1) : 0;

  const [toast, setToast] = useState<string | null>(null);
  const lastMilestoneRef = useRef(0);
  const goalFiredRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      lastMilestoneRef.current = 0;
      goalFiredRef.current = bankedMinutes >= goalMinutes;
      return;
    }

    if (!goalFiredRef.current && todayMinutes >= goalMinutes && goalMinutes > 0) {
      goalFiredRef.current = true;
      playSound('goal');
      goalReachedPattern();
      setToast(`Daily goal hit · ${targetHours}h today`);
      return;
    }

    const step = Math.floor(elapsedSeconds / MILESTONE_EVERY_SECONDS);
    if (step > lastMilestoneRef.current) {
      lastMilestoneRef.current = step;
      const mins = step * (MILESTONE_EVERY_SECONDS / 60);
      playSound('ping');
      milestonePulse();
      setToast(`${mins} min locked in · ~${mins * REELS_PER_MINUTE} reels skipped`);
    }
  }, [elapsedSeconds, isActive, todayMinutes, goalMinutes, bankedMinutes, targetHours]);

  // Auto-hide
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  return { toast, setToast, goalProgress, todayMinutes, goalMinutes };
}
