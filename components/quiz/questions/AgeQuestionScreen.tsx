import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import LCBody from '../lc/LCBody';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';
import LCSelectableCard from '../lc/LCSelectableCard';

const AGE_OPTIONS = [
  { id: 'under_18', label: 'Under 18', emoji: '🧒' },
  { id: '18_24', label: '18 — 24', emoji: '🧑' },
  { id: '25_29', label: '25 — 29', emoji: '👨' },
  { id: '30_40', label: '30 — 40', emoji: '🧔' },
  { id: '40_plus', label: '40 +', emoji: '👨‍🦳' },
];

interface AgeQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  selectedAge: string;
  onAgeChange: (age: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function AgeQuestionScreen({
  selectedAge,
  onAgeChange,
  onContinue,
  onBack,
}: AgeQuestionScreenProps) {
  const canContinue = selectedAge.length > 0;

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <View style={styles.body}>
        <LCEyebrow text="Diagnosis" step={{ current: 5, total: 5 }} />
        <LCDisplay
          lineOne="How old"
          lineTwo="are you?"
          accent="two"
          size={42}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          We'll calibrate the targets and rewards to your bracket.
        </LCBody>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {AGE_OPTIONS.map((option) => (
          <LCSelectableCard
            key={option.id}
            title={option.label}
            selected={selectedAge === option.id}
            onPress={() => onAgeChange(option.id)}
            layout="row"
            style={{ marginBottom: 8 }}
            icon={<Text style={styles.emoji}>{option.emoji}</Text>}
          />
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>

      <LCCTA label="Continue" onPress={onContinue} disabled={!canContinue} />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  emoji: {
    fontSize: 26,
  },
});
