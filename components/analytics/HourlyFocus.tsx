import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';
import { optionSelect } from '@/lib/haptics';
import type { LocalSession } from '@/store/useSessionStore';

type Range = 'today' | 'week';

const CHART_H = 150;
const AXIS_LABELS = ['12a', '6a', '12p', '6p', '12a'];

function hourName(h: number) {
  const suffix = h < 12 ? 'am' : 'pm';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${suffix}`;
}

function fmt(min: number) {
  const m = Math.round(min);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}

// Minutes focused inside each clock hour (0–23) for sessions since `from`
function minutesPerHour(sessions: LocalSession[], from: Date): number[] {
  const out = new Array(24).fill(0);
  const fromMs = from.getTime();
  for (const s of sessions) {
    if (!s.time_started || !s.time_ended) continue;
    let start = new Date(s.time_started).getTime();
    const end = new Date(s.time_ended).getTime();
    if (end <= fromMs || end <= start) continue;
    start = Math.max(start, fromMs);
    // Scale wall-clock span down to counted focus (phone-down pauses etc.)
    const span = new Date(s.time_ended).getTime() - new Date(s.time_started).getTime();
    const scale = span > 0 ? Math.min(1, (s.total_locked_in_seconds * 1000) / span) : 1;
    while (start < end) {
      const d = new Date(start);
      const hourEnd = new Date(d);
      hourEnd.setMinutes(60, 0, 0);
      const sliceEnd = Math.min(end, hourEnd.getTime());
      out[d.getHours()] += ((sliceEnd - start) / 60000) * scale;
      start = sliceEnd;
    }
  }
  return out;
}

/**
 * When you focus: one bar per hour of the day, height = minutes locked in
 * during that hour. Toggle between today and this week (Mon–now).
 */
export default function HourlyFocus({ sessions }: { sessions: LocalSession[] }) {
  const [range, setRange] = useState<Range>('today');
  const [width, setWidth] = useState(0);

  const hours = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    if (range === 'week') from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
    return minutesPerHour(sessions, from);
  }, [sessions, range]);

  const max = Math.max(...hours);
  const total = hours.reduce((a, b) => a + b, 0);
  const peak = max >= 1 ? hours.indexOf(max) : null;
  const activeHours = hours.filter((m) => m >= 1).length;
  const nowHour = new Date().getHours();
  // Round the scale up to a friendly number for the top gridline
  const top = Math.max(range === 'today' ? Math.min(60, Math.ceil(max / 15) * 15) : Math.ceil(max / 30) * 30, range === 'today' ? 30 : 60);

  const colW = width / 24;
  const barW = Math.max(Math.min(colW - 4, 10), 3);

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>WHEN YOU FOCUS</Text>
          <Text style={styles.headline} numberOfLines={1}>
            {peak === null ? (
              range === 'today' ? 'No focus yet today' : 'No focus yet this week'
            ) : (
              <>
                Best hour <Text style={styles.headlineAccent}>{hourName(peak)}–{hourName((peak + 1) % 24)}</Text>
              </>
            )}
          </Text>
        </View>
        <View style={styles.toggle}>
          {(['today', 'week'] as Range[]).map((r) => {
            const active = range === r;
            return (
              <Pressable
                key={r}
                onPress={() => {
                  if (active) return;
                  optionSelect();
                  setRange(r);
                }}
                style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={r === 'today' ? 'Today' : 'This week'}
              >
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                  {r === 'today' ? 'Today' : 'Week'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.chartRow}>
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{fmt(top)}</Text>
          <Text style={styles.yLabel}>{fmt(top / 2)}</Text>
          <Text style={styles.yLabel}>0</Text>
        </View>
        <View style={styles.chart} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
          {[0, 0.5].map((p) => (
            <View key={p} style={[styles.grid, { top: p * CHART_H }]} />
          ))}
          <View style={[styles.grid, styles.gridBase, { top: CHART_H }]} />
          {width > 0 &&
            hours.map((m, h) => {
              const isPeak = h === peak;
              const isNow = range === 'today' && h === nowHour;
              const future = range === 'today' && h > nowHour;
              const bh = m >= 1 ? Math.max((m / top) * CHART_H, barW) : 0;
              return (
                <View key={h} style={[styles.col, { left: h * colW, width: colW }]}>
                  {bh > 0 ? (
                    <View
                      style={[
                        styles.bar,
                        { width: barW, height: Math.min(bh, CHART_H), borderRadius: barW / 2 },
                        isPeak ? styles.barPeak : styles.barNormal,
                      ]}
                    />
                  ) : (
                    <View style={[styles.dot, future && styles.dotFuture, isNow && styles.dotNow]} />
                  )}
                </View>
              );
            })}
        </View>
      </View>

      <View style={styles.xAxis}>
        {AXIS_LABELS.map((l, i) => (
          <Text key={i} style={styles.xLabel}>
            {l}
          </Text>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          <Text style={styles.footerStrong}>{fmt(total)}</Text> locked in
        </Text>
        <Text style={styles.footerText}>
          across <Text style={styles.footerStrong}>{activeHours}</Text> {activeHours === 1 ? 'hour' : 'hours'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 10,
  },
  eyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.inkMute,
  },
  headline: {
    marginTop: 4,
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: T.ink,
  },
  headlineAccent: {
    color: T.yellow,
  },
  toggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: T.sunk,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  toggleBtnActive: {
    backgroundColor: T.orange,
  },
  toggleText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: T.inkSoft,
  },
  toggleTextActive: {
    color: T.white,
  },
  chartRow: {
    flexDirection: 'row',
  },
  yAxis: {
    width: 34,
    height: CHART_H,
    justifyContent: 'space-between',
    marginTop: -6,
    marginBottom: -6,
  },
  yLabel: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    color: T.inkMute,
  },
  chart: {
    flex: 1,
    height: CHART_H,
  },
  grid: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gridBase: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  col: {
    position: 'absolute',
    top: 0,
    height: CHART_H,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {},
  barNormal: {
    backgroundColor: T.orange,
  },
  barPeak: {
    backgroundColor: T.yellow,
    shadowColor: T.yellow,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginBottom: -1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotFuture: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  dotNow: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginBottom: -3.5,
    backgroundColor: T.ink,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginLeft: 34,
  },
  xLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: T.inkMute,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: T.inkSoft,
  },
  footerStrong: {
    fontFamily: Fonts.bold,
    color: T.ink,
  },
});
