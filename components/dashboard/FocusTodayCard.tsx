import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { BrandColors } from '../../constants/BrandColors';
import { Fonts } from '../../constants/Fonts';

const INK = BrandColors.palette.ink;
const ORANGE = BrandColors.palette.orange;

const SPARK_WIDTH = 150;
const SPARK_HEIGHT = 58;
const DIAL_SIZE = 128;

// Smooth curve through the points (Catmull-Rom converted to cubic Béziers)
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function Sparkline({ values }: { values: number[] }) {
  const pad = 6;
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (SPARK_WIDTH - pad * 2),
    y: SPARK_HEIGHT - pad - (v / max) * (SPARK_HEIGHT - pad * 2),
  }));
  const line = smoothPath(points);
  const last = points[points.length - 1];
  const area = `${line} L ${last.x} ${SPARK_HEIGHT} L ${points[0].x} ${SPARK_HEIGHT} Z`;

  return (
    <Svg width={SPARK_WIDTH} height={SPARK_HEIGHT}>
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={INK} stopOpacity={0.08} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#sparkFill)" />
      <Path d={line} stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Circle cx={last.x} cy={last.y} r={5} fill={BrandColors.palette.white} stroke={INK} strokeWidth={2} />
    </Svg>
  );
}

function GoalDial({ progress }: { progress: number }) {
  const c = DIAL_SIZE / 2;
  const arcRadius = 50;
  const circumference = 2 * Math.PI * arcRadius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  // Arc starts at 12 o'clock; the pointer follows its end
  const angle = clamped * 2 * Math.PI - Math.PI / 2;
  const tipX = c + Math.cos(angle) * arcRadius;
  const tipY = c + Math.sin(angle) * arcRadius;

  return (
    <Svg width={DIAL_SIZE} height={DIAL_SIZE}>
      <Defs>
        <RadialGradient id="dialGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={ORANGE} stopOpacity={0.55} />
          <Stop offset="0.55" stopColor={ORANGE} stopOpacity={0.15} />
          <Stop offset="1" stopColor={ORANGE} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={c - 2} fill="url(#dialGlow)" />
      <Circle
        cx={c}
        cy={c}
        r={c - 4}
        stroke="rgba(14, 14, 14, 0.25)"
        strokeWidth={1}
        strokeDasharray="4 5"
        fill="none"
      />
      <Circle cx={c} cy={c} r={arcRadius} stroke="rgba(14, 14, 14, 0.08)" strokeWidth={4} fill="none" />
      {clamped > 0 && (
        <Circle
          cx={c}
          cy={c}
          r={arcRadius}
          stroke={ORANGE}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference * clamped} ${circumference}`}
          transform={`rotate(-90 ${c} ${c})`}
        />
      )}
      <Line x1={c} y1={c} x2={tipX} y2={tipY} stroke={BrandColors.palette.white} strokeWidth={1.5} />
      <Circle cx={c} cy={c} r={9} fill={INK} stroke={BrandColors.palette.white} strokeWidth={3} />
    </Svg>
  );
}

interface FocusTodayCardProps {
  todayMinutes: number;
  targetHours: number;
  // Minutes per day for the last 7 days, oldest first
  weekMinutes: number[];
  streak: number;
}

export default function FocusTodayCard({
  todayMinutes,
  targetHours,
  weekMinutes,
  streak,
}: FocusTodayCardProps) {
  const hours = todayMinutes / 60;
  const showMinutes = hours < 1;
  const value = showMinutes ? Math.round(todayMinutes).toString() : hours.toFixed(1);
  const progress = targetHours > 0 ? hours / targetHours : 0;

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.label}>Focus today</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.unit}>{showMinutes ? 'min' : 'h'}</Text>
        </View>
        <Text style={styles.goal}>
          {Math.round(Math.min(progress, 1) * 100)}% of {targetHours}h goal
        </Text>
        <View style={styles.spark}>
          <Sparkline values={weekMinutes} />
        </View>
      </View>

      <View style={styles.right}>
        <GoalDial progress={progress} />
        <View style={styles.streakTile}>
          <Ionicons name="flame" size={16} color={ORANGE} />
          <Text style={styles.streakText}>{streak}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.palette.white,
    borderRadius: 34,
    paddingVertical: 22,
    paddingLeft: 24,
    paddingRight: 16,
    shadowColor: INK,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  left: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: 'rgba(14, 14, 14, 0.55)',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  value: {
    fontSize: 46,
    lineHeight: 52,
    fontFamily: Fonts.light,
    color: INK,
  },
  unit: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: 'rgba(14, 14, 14, 0.55)',
    marginLeft: 4,
    marginBottom: 8,
  },
  goal: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: ORANGE,
  },
  spark: {
    marginTop: 12,
  },
  right: {
    width: DIAL_SIZE,
    height: DIAL_SIZE + 12,
    justifyContent: 'flex-end',
  },
  streakTile: {
    position: 'absolute',
    top: 0,
    left: -6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F1F1EF',
    transform: [{ rotate: '-10deg' }],
    shadowColor: INK,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  streakText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: INK,
  },
});
