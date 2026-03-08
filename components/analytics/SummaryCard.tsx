import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';

interface Props {
  title: string;
  hours: number;
  percentChange: number | null;
  unit?: string;
}

export default function SummaryCard({ title, hours, percentChange, unit }: Props) {
  const isPositive = percentChange !== null && percentChange >= 0;
  const changeColor = isPositive ? '#34C759' : '#FF3B5C';
  const changeIcon = isPositive ? 'arrow-up' : 'arrow-down';

  const formatValue = (h: number): string => {
    if (unit && unit !== 'hours') return String(Math.round(h));
    if (h === 0) return '0';
    if (h < 1) return `${Math.round(h * 60)}m`;
    return h.toFixed(1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.bigNumber}>{formatValue(hours)}</Text>
        {hours >= 1 && <Text style={styles.unit}>{unit || 'hours'}</Text>}
      </View>
      {percentChange !== null && (
        <View style={styles.changeRow}>
          <Ionicons name={changeIcon as any} size={14} color={changeColor} />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {Math.abs(percentChange)}% vs last {title.toLowerCase().includes('week') ? 'week' : 'month'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bigNumber: {
    fontSize: 44,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  unit: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 6,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  changeText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    marginLeft: 4,
  },
});
