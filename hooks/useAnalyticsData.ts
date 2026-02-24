import { useMemo } from 'react';

import { BADGES_BY_CATEGORY, BadgeCategory, BadgeDefinition } from '@/constants/Badges';
import {
  formatDateRange,
  getDateRange,
  getLocalDateString,
  getMonthEndDate,
  getMonthStartDate,
  getWeekEndDate,
  getWeekStartDate,
} from '@/lib/dateUtils';
import { useBadgeStore } from '@/store/useBadgeStore';
import { useEarnedTimeStore } from '@/store/useEarnedTimeStore';
import { useHeatmapStore } from '@/store/useHeatmapStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useVideoStore } from '@/store/useVideoStore';

export type AnalyticsTab = 'daily' | 'weekly' | 'monthly';

export interface StatItem {
  label: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
  icon?: string;
  iconFamily?: 'Ionicons' | 'MaterialCommunityIcons';
}

export interface HourlyData {
  hour: number;
  minutes: number;
}

export interface BadgeProgressItem {
  category: BadgeCategory;
  badge: BadgeDefinition;
  current: number;
  target: number;
  progress: number; // 0-1
}

export interface AnalyticsData {
  // Period info
  periodLabel: string;
  canGoForward: boolean;

  // Summary
  totalMinutes: number;
  totalHours: number;
  sessionCount: number;
  longestSessionMinutes: number;
  avgSessionMinutes: number;
  earnedScreenTimeSeconds: number;
  currentStreak: number;

  // Daily-specific
  hourlyData: HourlyData[];
  focusHours: number;
  targetHours: number;

  // Weekly/Monthly comparison
  percentChange: number | null; // null when both periods are zero
  previousPeriodMinutes: number;

  // Weekly-specific
  weekReferenceDate: Date;
  mostProductiveDay: string;

  // Monthly-specific
  daysActive: number;
  daysTargetHit: number;
  totalDaysInPeriod: number;
  consistencyPercent: number;
  bestDayLabel: string;
  bestDayMinutes: number;

  // Stats grid (pre-computed for convenience)
  statsGrid: StatItem[];

  // Badge progress (monthly only)
  badgeProgress: BadgeProgressItem[];
}

