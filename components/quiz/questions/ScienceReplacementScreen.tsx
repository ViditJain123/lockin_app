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

interface ScienceReplacementScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

const STEPS = [
  {
    n: '01',
    head: "QUITTING DOESN'T WORK",
    body: 'Cold-turkey kills almost every habit-change attempt. Your brain is wired to fill the gap — and the phone wins by default.',
  },
  {
    n: '02',
    head: 'REPLACEMENT WINS',
    body: 'Decades of behavioral science: the only durable fix is to swap the loop, not erase it. Pull a habit out, plug a new one in.',
  },
  {
    n: '03',
    head: 'WORK IS THE PLUG',
    body: 'Deep work fills the dopamine slot. Lockin makes the trade visible: minutes of grind for minutes of phone.',
  },
];

export default function ScienceReplacementScreen({
  onContinue,
  onBack,
}: ScienceReplacementScreenProps) {
  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <LCEyebrow text="The science" />
          <LCDisplay
            lineOne="Kill the"
            lineTwo="scroll."
            accent="two"
            size={46}
            style={{ marginTop: 10 }}
          />
          <LCBody style={{ marginTop: 8 }}>
            You don't quit a habit. You replace it. Here's the playbook.
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
              </LCCard>
            ))}
          </View>

          <Text style={styles.disclaimer}>
            BACKED BY LONGITUDINAL STUDIES · SYSTEMATIC REVIEWS · BEHAVIORAL SCIENCE
          </Text>
        </View>
      </ScrollView>

      <LCCTA label="I'm ready" onPress={onContinue} />
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
    fontSize: 18,
    color: LC.text,
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    letterSpacing: 1.4,
    color: LC.textMute,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 14,
  },
});
