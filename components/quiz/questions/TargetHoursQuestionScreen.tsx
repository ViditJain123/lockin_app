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

interface TargetHoursQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  targetHours: number;
  onTargetHoursChange: (hours: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function TargetHoursQuestionScreen({
  userName,
  targetHours,
  onTargetHoursChange,
  onContinue,
  onBack,
}: TargetHoursQuestionScreenProps) {
  const value = targetHours || 4;

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <View style={styles.body}>
        <LCEyebrow text="Personalize" step={{ current: 2, total: 2 }} />
        <LCDisplay
          lineOne={userName ? `${userName}, set` : 'Set your'}
          lineTwo="daily target."
          accent="two"
          size={40}
          style={{ marginTop: 10 }}
        />

        <LCHourPicker
          label="Daily lock-in"
          caption={`= ${value * 60} min · screen time earned`}
          value={value}
          min={1}
          max={12}
          onChange={onTargetHoursChange}
          style={{ marginTop: 24 }}
        />

        <View style={styles.commit}>
          <View style={styles.commitCheck}>
            <Text style={styles.commitTick}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <LCBody size={13} color={LC.text}>
              I'm committing to{' '}
              <Text style={{ color: LC.red, fontFamily: Fonts.interSemiBold }}>
                {value} hours / day
              </Text>
              . No excuses.
            </LCBody>
            <Text style={styles.commitFoot}>MISS A DAY · STREAK DIES</Text>
          </View>
        </View>
      </View>

      <LCCTA label="I commit" onPress={onContinue} />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  commit: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    marginTop: 16,
  },
  commitCheck: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: LC.red,
    backgroundColor: 'rgba(255,59,92,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  commitTick: {
    color: LC.red,
    fontFamily: Fonts.interBold,
    fontSize: 12,
  },
  commitFoot: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: LC.textMute,
    marginTop: 4,
  },
});
