import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';

import LCBody from '../lc/LCBody';
import LCCard from '../lc/LCCard';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface ScreenTimePermissionScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function ScreenTimePermissionScreen({
  onContinue,
  onBack,
}: ScreenTimePermissionScreenProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [showDenied, setShowDenied] = useState(false);

  const handleContinue = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await ReactNativeDeviceActivity.requestAuthorization('individual');
      const status = await ReactNativeDeviceActivity.pollAuthorizationStatus();
      if (status === ReactNativeDeviceActivity.AuthorizationStatus.approved) {
        onContinue();
      } else {
        setShowDenied(true);
      }
    } catch (e) {
      console.error('Authorization error:', e);
      setShowDenied(true);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <View style={styles.body}>
        <LCEyebrow text="Arm the traps" step={{ current: 1, total: 2 }} />
        <LCDisplay
          lineOne={showDenied ? 'Access' : 'Connect'}
          lineTwo={showDenied ? 'required.' : 'Screen Time.'}
          accent="two"
          size={40}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          {showDenied
            ? "Lockin can't enforce without it. Tap continue and allow access on the next dialog."
            : 'iOS will ask you next. This is what to expect — tap Continue.'}
        </LCBody>

        <View style={styles.dialogWrap}>
          <BlurView intensity={28} tint="dark" style={styles.blur}>
            <View style={styles.dialogInner}>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={22} color="#fff" />
              </View>

              <Text style={styles.dialogTitle}>
                {'“'}LockIn{'”'} Would Like to{'\n'}Access Screen Time
              </Text>
              <Text style={styles.dialogBody}>
                Providing {'“'}LockIn{'”'} access to Screen Time
                lets it see your activity data, app content, and limit the usage of apps and websites.
              </Text>

              <View style={styles.dialogButtons}>
                <Pressable
                  onPress={handleContinue}
                  disabled={isRequesting}
                  style={({ pressed }) => [
                    styles.dialogBtn,
                    styles.dialogBtnPrimary,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.dialogBtnTextPrimary}>Continue</Text>
                </Pressable>
                <View style={[styles.dialogBtn, styles.dialogBtnSecondary]}>
                  <Text style={styles.dialogBtnTextSecondary}>Don{'’'}t Allow</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        <View style={styles.arrowRow}>
          <Ionicons name="arrow-down" size={20} color={LC.textMute} />
          <Text style={styles.arrowText}>TAP CONTINUE BELOW</Text>
        </View>

        <LCCard radius="lg" padding={12} style={styles.privacy}>
          <View style={styles.privacyRow}>
            <Ionicons name="shield-checkmark" size={14} color={LC.textDim} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyHead}>PRIVACY · LOCAL ONLY</Text>
              <LCBody size={11} style={{ marginTop: 2 }}>
                Sensitive data is protected by Apple and never leaves your device.
              </LCBody>
            </View>
          </View>
        </LCCard>
      </View>

      <LCCTA
        label={isRequesting ? 'Requesting' : 'Grant access'}
        onPress={handleContinue}
        loading={isRequesting}
        disabled={isRequesting}
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
  dialogWrap: {
    marginTop: 18,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: LC.borderStrong,
  },
  blur: {
    backgroundColor: 'rgba(20,20,20,0.6)',
  },
  dialogInner: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dialogTitle: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
  },
  dialogBody: {
    fontFamily: Fonts.interRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 6,
  },
  dialogButtons: {
    width: '100%',
    gap: 8,
    marginTop: 14,
  },
  dialogBtn: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  dialogBtnPrimary: {
    backgroundColor: '#0A84FF',
  },
  dialogBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  dialogBtnTextPrimary: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 15,
    color: '#fff',
  },
  dialogBtnTextSecondary: {
    fontFamily: Fonts.interRegular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  arrowText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: LC.textMute,
  },
  privacy: {
    marginTop: 12,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  privacyHead: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    color: LC.textMute,
  },
});
