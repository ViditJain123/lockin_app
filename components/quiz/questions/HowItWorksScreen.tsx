import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import LCBody from '../lc/LCBody';
import LCCard from '../lc/LCCard';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface HowItWorksScreenProps {
  userName: string;
  targetHours: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function HowItWorksScreen({
  userName,
  targetHours,
  onContinue,
  onBack,
}: HowItWorksScreenProps) {
  const displayName = userName || 'you';

  const STEPS = [
    {
      n: '01',
      head: 'YOU LOCK IN',
      body: 'Camera rolls. Apps freeze. Distractions die for the session.',
    },
    {
      n: '02',
      head: 'YOU GRIND',
      body: `${targetHours}h of deep work earns ${targetHours * 60} minutes of screen time — banked.`,
    },
    {
      n: '03',
      head: 'YOU CLAIM',
      body: 'Hit your daily target and the phone unlocks fully — for the rest of the day.',
    },
  ];

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <LCEyebrow text="How it works" />
          <LCDisplay
            lineOne="The loop"
            lineTwo="is simple."
            accent="two"
            size={44}
            style={{ marginTop: 10 }}
          />
          <LCBody style={{ marginTop: 8 }}>
            {displayName.charAt(0).toUpperCase() + displayName.slice(1)},
            you committed to {targetHours}h a day. Here's how the trade works.
          </LCBody>

          <View style={{ marginTop: 22, gap: 10 }}>
            {STEPS.map((s) => (
              <LCCard key={s.n} radius="lg" padding={16}>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumWrap}>
                    <Text style={styles.stepNum}>{s.n}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepHead}>{s.head}</Text>
                    <LCBody size={13} style={{ marginTop: 6 }}>
                      {s.body}
                    </LCBody>
                  </View>
                </View>
                <Text style={styles.watermark}>{s.n}</Text>
              </LCCard>
            ))}
          </View>
        </View>
      </ScrollView>

      <LCCTA label="Got it" onPress={onContinue} />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepNumWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: LC.bgElev,
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: LC.red,
    letterSpacing: 0.5,
  },
  stepHead: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: LC.text,
    letterSpacing: 0.5,
  },
  watermark: {
    position: 'absolute',
    right: 0,
    bottom: -28,
    fontFamily: Fonts.display,
    fontSize: 130,
    lineHeight: 110,
    color: 'rgba(255,102,0,0.06)',
    letterSpacing: -4,
  },
});
