import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface DailyActivity {
  date: string;
  totalMinutes: number;
}

interface ActivityHeatmapProps {
  data: DailyActivity[];
  months?: number;
}

const CELL_SIZE = 11;
const CELL_GAP = 3;
const DAY_LABEL_WIDTH = 28;

const BRAND_PINK = '#FF3B5C';

// Color levels for the heatmap (from no activity to high activity)
const COLORS = {
  empty: '#1a1a1a',
  level1: 'rgba(255, 59, 92, 0.2)',
  level2: 'rgba(255, 59, 92, 0.4)',
  level3: 'rgba(255, 59, 92, 0.6)',
  level4: 'rgba(255, 59, 92, 0.85)',
  level5: BRAND_PINK,
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export default function ActivityHeatmap({ data, months = 6 }: ActivityHeatmapProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to the end (current date) when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Build a map of date -> totalMinutes for quick lookup
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((item) => {
      map.set(item.date, item.totalMinutes);
    });
    return map;
  }, [data]);

  // Calculate intensity thresholds based on user's data
  const thresholds = useMemo(() => {
    const values = data.map((d) => d.totalMinutes).filter((v) => v > 0);
    if (values.length === 0) {
      return { p25: 15, p50: 30, p75: 60, p90: 120 };
    }
    values.sort((a, b) => a - b);
    const percentile = (p: number) => values[Math.floor((values.length - 1) * p)] || 0;
    return {
      p25: Math.max(percentile(0.25), 5),
      p50: Math.max(percentile(0.5), 15),
      p75: Math.max(percentile(0.75), 30),
      p90: Math.max(percentile(0.9), 60),
    };
  }, [data]);

  // Get color based on activity level
  const getColor = (minutes: number): string => {
    if (minutes <= 0) return COLORS.empty; // No activity or future days
    if (minutes < thresholds.p25) return COLORS.level1;
    if (minutes < thresholds.p50) return COLORS.level2;
    if (minutes < thresholds.p75) return COLORS.level3;
    if (minutes < thresholds.p90) return COLORS.level4;
    return COLORS.level5;
  };

  // Generate the grid data
  const gridData = useMemo(() => {
    const weeks: { date: Date; dateStr: string; minutes: number }[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from X months ago, aligned to the start of that week
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);
    // Go to the start of that week (Sunday)
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    let currentWeek: { date: Date; dateStr: string; minutes: number }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const minutes = activityMap.get(dateStr) || 0;

      currentWeek.push({
        date: new Date(currentDate),
        dateStr,
        minutes,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Push any remaining days as the last week, padding to complete the column
    if (currentWeek.length > 0) {
      // Pad the remaining days to complete the week (7 days)
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date(currentDate),
          dateStr: '',
          minutes: -1, // Use -1 to indicate a future/empty cell
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [activityMap, months]);

  // Generate month labels with their positions
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    gridData.forEach((week, weekIndex) => {
      // Check the first day of each week
      const firstDay = week[0];
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            month: MONTH_LABELS[month],
            weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [gridData]);

  return (
    <View style={styles.container}>
      <View style={styles.heatmapContainer}>
        {/* Day labels column */}
        <View style={styles.dayLabelsColumn}>
          <View style={styles.monthLabelSpacer} />
          {DAY_LABELS.map((label, index) => (
            <View key={index} style={styles.dayLabelCell}>
              <Text style={styles.dayLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Scrollable grid area */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View>
            {/* Month labels row */}
            <View style={styles.monthLabelsRow}>
              {monthLabels.map((label, index) => (
                <Text
                  key={index}
                  style={[
                    styles.monthLabel,
                    { left: label.weekIndex * (CELL_SIZE + CELL_GAP) },
                  ]}
                >
                  {label.month}
                </Text>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.grid}>
              {gridData.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.weekColumn}>
                  {week.map((day, dayIndex) => (
                    <View
                      key={dayIndex}
                      style={[
                        styles.cell,
                        { backgroundColor: getColor(day.minutes) },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
  },
  heatmapContainer: {
    flexDirection: 'row',
  },
  dayLabelsColumn: {
    marginRight: 4,
  },
  monthLabelSpacer: {
    height: 18,
  },
  dayLabelCell: {
    height: CELL_SIZE + CELL_GAP,
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    width: DAY_LABEL_WIDTH,
  },
  scrollContent: {
    paddingRight: 16,
  },
  monthLabelsRow: {
    height: 18,
    position: 'relative',
  },
  monthLabel: {
    position: 'absolute',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  grid: {
    flexDirection: 'row',
  },
  weekColumn: {
    marginRight: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    marginBottom: CELL_GAP,
  },
});
