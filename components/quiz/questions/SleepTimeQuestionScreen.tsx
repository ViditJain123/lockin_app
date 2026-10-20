import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import LCBody from '../lc/LCBody';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';
import TimePicker from '../TimePicker';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

export interface SleepTime {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
}

interface SleepTimeQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  sleepTime: SleepTime;
  onSleepTimeChange: (sleepTime: SleepTime) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function SleepTimeQuestionScreen({
  userName,
  sleepTime,
  onSleepTimeChange,
  onContinue,
  onBack,
}: SleepTimeQuestionScreenProps) {
  const handleTimeChange = (hour: number, minute: number, period: 'AM' | 'PM') => {
    onSleepTimeChange({ hour, minute, period });
  };

  const formatted = `${sleepTime.hour}:${String(sleepTime.minute).padStart(2, '0')} ${sleepTime.period}`;

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <View style={styles.body}>
        <LCEyebrow text="Personalize" step={{ current: 1, total: 2 }} />
        <LCDisplay
          lineOne={userName ? `${userName}, when` : 'When do you'}
          lineTwo="crash out?"
          accent="two"
          size={42}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          We'll lock down your phone in the hours before bed.
        </LCBody>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>SLEEPING AT</Text>
          <Text style={styles.summaryValue}>{formatted}</Text>
        </View>

        <View style={styles.pickerWrap}>
          <TimePicker
            hour={sleepTime.hour}
            minute={sleepTime.minute}
            period={sleepTime.period}
            onTimeChange={handleTimeChange}
            accentColor={LC.red}
          />
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
  summaryCard: {
    marginTop: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.3)',
    alignItems: 'center',
    shadowColor: LC.red,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  summaryLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
  },
  summaryValue: {
    fontFamily: Fonts.display,
    fontSize: 50,
    color: LC.text,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  pickerWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
});
