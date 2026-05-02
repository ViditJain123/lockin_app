import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import LCBody from '../lc/LCBody';
import LCCard from '../lc/LCCard';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';
import { requestNotificationPermission } from '../../../lib/notificationService';

const FEATURES = [
  { icon: 'alarm-outline' as const, label: 'Daily focus reminders' },
  { icon: 'flame-outline' as const, label: 'Streak motivation' },
  { icon: 'trophy-outline' as const, label: 'Achievement updates' },
];

interface NotificationPermissionScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function NotificationPermissionScreen({
  onContinue,
  onBack,
}: NotificationPermissionScreenProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleContinue = async () => {
    setIsRequesting(true);
    try {
      await requestNotificationPermission();
    } catch (e) {
      console.error('[NotificationPermission] Error:', e);
    } finally {
      setIsRequesting(false);
      onContinue();
    }
  };

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <View style={styles.body}>
        <LCEyebrow text="Arm the traps" step={{ current: 2, total: 2 }} />
        <LCDisplay
          lineOne="Stay"
          lineTwo="locked in."
          accent="two"
          size={42}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          We'll only buzz when it matters — streaks, wins, and the occasional kick.
        </LCBody>

        <LCCard radius="lg" padding={16} style={{ marginTop: 22 }}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name="notifications" size={22} color={LC.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.head}>NOTIFICATIONS</Text>
              <LCBody size={12} style={{ marginTop: 2 }}>
                Streak reminders, win celebrations, and the rare nudge.
              </LCBody>
            </View>
          </View>
        </LCCard>

        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Ionicons name={f.icon} size={18} color={LC.textDim} />
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footnote}>
          YOU CAN TURN THESE OFF ANYTIME IN SETTINGS
        </Text>
      </View>

      <LCCTA
        label={isRequesting ? 'Requesting' : 'Turn on reminders'}
        onPress={handleContinue}
        loading={isRequesting}
        disabled={isRequesting}
        hint="maybe later"
      />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,59,92,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: LC.text,
    letterSpacing: 0.5,
  },
  featureList: {
    marginTop: 18,
    gap: 12,
    paddingHorizontal: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontFamily: Fonts.interMedium,
    fontSize: 13,
    color: LC.textDim,
  },
  footnote: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    letterSpacing: 1.4,
    color: LC.textMute,
    textAlign: 'center',
    marginTop: 22,
  },
});
