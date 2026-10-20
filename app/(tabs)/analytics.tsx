import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import HourlyTimeline from '@/components/analytics/HourlyTimeline';
import MonthlyBarChart from '@/components/analytics/MonthlyBarChart';
import WeeklyBarChart from '@/components/WeeklyBarChart';
import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatDateRange,
  getLocalDateString,
  getWeekEndDate,
  getWeekStartDate,
} from '@/lib/dateUtils';
import {
  fetchDailySessions,
  fetchWeeklySessions,
  fetchYearlyActivity,
  type DailySessionRow,
} from '@/lib/tinybird';
import { useSessionStore, type LocalSession } from '@/store/useSessionStore';
import type { AnalyticsTab } from '@/types/analytics';

// ─── Helpers ───────────────────────────────────────────────────────────────

function localSessionToRow(s: LocalSession): DailySessionRow {
  const ended = s.time_ended || s.created_at;
  const startedDate = s.time_started
    ? s.time_started
    : new Date(new Date(ended).getTime() - s.total_locked_in_seconds * 1000).toISOString();
  return {
    session_id: s.session_id,
    date: s.date,
    time_started: startedDate,
    time_ended: ended,
    total_locked_in_seconds: s.total_locked_in_seconds,
  };
}

function mergeSessions(
  tinybird: DailySessionRow[],
  local: LocalSession[],
): DailySessionRow[] {
  const seen = new Set(tinybird.map((r) => r.session_id));
  const merged = [...tinybird];
  for (const s of local) {
    if (!seen.has(s.session_id)) merged.push(localSessionToRow(s));
  }
  return merged;
}

function formatHoursColon(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0:00';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function formatMinutesShort(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0m';
  if (totalMinutes < 60) return `${Math.round(totalMinutes)}m`;
  return formatHoursColon(totalMinutes / 60);
}

function buildHourlyData(sessions: DailySessionRow[]) {
  const hourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, minutes: 0 }));
  for (const s of sessions) {
    if (!s.time_started) continue;
    const startHour = new Date(s.time_started).getHours();
    hourly[startHour].minutes += s.total_locked_in_seconds / 60;
  }
  return hourly;
}

function getPeriodLabel(tab: AnalyticsTab, date: Date): string {
  if (tab === 'daily') {
    const today = getLocalDateString();
    const selected = getLocalDateString(date);
    if (selected === today) return 'TODAY';
    return date
      .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      .toUpperCase();
  }
  if (tab === 'weekly') {
    return formatDateRange(getWeekStartDate(date), getWeekEndDate(date)).toUpperCase();
  }
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
}

function getCanGoForward(tab: AnalyticsTab, date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (tab === 'daily') return d < today;
  if (tab === 'weekly') return getWeekEndDate(d) < today;
  return d.getMonth() < today.getMonth() || d.getFullYear() < today.getFullYear();
}

// ─── Data hooks ────────────────────────────────────────────────────────────

function useDailyData(userId: string | undefined, dateString: string, refreshKey: number) {
  const [tbSessions, setTbSessions] = useState<DailySessionRow[]>([]);
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

// ─── Primitives ────────────────────────────────────────────────────────────

type Kpi = { label: string; value: string; unit?: string };

function KpiStrip({ kpis }: { kpis: Kpi[] }) {
  return (
    <View style={strip.row}>
      {kpis.map((k) => (
        <View key={k.label} style={strip.cell}>
          <Text style={strip.label}>{k.label}</Text>
          <Text style={strip.value}>{k.value}</Text>
          {k.unit ? <Text style={strip.unit}>{k.unit}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const strip = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  cell: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
  },
  label: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 24,
    color: LC.text,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  unit: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    color: LC.textDim,
    letterSpacing: 1,
    marginTop: 1,
    textTransform: 'uppercase',
  },
});

function LCCard({
  title,
  right,
  children,
  style,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[card.wrap, style]}>
      {(title || right) && (
        <View style={card.header}>
          {title ? <Text style={card.eyebrow}>{title}</Text> : <View />}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
});

// Inline 16-week heatmap: 16 cols × 7 rows, cells colored by activity.
function LCHeatmap({
  activityByDate,
  weeks = 16,
}: {
  activityByDate: Record<string, number>;
  weeks?: number;
}) {
  const days = weeks * 7;
  // Build array of dates ending today, going back `days` days.
  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const out: { key: string; intensity: number }[] = [];
    // Start so that bottom-right-ish cell is today — iterate weeks left→right, days top→bottom.
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const offset = (weeks - 1 - w) * 7 + (6 - d);
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const key = getLocalDateString(date);
        const mins = activityByDate[key] || 0;
        // Intensity: 0 for no activity; 0.15..1 for increasing minutes (cap ~3h).
        const intensity = mins <= 0 ? 0 : Math.max(0.15, Math.min(1, mins / 180));
        out.push({ key, intensity });
      }
    }
    return out;
  }, [activityByDate, weeks]);

  // Active days count
  const activeDays = cells.filter((c) => c.intensity > 0).length;

  const legendLevels = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View>
      <View style={heat.headerRow}>
        <Text style={heat.eyebrow}>{weeks}-WEEK HEATMAP</Text>
        <Text style={heat.subMono}>{activeDays} ACTIVE</Text>
      </View>
      <View style={heat.grid}>
        {Array.from({ length: weeks }).map((_, w) => (
          <View key={w} style={heat.col}>
            {Array.from({ length: 7 }).map((_, d) => {
              const cell = cells[w * 7 + d];
              const bg =
                cell.intensity <= 0
                  ? 'rgba(255,255,255,0.04)'
                  : `rgba(255,102,0,${0.15 + cell.intensity * 0.8})`;
              return <View key={d} style={[heat.cell, { backgroundColor: bg }]} />;
            })}
          </View>
        ))}
      </View>
      <View style={heat.legendRow}>
        <Text style={heat.subMono}>LESS</Text>
        <View style={heat.legendSwatches}>
          {legendLevels.map((v) => (
            <View
              key={v}
              style={[
                heat.legendSwatch,
                {
                  backgroundColor:
                    v <= 0 ? 'rgba(255,255,255,0.04)' : `rgba(255,102,0,${0.15 + v * 0.8})`,
                },
              ]}
            />
          ))}
        </View>
        <Text style={heat.subMono}>MORE</Text>
      </View>
    </View>
  );
}

