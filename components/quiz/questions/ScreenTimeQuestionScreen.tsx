import React from 'react';
import { StyleSheet, View } from 'react-native';

import LCBody from '../lc/LCBody';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';
import LCHourPicker from '../lc/LCHourPicker';

interface ScreenTimeQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  screenTime: number;
  onScreenTimeChange: (hours: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function ScreenTimeQuestionScreen({
  screenTime,
  onScreenTimeChange,
  onContinue,
  onBack,
}: ScreenTimeQuestionScreenProps) {
  const value = screenTime || 4;

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <View style={styles.body}>
        <LCEyebrow text="Diagnosis" step={{ current: 2, total: 5 }} />
        <LCDisplay
          lineOne="How bad"
          lineTwo="is it?"
          accent="two"
          size={42}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          Hours you burn on your phone — every day. Be honest.
        </LCBody>

        <LCHourPicker
          label="Daily · on your phone"
          caption={`= ${value * 60} min of your life`}
          value={value}
          min={1}
          max={12}
          onChange={onScreenTimeChange}
          style={{ marginTop: 28 }}
        />
      </View>

      <LCCTA label="Continue" onPress={onContinue} />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
});
