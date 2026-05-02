import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import LCBody from '../lc/LCBody';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';
import LCHourPicker from '../lc/LCHourPicker';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface DesiredScreenTimeQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  desiredScreenTime: number;
  onDesiredScreenTimeChange: (hours: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function DesiredScreenTimeQuestionScreen({
  userName,
  desiredScreenTime,
  onDesiredScreenTimeChange,
  onContinue,
  onBack,
}: DesiredScreenTimeQuestionScreenProps) {
  const value = desiredScreenTime || 2;

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <View style={styles.body}>
        <LCEyebrow text="Diagnosis" step={{ current: 3, total: 5 }} />
        <LCDisplay
          lineOne="What'd you"
          lineTwo="rather?"
          accent="two"
          size={42}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          {userName ? `Don't feel bad, ${userName}. ` : ''}We're here for the flip.
        </LCBody>

        <LCHourPicker
          label="Daily target · realistic"
          caption={`= ${value * 60} min · screen time you keep`}
          value={value}
          min={1}
          max={6}
          onChange={onDesiredScreenTimeChange}
          style={{ marginTop: 28 }}
        />

        <View style={styles.footnote}>
          <Text style={styles.footnoteText}>YOU CAN ADJUST THIS LATER</Text>
        </View>
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
  footnote: {
    alignItems: 'center',
    marginTop: 16,
  },
  footnoteText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: LC.textMute,
  },
});
