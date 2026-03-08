import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActivityHeatmap from '../../components/ActivityHeatmap';
import FocusRing from '../../components/FocusRing';
import WeeklyBarChart from '../../components/WeeklyBarChart';
import AnalyticsPeriodSelector from '../../components/analytics/AnalyticsPeriodSelector';
import BadgeProgress from '../../components/analytics/BadgeProgress';
import HourlyTimeline from '../../components/analytics/HourlyTimeline';
import MonthlyBarChart from '../../components/analytics/MonthlyBarChart';
import PeriodNavigator from '../../components/analytics/PeriodNavigator';
import ShareableWatermark from '../../components/analytics/ShareableWatermark';
import StatsGrid from '../../components/analytics/StatsGrid';
import StreakDisplay from '../../components/analytics/StreakDisplay';
import SummaryCard from '../../components/analytics/SummaryCard';
import { Fonts } from '../../constants/Fonts';
import { useAuth } from '../../contexts/AuthContext';
import {
  formatDateRange,
  getLocalDateString,
  getWeekEndDate,
  getWeekStartDate,
} from '../../lib/dateUtils';
import {
  fetchDailySessions,
  fetchWeeklySessions,
  fetchYearlyActivity,
  type DailySessionRow,
} from '../../lib/tinybird';
import { useSessionStore, type LocalSession } from '../../store/useSessionStore';
import type { AnalyticsTab, BadgeProgressItem, HourlyData, StatItem } from '../../types/analytics';

// ── Helpers ─────────────────────────────────────────────────────────────────

function localSessionToRow(s: LocalSession): DailySessionRow {
  // Derive time_started / time_ended from created_at + duration if not stored
  const ended = s.time_ended || s.created_at;
  const startedDate = s.time_started
    ? s.time_started
    : new Date(
        new Date(ended).getTime() -
          (s.total_locked_in_seconds + s.total_distracted_seconds) * 1000,
      ).toISOString();

  return {
    session_id: s.session_id,
    date: s.date,
    time_started: startedDate,
    time_ended: ended,
    distraction_count: s.distraction_count,
    total_locked_in_seconds: s.total_locked_in_seconds,
    total_distracted_seconds: s.total_distracted_seconds,
  };
}