const heat = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  subMono: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    color: LC.textDim,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    gap: 3,
  },
  col: {
    flex: 1,
    gap: 3,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  legendSwatches: { flexDirection: 'row', gap: 3 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
});

function ArrowIcon({ direction, muted }: { direction: 'left' | 'right'; muted?: boolean }) {
  const color = muted ? LC.textMute : LC.text;
  const d = direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6';
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

const TAB_CONFIG: { id: AnalyticsTab; label: string }[] = [
  { id: 'daily', label: 'DAY' },
  { id: 'weekly', label: 'WEEK' },
  { id: 'monthly', label: 'MONTH' },
];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<AnalyticsTab>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

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

  const dailySessions = useDailyData(user?.id, dateString, refreshKey);
  const weeklySessions = useWeeklyData(user?.id, weekStartStr, weekEndStr, refreshKey);
  const yearlyActivity = useYearlyActivity(user?.id, refreshKey);

  // ─── Derived per tab ────────────────────────────────────────────────────
  const dailyHourly = useMemo(() => buildHourlyData(dailySessions), [dailySessions]);
  const dailyTotalMin = useMemo(
    () => dailySessions.reduce((a, s) => a + s.total_locked_in_seconds, 0) / 60,
    [dailySessions],
  );
  const dailyLongestMin = useMemo(
    () =>
      dailySessions.length
        ? Math.max(...dailySessions.map((s) => s.total_locked_in_seconds)) / 60
        : 0,
    [dailySessions],
  );

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

  const monthlyActivityByDate = useMemo(() => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const filtered: Record<string, number> = {};
    for (const [date, minutes] of Object.entries(yearlyActivity)) {
      const d = new Date(date + 'T00:00:00');
      if (d.getMonth() === month && d.getFullYear() === year) filtered[date] = minutes;
    }
    return filtered;
  }, [yearlyActivity, selectedDate]);
  const monthlyTotalHours = useMemo(
    () => Object.values(monthlyActivityByDate).reduce((a, m) => a + m, 0) / 60,
    [monthlyActivityByDate],
  );
  const monthlyActiveDays = useMemo(
    () => Object.values(monthlyActivityByDate).filter((m) => m > 0).length,
    [monthlyActivityByDate],
  );
  const monthlyAvgHoursPerActiveDay = useMemo(() => {
    return monthlyActiveDays > 0 ? monthlyTotalHours / monthlyActiveDays : 0;
  }, [monthlyTotalHours, monthlyActiveDays]);

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
      if (selectedTab === 'daily') next.setDate(next.getDate() - 1);
      else if (selectedTab === 'weekly') next.setDate(next.getDate() - 7);
      else next.setMonth(next.getMonth() - 1);
      return next;
    });
  }, [selectedTab]);

  const handleForward = useCallback(() => {
    if (!canGoForward) return;
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (selectedTab === 'daily') next.setDate(next.getDate() + 1);
      else if (selectedTab === 'weekly') next.setDate(next.getDate() + 7);
      else next.setMonth(next.getMonth() + 1);
      return next;
    });
  }, [selectedTab, canGoForward]);

  // ─── KPIs per tab ───────────────────────────────────────────────────────
  const kpis: Kpi[] = useMemo(() => {
    if (selectedTab === 'daily') {
      return [
        { label: 'TOTAL', value: formatMinutesShort(dailyTotalMin) },
        { label: 'SESSIONS', value: String(dailySessions.length) },
        { label: 'LONGEST', value: formatMinutesShort(dailyLongestMin) },
      ];
    }
    if (selectedTab === 'weekly') {
      return [
        { label: 'TOTAL', value: formatHoursColon(weeklyTotalHours), unit: 'HRS' },
        { label: 'AVG/DAY', value: formatHoursColon(weeklyTotalHours / 7), unit: 'HRS' },
        { label: 'SESSIONS', value: String(weeklySessions.length) },
      ];
    }
    return [
      { label: 'TOTAL', value: formatHoursColon(monthlyTotalHours), unit: 'HRS' },
      {
        label: 'AVG/DAY',
        value: formatHoursColon(monthlyAvgHoursPerActiveDay),
        unit: 'HRS',
      },
      { label: 'ACTIVE', value: String(monthlyActiveDays), unit: 'DAYS' },
    ];
  }, [
    selectedTab,
    dailyTotalMin,
    dailySessions.length,
    dailyLongestMin,
    weeklyTotalHours,
    weeklySessions.length,
    monthlyTotalHours,
    monthlyActiveDays,
    monthlyAvgHoursPerActiveDay,
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Sticky header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>PROGRESS</Text>
        <Text style={styles.title}>THE TAPE.</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Range tabs */}
        <View style={styles.tabsRow}>
          {TAB_CONFIG.map((t) => {
            const active = selectedTab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => handleTabChange(t.id)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                accessibilityRole="button"
                accessibilityLabel={t.label}
                accessibilityState={active ? { selected: true } : undefined}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Period navigator */}
        <View style={styles.periodRow}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.periodArrow, pressed && styles.pressed]}
            hitSlop={10}
            accessibilityLabel="Previous period"
          >
            <ArrowIcon direction="left" />
          </Pressable>
          <Text style={styles.periodLabel} numberOfLines={1}>
            {periodLabel}
          </Text>
          <Pressable
            onPress={handleForward}
            disabled={!canGoForward}
            style={({ pressed }) => [styles.periodArrow, pressed && styles.pressed]}
            hitSlop={10}
            accessibilityLabel="Next period"
          >
            <ArrowIcon direction="right" muted={!canGoForward} />
          </Pressable>
        </View>

        {/* KPI strip */}
        <KpiStrip kpis={kpis} />

        {/* Tab content */}
        {selectedTab === 'daily' && (
          <>
            <LCCard title="HOURLY BREAKDOWN" style={styles.sectionGap}>
              <HourlyTimeline data={dailyHourly} />
            </LCCard>
          </>
        )}

        {selectedTab === 'weekly' && (
          <>
            <LCCard
              title="HOURS LOCKED · THIS WEEK"
              right={<Text style={styles.cardAccent}>{formatHoursColon(weeklyTotalHours)}</Text>}
              style={styles.sectionGap}
            >
              <WeeklyBarChart
                data={weeklyDailyActivity}
                referenceDate={weekStart}
              />
            </LCCard>

            <LCCard style={styles.sectionGap}>
              <LCHeatmap activityByDate={yearlyActivity} weeks={16} />
            </LCCard>
          </>
        )}

        {selectedTab === 'monthly' && (
          <>
            <LCCard
              title="HOURS LOCKED · THIS MONTH"
              right={<Text style={styles.cardAccent}>{formatHoursColon(monthlyTotalHours)}</Text>}
              style={styles.sectionGap}
            >
              <MonthlyBarChart referenceDate={selectedDate} activityByDate={monthlyActivityByDate} />
            </LCCard>

            <LCCard style={styles.sectionGap}>
              <LCHeatmap activityByDate={yearlyActivity} weeks={16} />
            </LCCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LC.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  eyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 42,
    lineHeight: 40,
    color: LC.text,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  // Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: LC.bgCard,
    borderColor: LC.borderStrong,
  },
  tabText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: LC.text,
    fontFamily: Fonts.monoSemiBold,
  },
  // Period nav
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 14,
  },
  periodArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  periodLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: LC.textDim,
    textTransform: 'uppercase',
    minWidth: 140,
    textAlign: 'center',
  },
  // Cards
  sectionGap: {
    marginTop: 14,
  },
  cardAccent: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 22,
    color: LC.text,
    letterSpacing: 0.5,
  },
});