function formatMinutesShort(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatHoursDecimal(hours: number): string {
  if (hours === 0) return '0h';
  if (hours < 0.1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

export function useAnalyticsData(tab: AnalyticsTab, selectedDate: Date): AnalyticsData {
  const activityByDate = useHeatmapStore((s) => s.activityByDate);
  const videos = useVideoStore((s) => s.videos);
  const { currentStreak } = useProfileStore();
  const { earnedTimeToday, totalGrindSecondsToday } = useEarnedTimeStore();
  const { quizAnswers } = useOnboardingStore();
  const earnedBadges = useBadgeStore((s) => s.earnedBadges);
  const { totalHours: profileTotalHours, totalGrinds: profileTotalGrinds } = useProfileStore();

  const targetHours = quizAnswers.targetHours || 4;
  const today = getLocalDateString();

  return useMemo(() => {
    // Determine date range based on tab
    let rangeStart: Date;
    let rangeEnd: Date;
    let periodLabel: string;

    if (tab === 'daily') {
      rangeStart = new Date(selectedDate);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(rangeStart);
      const weekday = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      const day = selectedDate.getDate();
      const month = selectedDate.toLocaleDateString('en-US', { month: 'short' });
      periodLabel = `${weekday}, ${day} ${month}`;
    } else if (tab === 'weekly') {
      rangeStart = getWeekStartDate(selectedDate);
      rangeEnd = getWeekEndDate(selectedDate);
      periodLabel = formatDateRange(rangeStart, rangeEnd);
    } else {
      rangeStart = getMonthStartDate(selectedDate);
      rangeEnd = getMonthEndDate(selectedDate);
      periodLabel = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // Can't navigate to future
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    let canGoForward: boolean;
    if (tab === 'daily') {
      canGoForward = getLocalDateString(selectedDate) !== today;
    } else if (tab === 'weekly') {
      const currentWeekStart = getWeekStartDate(todayDate);
      canGoForward = rangeStart.getTime() < currentWeekStart.getTime();
    } else {
      const currentMonthStart = getMonthStartDate(todayDate);
      canGoForward = rangeStart.getTime() < currentMonthStart.getTime();
    }

    // Get date strings in range
    const dateStrings = getDateRange(rangeStart, rangeEnd);
    const selectedDateStr = getLocalDateString(selectedDate);
    const isCurrentPeriod = tab === 'daily'
      ? selectedDateStr === today
      : dateStrings.includes(today);

    // Sum activity minutes from heatmap
    let totalMinutes = 0;
    for (const ds of dateStrings) {
      totalMinutes += activityByDate[ds] || 0;
    }

    // Filter videos in this period
    const periodVideos = videos.filter((v) => {
      const videoDate = getLocalDateString(new Date(v.createdAt));
      return dateStrings.includes(videoDate);
    });

    const sessionCount = periodVideos.length;
    const longestSessionMinutes = periodVideos.length > 0
      ? Math.max(...periodVideos.map((v) => v.durationSeconds / 60))
      : 0;
    const avgSessionMinutes = sessionCount > 0
      ? periodVideos.reduce((sum, v) => sum + v.durationSeconds / 60, 0) / sessionCount
      : 0;

    // Earned screen time
    let earnedScreenTimeSeconds: number;
    if (tab === 'daily' && selectedDateStr === today) {
      earnedScreenTimeSeconds = earnedTimeToday;
    } else {
      // Estimate: minutes * 60 / 4
      earnedScreenTimeSeconds = (totalMinutes * 60) / 4;
    }

    // Hourly distribution (daily only)
    const hourlyData: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      minutes: 0,
    }));

    if (tab === 'daily') {
      const dayVideos = periodVideos;
      for (const v of dayVideos) {
        const createdDate = new Date(v.createdAt);
        const hour = createdDate.getHours();
        hourlyData[hour].minutes += v.durationSeconds / 60;
      }
    }

    // Focus hours for ring
    const focusHours = totalMinutes / 60;

    // Compute previous period for % change
    let previousPeriodMinutes = 0;
    let percentChange: number | null = null;

    if (tab === 'weekly') {
      const prevStart = new Date(rangeStart);
      prevStart.setDate(prevStart.getDate() - 7);
      const prevEnd = new Date(rangeEnd);
      prevEnd.setDate(prevEnd.getDate() - 7);
      const prevDates = getDateRange(prevStart, prevEnd);
      for (const ds of prevDates) {
        previousPeriodMinutes += activityByDate[ds] || 0;
      }
    } else if (tab === 'monthly') {
      const prevMonthDate = new Date(selectedDate);
      prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
      const prevStart = getMonthStartDate(prevMonthDate);
      const prevEnd = getMonthEndDate(prevMonthDate);
      const prevDates = getDateRange(prevStart, prevEnd);
      for (const ds of prevDates) {
        previousPeriodMinutes += activityByDate[ds] || 0;
      }
    }

    if (tab !== 'daily') {
      if (previousPeriodMinutes === 0 && totalMinutes === 0) {
        percentChange = null;
      } else if (previousPeriodMinutes === 0) {
        percentChange = 100;
      } else {
        percentChange = Math.round(((totalMinutes - previousPeriodMinutes) / previousPeriodMinutes) * 100);
      }
    }

    // Weekly-specific: most productive day
    let mostProductiveDay = '';
    if (tab === 'weekly') {
      let maxMin = 0;
      for (const ds of dateStrings) {
        const mins = activityByDate[ds] || 0;
        if (mins > maxMin) {
          maxMin = mins;
          const d = new Date(ds + 'T00:00:00');
          mostProductiveDay = d.toLocaleDateString('en-US', { weekday: 'long' });
        }
      }
      if (maxMin === 0) mostProductiveDay = '-';
    }

    // Monthly-specific stats
    let daysActive = 0;
    let daysTargetHit = 0;
    let bestDayMinutes = 0;
    let bestDayLabel = '-';
    const totalDaysInPeriod = dateStrings.length;

    if (tab === 'monthly') {
      for (const ds of dateStrings) {
        const mins = activityByDate[ds] || 0;
        if (mins > 0) daysActive++;
        if (mins >= targetHours * 60) daysTargetHit++;
        if (mins > bestDayMinutes) {
          bestDayMinutes = mins;
          const d = new Date(ds + 'T00:00:00');
          bestDayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }
    }

    // Also compute daysTargetHit for weekly tab
    if (tab === 'weekly') {
      for (const ds of dateStrings) {
        const mins = activityByDate[ds] || 0;
        if (mins >= targetHours * 60) daysTargetHit++;
      }
    }

    const consistencyPercent = totalDaysInPeriod > 0
      ? Math.round((daysActive / totalDaysInPeriod) * 100)
      : 0;

    // Build stats grid
    let statsGrid: StatItem[] = [];
    const totalHours = totalMinutes / 60;

    if (tab === 'daily') {
      statsGrid = [
        {
          label: 'Focus Time',
          value: formatMinutesShort(totalMinutes),
          icon: 'time-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Sessions',
          value: `${sessionCount}`,
          icon: 'layers-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Longest Session',
          value: formatMinutesShort(longestSessionMinutes),
          icon: 'trophy-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Screen Time Earned',
          value: formatMinutesShort(earnedScreenTimeSeconds / 60),
          icon: 'phone-portrait-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Avg Session',
          value: formatMinutesShort(avgSessionMinutes),
          icon: 'analytics-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Current Streak',
          value: `${currentStreak} day${currentStreak !== 1 ? 's' : ''}`,
          icon: 'flame-outline',
          iconFamily: 'Ionicons',
        },
      ];
    } else if (tab === 'weekly') {
      statsGrid = [
        {
          label: 'Total Sessions',
          value: `${sessionCount}`,
          icon: 'layers-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Avg Daily Focus',
          value: formatHoursDecimal(totalHours / 7),
          icon: 'time-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Most Productive',
          value: mostProductiveDay,
          icon: 'star-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Longest Session',
          value: formatMinutesShort(longestSessionMinutes),
          icon: 'trophy-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Days Target Hit',
          value: `${daysTargetHit}/7`,
          icon: 'checkmark-circle-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Screen Time Earned',
          value: formatMinutesShort(earnedScreenTimeSeconds / 60),
          icon: 'phone-portrait-outline',
          iconFamily: 'Ionicons',
        },
      ];
    } else {
      statsGrid = [
        {
          label: 'Total Sessions',
          value: `${sessionCount}`,
          icon: 'layers-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Avg Daily Hours',
          value: formatHoursDecimal(totalDaysInPeriod > 0 ? totalHours / totalDaysInPeriod : 0),
          icon: 'time-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Best Day',
          value: bestDayLabel,
          subtitle: bestDayMinutes > 0 ? formatMinutesShort(bestDayMinutes) : undefined,
          icon: 'star-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Days Active',
          value: `${daysActive}/${totalDaysInPeriod}`,
          icon: 'calendar-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Days Target Hit',
          value: `${daysTargetHit}/${totalDaysInPeriod}`,
          icon: 'checkmark-circle-outline',
          iconFamily: 'Ionicons',
        },
        {
          label: 'Consistency',
          value: `${consistencyPercent}%`,
          icon: 'trending-up-outline',
          iconFamily: 'Ionicons',
        },
      ];
    }

    // Badge progress (monthly tab)
    const badgeProgress: BadgeProgressItem[] = [];
    if (tab === 'monthly') {
      const earnedIds = new Set(earnedBadges.map((eb) => eb.badgeId));
      const categories: BadgeCategory[] = ['hours', 'grinds', 'streak'];

      for (const cat of categories) {
        const badges = BADGES_BY_CATEGORY[cat];
        const nextBadge = badges.find((b) => !earnedIds.has(b.id));
        if (!nextBadge) continue;

        let current = 0;
        switch (cat) {
          case 'hours':
            current = profileTotalHours;
            break;
          case 'grinds':
            current = profileTotalGrinds;
            break;
          case 'streak':
            current = currentStreak;
            break;
        }

        badgeProgress.push({
          category: cat,
          badge: nextBadge,
          current: Math.min(current, nextBadge.threshold),
          target: nextBadge.threshold,
          progress: Math.min(current / nextBadge.threshold, 1),
        });
      }
    }

    return {
      periodLabel,
      canGoForward,
      totalMinutes,
      totalHours,
      sessionCount,
      longestSessionMinutes,
      avgSessionMinutes,
      earnedScreenTimeSeconds,
      currentStreak,
      hourlyData,
      focusHours,
      targetHours,
      percentChange,
      previousPeriodMinutes,
      weekReferenceDate: tab === 'weekly' ? rangeStart : selectedDate,
      mostProductiveDay,
      daysActive,
      daysTargetHit,
      totalDaysInPeriod,
      consistencyPercent,
      bestDayLabel,
      bestDayMinutes,
      statsGrid,
      badgeProgress,
    };
  }, [
    tab,
    selectedDate,
    activityByDate,
    videos,
    currentStreak,
    earnedTimeToday,
    totalGrindSecondsToday,
    targetHours,
    today,
    earnedBadges,
    profileTotalHours,
    profileTotalGrinds,
  ]);
}
