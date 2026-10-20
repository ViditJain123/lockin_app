import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';
import { sliderTick } from '../../../lib/haptics';

interface LCHourPickerProps {
  label: string;
  caption?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (hours: number) => void;
  unit?: string;
  unitColor?: string;
  numberColor?: string;
  showPills?: boolean;
  style?: ViewStyle;
}

export default function LCHourPicker({
  label,
  caption,
  value,
  min = 1,
  max = 12,
  onChange,
  unit = 'H',
  unitColor = LC.red,
  numberColor = LC.text,
  showPills = true,
  style,
}: LCHourPickerProps) {
  const display = value >= max ? `${value}+` : `${value}`;
  const pills = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const handlePick = (hours: number) => {
    if (hours !== value) sliderTick();
    onChange(hours);
  };

  return (
    <View style={style}>
      <View style={styles.card}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        <View style={styles.row}>
          <Text style={[styles.value, { color: numberColor }]}>{display}</Text>
          <Text style={[styles.unit, { color: unitColor }]}>{unit}</Text>
        </View>
        {caption ? <Text style={styles.caption}>{caption.toUpperCase()}</Text> : null}
      </View>

      {showPills && (
        <View style={styles.pillsWrap}>
          {pills.map((h) => {
            const sel = h === value;
            return (
              <Pressable
                key={h}
                onPress={() => handlePick(h)}
                hitSlop={6}
                style={[
                  styles.pill,
                  sel
                    ? { backgroundColor: LC.red, borderColor: LC.red }
                    : {
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderColor: LC.border,
                      },
                ]}
              >
                <Text style={[styles.pillText, { color: sel ? '#fff' : LC.textDim }]}>
                  {h}H
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 22,
    paddingHorizontal: 22,
    borderRadius: 20,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.3)',
    shadowColor: LC.red,
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    alignItems: 'center',
  },
  label: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: LC.textMute,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: 110,
    lineHeight: 120,
    letterSpacing: -2,
    paddingTop: 6,
  },
  unit: {
    fontFamily: Fonts.display,
    fontSize: 110,
    lineHeight: 120,
    letterSpacing: -2,
    paddingTop: 6,
  },
  caption: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: LC.textDim,
    marginTop: -2,
  },
  pillsWrap: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 46,
    alignItems: 'center',
  },
  pillText: {
    fontFamily: Fonts.display,
    fontSize: 16,
    letterSpacing: 0.8,
  },
});
