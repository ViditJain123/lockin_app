import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import LCBody from '../lc/LCBody';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';
import LCSelectableCard from '../lc/LCSelectableCard';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

const GOAL_OPTIONS = [
  { id: 'screen_time', label: 'Reduce Screen Time', icon: '📱' },
  { id: 'late_night', label: 'Quit late-night scrolling', icon: '🌙' },
  { id: 'consistency', label: 'Build consistency', icon: '💪' },
  { id: 'study', label: 'Better focus for study', icon: '📚' },
  { id: 'work', label: 'Productivity at work', icon: '💼' },
  { id: 'present', label: 'Be more present', icon: '🧘' },
  { id: 'social', label: 'Less social isolation', icon: '👥' },
];

const MAX_SELECTIONS = 3;

interface GoalsQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  selectedGoals: string[];
  onGoalsChange: (goals: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function GoalsQuestionScreen({
  userName,
  selectedGoals,
  onGoalsChange,
  onContinue,
  onBack,
}: GoalsQuestionScreenProps) {
  const canContinue = selectedGoals.length > 0;

  const handleOptionPress = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      onGoalsChange(selectedGoals.filter((id) => id !== goalId));
    } else if (selectedGoals.length < MAX_SELECTIONS) {
      onGoalsChange([...selectedGoals, goalId]);
    } else {
      onGoalsChange([...selectedGoals.slice(0, -1), goalId]);
    }
  };

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <View style={styles.body}>
        <LCEyebrow text="Diagnosis" step={{ current: 1, total: 5 }} />
        <LCDisplay
          lineOne={userName ? `${userName}, what's` : "What's the"}
          lineTwo="the goal?"
          accent="two"
          size={40}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          We'll tune the locks, receipts, and reminders to your real grind.
        </LCBody>
        <Text style={styles.hint}>{`PICK UP TO ${MAX_SELECTIONS}`}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {GOAL_OPTIONS.map((option) => (
          <LCSelectableCard
            key={option.id}
            title={option.label}
            icon={<Text style={styles.emoji}>{option.icon}</Text>}
            selected={selectedGoals.includes(option.id)}
            onPress={() => handleOptionPress(option.id)}
            layout="row"
            style={{ marginBottom: 8 }}
          />
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>

      <LCCTA
        label="Lock it in"
        onPress={onContinue}
        disabled={!canContinue}
      />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  hint: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: LC.textMute,
    marginTop: 10,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  emoji: {
    fontSize: 22,
  },
});
