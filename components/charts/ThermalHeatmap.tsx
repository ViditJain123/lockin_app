import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { T } from '@/constants/Theme';
import { getLocalDateString } from '@/lib/dateUtils';

// Ember → orange → yellow → white-hot, like a thermal camera
const HEAT_STOPS: [number, [number, number, number]][] = [
  [0, [58, 18, 0]],
  [0.3, [194, 78, 0]],
  [0.55, [255, 102, 0]],
  [0.8, [255, 201, 60]],
  [1, [255, 246, 220]],
];

export function heatColor(t: number): string {
  if (t <= 0) return T.sunk;
  const x = Math.min(1, Math.max(0, t));
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const [p1, c1] = HEAT_STOPS[i];
    const [p0, c0] = HEAT_STOPS[i - 1];
    if (x <= p1) {
      const k = (x - p0) / (p1 - p0);
      const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return 'rgb(255,246,220)';
}

interface Props {
  minutesByDate: Record<string, number>;
  weeks: number;
  // Minutes that count as "white hot"
  maxMinutes?: number;
  gap?: number;
}

/** Weeks as columns, Mon–Sun as rows, today bottom-right. Pixels glow by focus. */
function ThermalHeatmap({ minutesByDate, weeks, maxMinutes = 240, gap = 2 }: Props) {
  const cols = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const todayRow = (today.getDay() + 6) % 7; // Monday = 0
    const out: number[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: number[] = [];
      for (let d = 0; d < 7; d++) {
        const daysAgo = (weeks - 1 - w) * 7 + (todayRow - d);
        if (daysAgo < 0) {
          col.push(-1); // future
          continue;
        }
        const dt = new Date(today);
        dt.setDate(today.getDate() - daysAgo);
        const mins = minutesByDate[getLocalDateString(dt)] ?? 0;
        col.push(mins <= 0 ? 0 : Math.max(0.1, Math.min(1, mins / maxMinutes)));
      }
      out.push(col);
    }
    return out;
  }, [minutesByDate, weeks, maxMinutes]);

  return (
    <View style={[styles.grid, { gap }]}>
      {cols.map((col, w) => (
        <View key={w} style={[styles.col, { gap }]}>
          {col.map((v, d) => {
            if (v < 0) return <View key={d} style={[styles.cell, styles.future]} />;
            const bg = heatColor(v);
            return (
              <View
                key={d}
                style={[
                  styles.cell,
                  { backgroundColor: bg },
                  v >= 0.5 && { shadowColor: bg, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default memo(ThermalHeatmap);

export function HeatLegend() {
  return (
    <View style={styles.legend}>
      {[0, 0.2, 0.45, 0.7, 0.9, 1].map((v) => (
        <View key={v} style={[styles.legendCell, { backgroundColor: heatColor(v) }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 2,
  },
  future: {
    backgroundColor: 'transparent',
  },
  legend: {
    flexDirection: 'row',
    gap: 2,
  },
  legendCell: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
});
