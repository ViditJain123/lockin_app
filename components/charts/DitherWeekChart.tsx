import React, { memo, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';
import type { DayFocus } from '@/lib/focusData';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// 4×4 Bayer matrix: ordered-dither thresholds
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

interface Props {
  days: DayFocus[];
  todayIndex: number;
  height: number;
  px?: number; // unused, kept for call-site compatibility
  showLabels?: boolean;
}

/**
 * Diverging week chart: lock-in time grows up from the axis in yellow, screen
 * time hangs below it in orange, as rounded capsules.
 */
function DitherWeekChart({ days, todayIndex, height, showLabels = true }: Props) {
  const [width, setWidth] = useState(0);

  const labelH = showLabels ? 18 : 0;
  const plotH = height - labelH;
  const maxFocus = Math.max(...days.map((d) => d.focusMin), 30);
  const maxScreen = Math.max(...days.map((d) => d.screenMin), 30);
  // Axis sits where the two sides' scales meet, so one shared minutes-per-pixel
  const total = maxFocus + maxScreen;
  const axisY = Math.round(plotH * (maxFocus / total));
  const scale = (plotH - 4) / total;

  const rects = useMemo(() => {
    if (width === 0) return null;
    const colW = width / 7;
    const barW = Math.min(Math.round(colW * 0.5), 26);
    const r = barW / 2;
    const out: React.ReactElement[] = [];
    days.forEach((d, i) => {
      if (i > todayIndex) return;
      const x = Math.round(i * colW + (colW - barW) / 2);
      const up = Math.round(d.focusMin * scale);
      const down = Math.round(d.screenMin * scale);
      // Capsules that meet the axis with a 2px gap on each side
      if (up > 0) {
        const h = Math.max(up, barW * 0.5);
        out.push(<Rect key={`u${i}`} x={x} y={axisY - 2 - h} width={barW} height={h} rx={Math.min(r, h / 2)} fill="url(#gUp)" opacity={i === todayIndex ? 1 : 0.85} />);
      }
      if (down > 0) {
        const h = Math.max(down, barW * 0.5);
        out.push(<Rect key={`d${i}`} x={x} y={axisY + 3} width={barW} height={h} rx={Math.min(r, h / 2)} fill="url(#gDown)" opacity={i === todayIndex ? 1 : 0.85} />);
      }
    });
    return out;
  }, [width, days, todayIndex, scale, axisY]);

  return (
    <View>
      <View style={{ height: plotH }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={plotH}>
            <Defs>
              <LinearGradient id="gUp" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFE7A3" />
                <Stop offset="0.35" stopColor={T.yellow} />
                <Stop offset="1" stopColor="#E9A800" />
              </LinearGradient>
              <LinearGradient id="gDown" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#D94F00" />
                <Stop offset="0.65" stopColor={T.orange} />
                <Stop offset="1" stopColor="#FF9A52" />
              </LinearGradient>
            </Defs>
            {/* Future days: faint placeholders */}
            {days.map((_, i) =>
              i > todayIndex ? (
                <Rect
                  key={`f${i}`}
                  x={i * (width / 7) + width / 14 - 1}
                  y={axisY - 10}
                  width={2}
                  height={20}
                  fill="rgba(255,255,255,0.08)"
                />
              ) : null
            )}
            {rects}
            <Line x1={0} x2={width} y1={axisY + 0.5} y2={axisY + 0.5} stroke="rgba(255,255,255,0.22)" strokeWidth={1} />
          </Svg>
        )}
      </View>
      {showLabels && (
        <View style={styles.labels}>
          {DAY_LETTERS.map((l, i) => (
            <Text key={i} style={[styles.label, i === todayIndex && styles.labelToday]}>
              {l}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default memo(DitherWeekChart);

export function ChartLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.swatch, { backgroundColor: T.yellow }]} />
        <Text style={styles.legendText}>Locked in</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.swatch, { backgroundColor: T.orange }]} />
        <Text style={styles.legendText}>Screen time</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    height: 18,
    alignItems: 'flex-end',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: T.inkMute,
  },
  labelToday: {
    color: T.ink,
    fontFamily: Fonts.bold,
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: T.inkSoft,
  },
});