function mergeSessions(
  tinybird: DailySessionRow[],
  local: LocalSession[],
): DailySessionRow[] {
  const seen = new Set(tinybird.map((r) => r.session_id));
  const merged = [...tinybird];
  for (const s of local) {
    if (!seen.has(s.session_id)) {
      merged.push(localSessionToRow(s));
    }
  }
  return merged;
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) return `${Math.round(totalMinutes)}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function buildStats(sessions: DailySessionRow[]): StatItem[] {
  const count = sessions.length;
  const totalSec = sessions.reduce((a, s) => a + s.total_locked_in_seconds, 0);
  const totalMin = totalSec / 60;
  const avgMin = count > 0 ? totalMin / count : 0;
  const longestMin =
    count > 0
      ? Math.max(...sessions.map((s) => s.total_locked_in_seconds)) / 60
      : 0;
  const earnedMin = totalMin * 0.25; // 4:1 ratio

  return [
    { label: 'Sessions', value: String(count), icon: 'play-circle-outline' },
    { label: 'Avg Session', value: formatMinutes(avgMin), icon: 'time-outline' },
    { label: 'Longest', value: formatMinutes(longestMin), icon: 'trophy-outline' },
    { label: 'Earned Time', value: formatMinutes(earnedMin), icon: 'gift-outline' },
  ];
}

function buildHourlyData(sessions: DailySessionRow[]): HourlyData[] {
  const hourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, minutes: 0 }));
  for (const s of sessions) {
    if (!s.time_started) continue;
    const startHour = new Date(s.time_started).getHours();
    hourly[startHour].minutes += s.total_locked_in_seconds / 60;
  }
  return hourly;
}

const EMPTY_DAILY_ACTIVITY: { date: string; totalMinutes: number }[] = [];
const EMPTY_ACTIVITY_BY_DATE: Record<string, number> = {};
const EMPTY_STATS: StatItem[] = [
  { label: 'Sessions', value: '0', icon: 'play-circle-outline' },
  { label: 'Avg Session', value: '0m', icon: 'time-outline' },
  { label: 'Longest', value: '0m', icon: 'trophy-outline' },
  { label: 'Earned Time', value: '0m', icon: 'gift-outline' },
];
const EMPTY_HOURLY_DATA: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  minutes: 0,
}));
const EMPTY_BADGE_PROGRESS: BadgeProgressItem[] = [];

function getPeriodLabel(tab: AnalyticsTab, date: Date): string {
  if (tab === 'daily') {
    const today = getLocalDateString();
    const selected = getLocalDateString(date);
    if (selected === today) return 'Today';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
  if (tab === 'weekly') {
    const start = getWeekStartDate(date);
    const end = getWeekEndDate(date);
    return formatDateRange(start, end);
  }
  // monthly
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getCanGoForward(tab: AnalyticsTab, date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (tab === 'daily') return d < today;
  if (tab === 'weekly') {
    const weekEnd = getWeekEndDate(d);
    return weekEnd < today;
  }
  // monthly
  return d.getMonth() < today.getMonth() || d.getFullYear() < today.getFullYear();
}

// ── Data Hooks ──────────────────────────────────────────────────────────────

function useDailyData(userId: string | undefined, dateString: string, refreshKey: number) {
  const [tbSessions, setTbSessions] = useState<DailySessionRow[]>([]);

  // IMPORTANT: Use a stable selector (s => s.sessions) then filter with useMemo
  // to avoid infinite render loops from Zustand + React 19's useSyncExternalStore
  const allSessions = useSessionStore((s) => s.sessions);
  const localSessions = useMemo(
    () => allSessions.filter((sess) => sess.date === dateString),
    [allSessions, dateString],
  );

  useEffect(() => {
    if (!userId) return;
    fetchDailySessions(userId, dateString)
      .then(setTbSessions)
      .catch(() => setTbSessions([]));
  }, [userId, dateString, refreshKey]);

  return useMemo(() => mergeSessions(tbSessions, localSessions), [tbSessions, localSessions]);
}

function useWeeklyData(
  userId: string | undefined,
  startDate: string,
  endDate: string,
  refreshKey: number,
) {
  const [tbSessions, setTbSessions] = useState<DailySessionRow[]>([]);

  const allSessions = useSessionStore((s) => s.sessions);
  const localSessions = useMemo(
    () => allSessions.filter((sess) => sess.date >= startDate && sess.date <= endDate),
    [allSessions, startDate, endDate],
  );

  useEffect(() => {
    if (!userId) return;
    fetchWeeklySessions(userId, startDate, endDate)
      .then(setTbSessions)
      .catch(() => setTbSessions([]));
  }, [userId, startDate, endDate, refreshKey]);

  return useMemo(() => mergeSessions(tbSessions, localSessions), [tbSessions, localSessions]);
}

function useYearlyActivity(userId: string | undefined, refreshKey: number) {
  const [activityByDate, setActivityByDate] = useState<Record<string, number>>({});

  const allSessions = useSessionStore((s) => s.sessions);

  useEffect(() => {
    const localByDate: Record<string, number> = {};
    for (const s of allSessions) {
      localByDate[s.date] = (localByDate[s.date] || 0) + s.total_locked_in_seconds / 60;
    }

    if (!userId) {
      setActivityByDate(localByDate);
      return;
    }

    fetchYearlyActivity(userId)
      .then((rows) => {
        const merged: Record<string, number> = { ...localByDate };
        for (const r of rows) {
          merged[r.date] = Math.max(merged[r.date] || 0, r.total_minutes);
        }
        setActivityByDate(merged);
      })
      .catch(() => setActivityByDate(localByDate));
  }, [userId, allSessions, refreshKey]);

  return activityByDate;
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<AnalyticsTab>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh when tab gains focus (skip initial mount)
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      setRefreshKey((k) => k + 1);
    }, []),
  );

  const dateString = useMemo(() => getLocalDateString(selectedDate), [selectedDate]);
  const weekStart = useMemo(() => getWeekStartDate(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => getWeekEndDate(selectedDate), [selectedDate]);
  const weekStartStr = useMemo(() => getLocalDateString(weekStart), [weekStart]);
  const weekEndStr = useMemo(() => getLocalDateString(weekEnd), [weekEnd]);

  // Fetch data
  const dailySessions = useDailyData(user?.id, dateString, refreshKey);
  const weeklySessions = useWeeklyData(user?.id, weekStartStr, weekEndStr, refreshKey);
  const yearlyActivity = useYearlyActivity(user?.id, refreshKey);

  // Derived daily data
  const dailyStats = useMemo(() => buildStats(dailySessions), [dailySessions]);
  const dailyHourly = useMemo(() => buildHourlyData(dailySessions), [dailySessions]);
  const dailyTotalHours = useMemo(
    () => dailySessions.reduce((a, s) => a + s.total_locked_in_seconds, 0) / 3600,
    [dailySessions],
  );

  // Derived weekly data
  const weeklyStats = useMemo(() => buildStats(weeklySessions), [weeklySessions]);
  const weeklyTotalHours = useMemo(
    () => weeklySessions.reduce((a, s) => a + s.total_locked_in_seconds, 0) / 3600,
    [weeklySessions],
  );
  const weeklyDailyActivity = useMemo(() => {
    const byDate: Record<string, number> = {};
    for (const s of weeklySessions) {
      byDate[s.date] = (byDate[s.date] || 0) + s.total_locked_in_seconds / 60;
    }
    return Object.entries(byDate).map(([date, totalMinutes]) => ({ date, totalMinutes }));
  }, [weeklySessions]);

  // Monthly data derived from yearly activity
  const monthlyActivityByDate = useMemo(() => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const filtered: Record<string, number> = {};
    for (const [date, minutes] of Object.entries(yearlyActivity)) {
      const d = new Date(date + 'T00:00:00');
      if (d.getMonth() === month && d.getFullYear() === year) {
        filtered[date] = minutes;
      }
    }
    return filtered;
  }, [yearlyActivity, selectedDate]);
  const monthlyTotalHours = useMemo(
    () => Object.values(monthlyActivityByDate).reduce((a, m) => a + m, 0) / 60,
    [monthlyActivityByDate],
  );
  const monthlyDailyActivity = useMemo(
    () =>
      Object.entries(monthlyActivityByDate).map(([date, totalMinutes]) => ({
        date,
        totalMinutes,
      })),
    [monthlyActivityByDate],
  );

  // Streak from local sessions
  const streak = useMemo(() => {
    const allSessions = useSessionStore.getState().sessions;
    const datesWithSessions = new Set(allSessions.map((s) => s.date));
    let count = 0;
    const d = new Date();
    // Check today and consecutive past days
    while (true) {
      const ds = getLocalDateString(d);
      if (datesWithSessions.has(ds)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else if (count === 0) {
        // Today might not have a session yet, check yesterday
        d.setDate(d.getDate() - 1);
        const yd = getLocalDateString(d);
        if (datesWithSessions.has(yd)) {
          count++;
          d.setDate(d.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return count;
  }, [dailySessions]); // re-check when sessions change

  const periodLabel = useMemo(
    () => getPeriodLabel(selectedTab, selectedDate),
    [selectedTab, selectedDate],
  );
  const canGoForward = useMemo(
    () => getCanGoForward(selectedTab, selectedDate),
    [selectedTab, selectedDate],
  );

  const handleTabChange = useCallback((tab: AnalyticsTab) => {
    setSelectedTab(tab);
    setSelectedDate(new Date());
  }, []);

  const handleBack = useCallback(() => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (selectedTab === 'daily') {
        next.setDate(next.getDate() - 1);
      } else if (selectedTab === 'weekly') {
        next.setDate(next.getDate() - 7);
      } else {
        next.setMonth(next.getMonth() - 1);
      }
      return next;
    });
  }, [selectedTab]);

  const handleForward = useCallback(() => {
    if (!canGoForward) return;
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (selectedTab === 'daily') {
        next.setDate(next.getDate() + 1);
      } else if (selectedTab === 'weekly') {
        next.setDate(next.getDate() + 7);
      } else {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    });
  }, [selectedTab, canGoForward]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sticky Header */}
      <View style={styles.header}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Analytics</Text>
          <View style={styles.avatarContainer}>
            {user?.user_metadata?.avatar_url ? (
              <Image
                source={{ uri: user.user_metadata.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>
                  {user?.user_metadata?.full_name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Period navigator */}
        <PeriodNavigator
          label={periodLabel}
          canGoBack={true}
          canGoForward={canGoForward}
          onBack={handleBack}
          onForward={handleForward}
        />

        {/* Tab selector */}
        <View style={styles.tabContainer}>
          <AnalyticsPeriodSelector
            selected={selectedTab}
            onSelect={handleTabChange}
          />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedTab === 'daily' && (
          <DailyContent
            totalHours={dailyTotalHours}
            stats={dailyStats}
            hourlyData={dailyHourly}
            streak={streak}
          />
        )}
        {selectedTab === 'weekly' && (
          <WeeklyContent
            weekReferenceDate={weekStart}
            totalHours={weeklyTotalHours}
            stats={weeklyStats}
            dailyActivity={weeklyDailyActivity}
            streak={streak}
          />
        )}
        {selectedTab === 'monthly' && (
          <MonthlyContent
            referenceDate={selectedDate}
            totalHours={monthlyTotalHours}
            activityByDate={monthlyActivityByDate}
            dailyActivity={monthlyDailyActivity}
          />
        )}

        <ShareableWatermark />
      </ScrollView>
    </View>
  );
}

// ── Daily Tab ────────────────────────────────────────────────────────────────

function DailyContent({
  totalHours,
  stats,
  hourlyData,
  streak,
}: {
  totalHours: number;
  stats: StatItem[];
  hourlyData: HourlyData[];
  streak: number;
}) {
  return (
    <>
      {/* Focus Ring */}
      <View style={styles.section}>
        <FocusRing currentHours={totalHours} targetHours={4} />
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <StatsGrid stats={stats} columns={2} />
      </View>

      {/* Hourly Timeline */}
      <View style={styles.section}>
        <HourlyTimeline data={hourlyData} />
      </View>

      {/* Streak */}
      <View style={styles.section}>
        <StreakDisplay streak={streak} variant="compact" />
      </View>
    </>
  );
}

// ── Weekly Tab ───────────────────────────────────────────────────────────────

function WeeklyContent({
  weekReferenceDate,
  totalHours,
  stats,
  dailyActivity,
  streak,
}: {
  weekReferenceDate: Date;
  totalHours: number;
  stats: StatItem[];
  dailyActivity: { date: string; totalMinutes: number }[];
  streak: number;
}) {
  return (
    <>
      {/* Summary Card */}
      <View style={styles.section}>
        <SummaryCard title="Weekly Focus" hours={totalHours} percentChange={null} />
      </View>

      {/* Weekly Bar Chart */}
      <View style={styles.section}>
        <WeeklyBarChart
          data={dailyActivity}
          referenceDate={weekReferenceDate}
          title="Weekly Activity"
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <StatsGrid stats={stats} columns={2} />
      </View>

      {/* Heatmap */}
      <View style={styles.section}>
        <ActivityHeatmap data={dailyActivity} />
      </View>

      {/* Streak */}
      <View style={styles.section}>
        <StreakDisplay streak={streak} variant="full" />
      </View>
    </>
  );
}

// ── Monthly Tab ──────────────────────────────────────────────────────────────

function MonthlyContent({
  referenceDate,
  totalHours,
  activityByDate,
  dailyActivity,
}: {
  referenceDate: Date;
  totalHours: number;
  activityByDate: Record<string, number>;
  dailyActivity: { date: string; totalMinutes: number }[];
}) {
  return (
    <>
      {/* Summary Card */}
      <View style={styles.section}>
        <SummaryCard title="Monthly Focus" hours={totalHours} percentChange={null} />
      </View>

      {/* Monthly Bar Chart */}
      <View style={styles.section}>
        <MonthlyBarChart
          referenceDate={referenceDate}
          activityByDate={activityByDate}
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <StatsGrid stats={EMPTY_STATS} columns={2} />
      </View>

      {/* Heatmap */}
      <View style={styles.section}>
        <ActivityHeatmap data={dailyActivity} />
      </View>

      {/* Badge Progress */}
      <BadgeProgress items={EMPTY_BADGE_PROGRESS} />
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#000000',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  titleText: {
    fontSize: 34,
    fontFamily: Fonts.bold,
    color: 'white',
  },
  avatarContainer: {},
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 59, 92, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#FF3B5C',
  },
  tabContainer: {
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  section: {
    marginTop: 16,
  },
});
