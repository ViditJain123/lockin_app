import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  DeviceActivitySelectionView,
  blockSelection,
} from 'react-native-device-activity';

import LCBody from '../lc/LCBody';
import LCCard from '../lc/LCCard';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface AppSelectionScreenProps {
  familyActivitySelection: string | null;
  onSelectionChange: (selection: string | null) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function AppSelectionScreen({
  familyActivitySelection,
  onSelectionChange,
  onContinue,
  onBack,
}: AppSelectionScreenProps) {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [tempSelection, setTempSelection] = useState<string | null>(familyActivitySelection);
  const [selectionCount, setSelectionCount] = useState({ apps: 0, categories: 0 });

  const totalArmed = selectionCount.apps + selectionCount.categories;

  const handleOpenPicker = () => {
    setTempSelection(familyActivitySelection);
    setIsPickerVisible(true);
  };

  const handleDone = () => {
    onSelectionChange(tempSelection);
    setIsPickerVisible(false);

    if (tempSelection) {
      try {
        blockSelection({ activitySelectionToken: tempSelection }, 'onboardingSelection');
      } catch (error) {
        console.error('Error blocking selection:', error);
      }
    }
    onContinue();
  };

  const handleContinue = () => {
    if (familyActivitySelection) {
      try {
        blockSelection({ activitySelectionToken: familyActivitySelection }, 'onboardingSelection');
      } catch (error) {
        console.error('Error blocking selection:', error);
      }
    }
    onContinue();
  };

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <View style={styles.body}>
        <LCEyebrow text="Freeze list" />
        <LCDisplay
          lineOne="What gets"
          lineTwo="frozen?"
          accent="two"
          size={44}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          These apps lock until you earn them. You can change this anytime.
        </LCBody>

        <LCCard tone="armed" radius="lg" padding={14} style={{ marginTop: 22 }}>
          <View style={styles.armedRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.armedLabel}>
                {totalArmed > 0
                  ? `ARMED · ${totalArmed} ${totalArmed === 1 ? 'TARGET' : 'TARGETS'}`
                  : 'NOTHING ARMED YET'}
              </Text>
              <Text style={styles.armedHero}>
                {totalArmed > 0 ? 'YOUR LOCK LIST' : 'TAP TO PICK YOUR APPS'}
              </Text>
            </View>
            <Text style={styles.lockEmoji}>🔒</Text>
          </View>
        </LCCard>

        <Pressable
          onPress={handleOpenPicker}
          style={({ pressed }) => [styles.pickerBtn, pressed && { opacity: 0.85 }]}
        >
          <View style={styles.pickerIcon}>
            <Ionicons name="apps" size={18} color={LC.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickerLabel}>OPEN PICKER</Text>
            <Text style={styles.pickerSub}>iOS will show your installed apps</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={LC.textMute} />
        </Pressable>

        <Text style={styles.footnote}>
          ↑ TAP TO ADD OR REMOVE TARGETS — CHANGE THESE ANYTIME
        </Text>
      </View>

      <LCCTA
        label="Arm the locks"
        onPress={handleContinue}
        disabled={!familyActivitySelection}
      />

      <Modal
        visible={isPickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={{ width: 60 }} />
            <Text style={styles.modalTitle}>SELECT APPS</Text>
            <Pressable
              onPress={handleDone}
              style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.doneTxt}>DONE</Text>
            </Pressable>
          </View>

          {__DEV__ && Platform.OS === 'ios' && !Platform.isPad && (
            <Text style={styles.simWarn}>
              Note: App list is empty on Simulator. Test on a physical device.
            </Text>
          )}

          <View style={{ flex: 1 }}>
            <DeviceActivitySelectionView
              style={{ flex: 1 }}
              familyActivitySelection={tempSelection}
              onSelectionChange={(event) => {
                const { familyActivitySelection: selection, applicationCount, categoryCount } = event.nativeEvent;
                setTempSelection(selection ?? null);
                setSelectionCount({ apps: applicationCount, categories: categoryCount });
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  armedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  armedLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    letterSpacing: 1.6,
    color: LC.red,
  },
  armedHero: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: LC.text,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  lockEmoji: {
    fontSize: 26,
  },
  pickerBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
  },
  pickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: LC.bgElev,
    borderWidth: 1,
    borderColor: LC.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerLabel: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: LC.text,
    letterSpacing: 0.5,
  },
  pickerSub: {
    fontFamily: Fonts.interRegular,
    fontSize: 12,
    color: LC.textDim,
    marginTop: 2,
  },
  footnote: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    letterSpacing: 1.4,
    color: LC.textMute,
    textAlign: 'center',
    marginTop: 14,
  },
  modal: {
    flex: 1,
    backgroundColor: LC.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LC.border,
  },
  modalTitle: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: LC.text,
    letterSpacing: 1.5,
  },
  doneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  doneTxt: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: LC.red,
    letterSpacing: 1.2,
  },
  simWarn: {
    color: LC.textMute,
    textAlign: 'center',
    padding: 12,
    fontSize: 12,
    fontFamily: Fonts.interRegular,
  },
});
