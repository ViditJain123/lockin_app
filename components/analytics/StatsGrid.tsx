import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { StatItem } from '@/types/analytics';

interface Props {
  stats: StatItem[];
  columns?: 2 | 3;
}

export default function StatsGrid({ stats, columns = 2 }: Props) {
  // Build rows
  const rows: StatItem[][] = [];
  for (let i = 0; i < stats.length; i += columns) {
    rows.push(stats.slice(i, i + columns));
  }

  return (
    <View style={styles.container}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((stat, ci) => (
            <View
              key={ci}
              style={[
                styles.cell,
                columns === 2 && styles.cell2Col,
                columns === 3 && styles.cell3Col,
                ci < row.length - 1 && styles.cellBorder,
              ]}
            >
              {stat.icon && (
                <Ionicons
                  name={stat.icon as any}
                  size={16}
                  color="rgba(255,255,255,0.4)"
                  style={styles.icon}
                />
              )}
              <Text style={styles.value} numberOfLines={1}>
                {stat.value}
              </Text>
              <Text style={styles.label} numberOfLines={1}>
                {stat.label}
              </Text>
              {stat.subtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    stat.subtitleColor ? { color: stat.subtitleColor } : undefined,
                  ]}
                >
                  {stat.subtitle}
                </Text>
              )}
            </View>
          ))}
          {/* Pad with empty cells if row isn't full */}
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, i) => (
              <View
                key={`pad-${i}`}
                style={[
                  styles.cell,
                  columns === 2 && styles.cell2Col,
                  columns === 3 && styles.cell3Col,
                ]}
              />
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  cell: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  cell2Col: {
    flex: 1,
  },
  cell3Col: {
    flex: 1,
  },
  cellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  icon: {
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.45)',
  },
  subtitle: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    color: '#34C759',
    marginTop: 2,
  },
});
