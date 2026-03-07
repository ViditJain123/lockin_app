import React, { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import type { AnalyticsTab, BadgeProgressItem, HourlyData, StatItem } from '../../types/analytics';

// ── Stub data (replace with real data hooks later) ──────────────────────────

const EMPTY_DAILY_ACTIVITY: { date: string; totalMinutes: number }[] = [];
const EMPTY_ACTIVITY_BY_DATE: Record<string, number> = {};
const EMPTY_HOURLY_DATA: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  minutes: 0,
}));
const EMPTY_STATS: StatItem[] = [
  { label: 'Sessions', value: '0', icon: 'play-circle-outline' },
  { label: 'Avg Session', value: '0m', icon: 'time-outline' },
  { label: 'Longest', value: '0m', icon: 'trophy-outline' },
  { label: 'Earned Time', value: '0m', icon: 'gift-outline' },
];
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

// ── Screen ──────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<AnalyticsTab>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const periodLabel = useMemo(
    () => getPeriodLabel(selectedTab, selectedDate),
    [selectedTab, selectedDate],
  );
  const canGoForward = useMemo(
    () => getCanGoForward(selectedTab, selectedDate),
    [selectedTab, selectedDate],
  );

  const weekReferenceDate = useMemo(
    () => getWeekStartDate(selectedDate),
    [selectedDate],
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
        {selectedTab === 'daily' && <DailyContent />}
        {selectedTab === 'weekly' && (
          <WeeklyContent weekReferenceDate={weekReferenceDate} />
        )}
        {selectedTab === 'monthly' && (
          <MonthlyContent referenceDate={selectedDate} />
        )}

        <ShareableWatermark />
      </ScrollView>
    </View>
  );
}

// ── Daily Tab ────────────────────────────────────────────────────────────────

function DailyContent() {
  return (
    <>
      {/* Focus Ring */}
      <View style={styles.section}>
        <FocusRing currentHours={0} targetHours={4} />
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <StatsGrid stats={EMPTY_STATS} columns={2} />
      </View>

      {/* Hourly Timeline */}
      <View style={styles.section}>
        <HourlyTimeline data={EMPTY_HOURLY_DATA} />
      </View>

      {/* Streak */}
      <View style={styles.section}>
        <StreakDisplay streak={0} variant="compact" />
      </View>
    </>
  );
}

// ── Weekly Tab ───────────────────────────────────────────────────────────────

function WeeklyContent({ weekReferenceDate }: { weekReferenceDate: Date }) {
  return (
    <>
      {/* Summary Card */}
      <View style={styles.section}>
        <SummaryCard title="Weekly Focus" hours={0} percentChange={null} />
      </View>

      {/* Weekly Bar Chart */}
      <View style={styles.section}>
        <WeeklyBarChart
          data={EMPTY_DAILY_ACTIVITY}
          referenceDate={weekReferenceDate}
          title="Weekly Activity"
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <StatsGrid stats={EMPTY_STATS} columns={2} />
      </View>

      {/* Heatmap */}
      <View style={styles.section}>
        <ActivityHeatmap data={EMPTY_DAILY_ACTIVITY} />
      </View>

      {/* Streak */}
      <View style={styles.section}>
        <StreakDisplay streak={0} variant="full" />
      </View>
    </>
  );
}

// ── Monthly Tab ──────────────────────────────────────────────────────────────

function MonthlyContent({ referenceDate }: { referenceDate: Date }) {
  return (
    <>
      {/* Summary Card */}
      <View style={styles.section}>
        <SummaryCard title="Monthly Focus" hours={0} percentChange={null} />
      </View>

      {/* Monthly Bar Chart */}
      <View style={styles.section}>
        <MonthlyBarChart
          referenceDate={referenceDate}
          activityByDate={EMPTY_ACTIVITY_BY_DATE}
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <StatsGrid stats={EMPTY_STATS} columns={2} />
      </View>

      {/* Heatmap */}
      <View style={styles.section}>
        <ActivityHeatmap data={EMPTY_DAILY_ACTIVITY} />
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
