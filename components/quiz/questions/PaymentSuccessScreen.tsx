import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import LCBody from '../lc/LCBody';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCFrame from '../lc/LCFrame';
import LCReceipt from '../lc/LCReceipt';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface PaymentSuccessScreenProps {
  userName: string;
  onContinue: () => void;
}

export default function PaymentSuccessScreen({
  userName,
  onContinue,
}: PaymentSuccessScreenProps) {
  const pillScale = useSharedValue(0.6);
  const pillOpacity = useSharedValue(0);
  const titleOp = useSharedValue(0);
  const receiptOp = useSharedValue(0);
  const receiptRot = useSharedValue(-12);
  const ctaOp = useSharedValue(0);

  useEffect(() => {
    pillOpacity.value = withTiming(1, { duration: 280 });
    pillScale.value = withSpring(1, { damping: 12, stiffness: 110 });
    titleOp.value = withDelay(260, withTiming(1, { duration: 380 }));
    receiptOp.value = withDelay(520, withTiming(1, { duration: 360 }));
    receiptRot.value = withDelay(520, withTiming(-2, { duration: 520, easing: Easing.out(Easing.cubic) }));
    ctaOp.value = withDelay(900, withTiming(1, { duration: 360 }));
  }, [pillScale, pillOpacity, titleOp, receiptOp, receiptRot, ctaOp]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ scale: pillScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOp.value }));
  const receiptStyle = useAnimatedStyle(() => ({
    opacity: receiptOp.value,
    transform: [{ rotate: `${receiptRot.value}deg` }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOp.value }));

  return (
    <LCFrame glow="center" glowColor={LC.greenGlow} glowIntensity="normal">
      <View style={styles.body}>
        <Animated.View style={[styles.pillRow, pillStyle]}>
          <View style={styles.pill}>
            <Ionicons name="checkmark" size={12} color={LC.green} />
            <Text style={styles.pillText}>YOU'RE IN THE CLUB</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.title, titleStyle]}>
          <LCDisplay
            lineOne={userName ? `Welcome, ${userName}` : 'Welcome to'}
            lineTwo="the club."
            accent="two"
            size={44}
          />
          <LCBody align="center" style={{ marginTop: 12, paddingHorizontal: 12 }}>
            Your card prints. Your locks are armed. Time to grind.
          </LCBody>
        </Animated.View>

        <View style={styles.receiptWrap}>
          <Animated.View style={receiptStyle}>
            <LCReceipt
              brand="MEMBERSHIP"
              subtitle="LOCKIN CLUB"
              meta="ACTIVE"
              lineItems={[
                ['MEMBER', userName ? userName.toUpperCase() : 'YOU'],
                ['PLAN', 'PRO'],
                ['ACCESS', 'FULL'],
              ]}
              total={{ label: 'STATUS', value: 'IN' }}
              footer="LOCK IN. EARN OUT. NO REFUNDS."
              showBarcode
              width={260}
            />
          </Animated.View>
        </View>
      </View>

      <Animated.View style={[styles.ctaWrap, ctaStyle]}>
        <LCCTA label="Let's go" onPress={onContinue} pinned />
      </Animated.View>
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  pillRow: {
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(74,222,128,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
  },
  pillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.green,
  },
  title: {
    marginTop: 22,
    alignItems: 'center',
  },
  receiptWrap: {
    marginTop: 24,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
