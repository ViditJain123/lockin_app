import React, { useCallback, useState } from 'react';
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
import { AnalyticsTab, useAnalyticsData } from '../../hooks/useAnalyticsData';
import { useHeatmapStore } from '../../store/useHeatmapStore';
import { useProfileStore } from '../../store/useProfileStore';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { dailyActivity } = useProfileStore();
  const activityByDate = useHeatmapStore((s) => s.activityByDate);

  const [selectedTab, setSelectedTab] = useState<AnalyticsTab>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const data = useAnalyticsData(selectedTab, selectedDate);

  const handleTabChange = useCallback((tab: AnalyticsTab) => {
    setSelectedTab(tab);
    setSelectedDate(new Date()); // Reset to current period
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
    if (!data.canGoForward) return;
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
  }, [selectedTab, data.canGoForward]);

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
          label={data.periodLabel}
          canGoBack={true}
          canGoForward={data.canGoForward}
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
          <DailyContent data={data} dailyActivity={dailyActivity} />
        )}
        {selectedTab === 'weekly' && (
          <WeeklyContent
            data={data}
            dailyActivity={dailyActivity}
            activityByDate={activityByDate}
          />
        )}
        {selectedTab === 'monthly' && (
          <MonthlyContent
            data={data}
            dailyActivity={dailyActivity}
            activityByDate={activityByDate}
          />
        )}

        <ShareableWatermark />
      </ScrollView>
    </View>
  );
}

// ── Daily Tab ────────────────────────────────────────────────────────────────

function DailyContent({
  data,
  dailyActivity,
}: {
  data: ReturnType<typeof useAnalyticsData>;
  dailyActivity: any[];
}) {
  return (
    <>
      {/* Focus Ring */}
      <View style={styles.section}>
        <FocusRing
          currentHours={data.focusHours}
          targetHours={data.targetHours}
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <StatsGrid stats={data.statsGrid} columns={2} />
      </View>

      {/* Hourly Timeline */}
      <View style={styles.section}>
        <HourlyTimeline data={data.hourlyData} />
      </View>

      {/* Streak */}
      <View style={styles.section}>
        <StreakDisplay streak={data.currentStreak} variant="compact" />
      </View>
    </>
  );
}

// ── Weekly Tab ───────────────────────────────────────────────────────────────

function WeeklyContent({
  data,
  dailyActivity,
  activityByDate,
}: {
  data: ReturnType<typeof useAnalyticsData>;
  dailyActivity: any[];
  activityByDate: Record<string, number>;
}) {
  return (
    <>
      {/* Summary Card */}
      <View style={styles.section}>
        <SummaryCard
          title="Weekly Focus"
          hours={data.totalHours}
          percentChange={data.percentChange}
        />
      </View>

      {/* Weekly Bar Chart */}
      <View style={styles.section}>
        <WeeklyBarChart
          data={dailyActivity}
          referenceDate={data.weekReferenceDate}
          title="Weekly Activity"
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <StatsGrid stats={data.statsGrid} columns={2} />
      </View>

      {/* Heatmap */}
      <View style={styles.section}>
        <ActivityHeatmap data={dailyActivity} />
      </View>

      {/* Streak */}
      <View style={styles.section}>
        <StreakDisplay streak={data.currentStreak} variant="full" />
      </View>
    </>
  );
}

// ── Monthly Tab ──────────────────────────────────────────────────────────────

function MonthlyContent({
  data,
  dailyActivity,
  activityByDate,
}: {
  data: ReturnType<typeof useAnalyticsData>;
  dailyActivity: any[];
  activityByDate: Record<string, number>;
}) {
  return (
    <>
      {/* Summary Card */}
      <View style={styles.section}>
        <SummaryCard
          title="Monthly Focus"
          hours={data.totalHours}
          percentChange={data.percentChange}
        />
      </View>

      {/* Monthly Bar Chart */}
      <View style={styles.section}>
        <MonthlyBarChart
          referenceDate={data.weekReferenceDate}
          activityByDate={activityByDate}
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <StatsGrid stats={data.statsGrid} columns={2} />
      </View>

      {/* Heatmap */}
      <View style={styles.section}>
        <ActivityHeatmap data={dailyActivity} />
      </View>

      {/* Badge Progress */}
      {data.badgeProgress.length > 0 && (
        <View style={styles.section}>
          <BadgeProgress items={data.badgeProgress} />
        </View>
      )}
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
