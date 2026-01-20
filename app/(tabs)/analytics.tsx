import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActivityHeatmap from '../../components/ActivityHeatmap';
import FocusRing from '../../components/FocusRing';
import WeeklyBarChart from '../../components/WeeklyBarChart';
import { Fonts } from '../../constants/Fonts';
import { useAuth } from '../../contexts/AuthContext';
import { getLocalDateString } from '../../lib/dateUtils';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useProfileStore } from '../../store/useProfileStore';

const formatSummaryDate = (): string => {
  const date = new Date();
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday}, ${day} ${month}`;
};

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { dailyActivity } = useProfileStore();
  const { quizAnswers } = useOnboardingStore();

  // Get today's activity in hours
  const today = getLocalDateString();
  const todayActivity = dailyActivity.find(a => a.date === today);
  const todayHours = todayActivity ? todayActivity.totalMinutes / 60 : 0;

  // Get target hours from onboarding (default to 4 if not set)
  const targetHours = quizAnswers.targetHours || 4;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Left side: Summary + Date */}
          <View style={styles.textContainer}>
            <Text style={styles.summaryText}>Analytics</Text>
            <Text style={styles.dateText}>{formatSummaryDate()}</Text>
          </View>

          {/* Right side: Avatar */}
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

        {/* Activity Heatmap */}
        <View style={styles.heatmapContainer}>
          <ActivityHeatmap data={dailyActivity} />
        </View>

        {/* Focus Ring */}
        <View style={styles.focusRingContainer}>
          <FocusRing currentHours={todayHours} targetHours={targetHours} />
        </View>

        {/* Weekly Bar Chart */}
        <View style={styles.weeklyChartContainer}>
          <WeeklyBarChart data={dailyActivity} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 12,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
  },
  textContainer: {
    flex: 1,
  },
  summaryText: {
    fontSize: 34,
    fontFamily: Fonts.bold,
    color: 'white',
  },
  dateText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
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
  weeklyChartContainer: {
    marginTop: 20,
  },
  heatmapContainer: {
    marginTop: 16,
  },
  focusRingContainer: {
    marginTop: 16,
  },
});
