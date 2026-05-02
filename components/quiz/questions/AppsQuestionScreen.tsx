import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import LCBody from '../lc/LCBody';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';
import LCSelectableCard from '../lc/LCSelectableCard';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

type IconType = 'fontawesome5' | 'ionicons' | 'materialcommunity';

interface AppOption {
  id: string;
  label: string;
  iconType: IconType;
  iconName: string;
  iconColor: string;
}

const APP_OPTIONS: AppOption[] = [
  { id: 'tiktok', label: 'TikTok', iconType: 'fontawesome5', iconName: 'tiktok', iconColor: '#FFFFFF' },
  { id: 'youtube', label: 'YouTube', iconType: 'fontawesome5', iconName: 'youtube', iconColor: '#FF0000' },
  { id: 'instagram', label: 'Instagram', iconType: 'fontawesome5', iconName: 'instagram', iconColor: '#E4405F' },
  { id: 'mobile_games', label: 'Mobile Games', iconType: 'ionicons', iconName: 'game-controller', iconColor: '#9B59B6' },
  { id: 'twitter', label: 'Twitter (X)', iconType: 'fontawesome5', iconName: 'twitter', iconColor: '#1DA1F2' },
  { id: 'reddit', label: 'Reddit', iconType: 'fontawesome5', iconName: 'reddit-alien', iconColor: '#FF4500' },
  { id: 'discord', label: 'Discord', iconType: 'fontawesome5', iconName: 'discord', iconColor: '#5865F2' },
  { id: 'shopping', label: 'Shopping', iconType: 'materialcommunity', iconName: 'shopping', iconColor: '#F39C12' },
  { id: 'other', label: 'Other Apps', iconType: 'ionicons', iconName: 'apps', iconColor: '#95A5A6' },
];

const ICON_SIZE = 18;

function renderIcon(option: AppOption) {
  switch (option.iconType) {
    case 'fontawesome5':
      return <FontAwesome5 name={option.iconName} size={ICON_SIZE} color={option.iconColor} />;
    case 'ionicons':
      return <Ionicons name={option.iconName as any} size={ICON_SIZE} color={option.iconColor} />;
    case 'materialcommunity':
      return <MaterialCommunityIcons name={option.iconName as any} size={ICON_SIZE} color={option.iconColor} />;
  }
}

const MAX_SELECTIONS = 3;

interface AppsQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  selectedApps: string[];
  onAppsChange: (apps: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function AppsQuestionScreen({
  selectedApps,
  onAppsChange,
  onContinue,
  onBack,
}: AppsQuestionScreenProps) {
  const canContinue = selectedApps.length > 0;

  const handleOptionPress = (appId: string) => {
    if (selectedApps.includes(appId)) {
      onAppsChange(selectedApps.filter((id) => id !== appId));
    } else if (selectedApps.length < MAX_SELECTIONS) {
      onAppsChange([...selectedApps, appId]);
    } else {
      onAppsChange([...selectedApps.slice(0, -1), appId]);
    }
  };

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <View style={styles.body}>
        <LCEyebrow text="Diagnosis" step={{ current: 4, total: 5 }} />
        <LCDisplay
          lineOne="Which apps"
          lineTwo="eat you?"
          accent="two"
          size={42}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          We'll freeze these during your grinds.
        </LCBody>
        <Text style={styles.hint}>{`PICK UP TO ${MAX_SELECTIONS}`}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {APP_OPTIONS.map((option) => {
            const sel = selectedApps.includes(option.id);
            return (
              <View key={option.id} style={styles.cell}>
                <LCSelectableCard
                  title={option.label}
                  selected={sel}
                  onPress={() => handleOptionPress(option.id)}
                  layout="row"
                  icon={
                    <View style={styles.iconBox}>
                      {renderIcon(option)}
                    </View>
                  }
                />
              </View>
            );
          })}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <LCCTA label="Continue" onPress={onContinue} disabled={!canContinue} />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  hint: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: LC.textMute,
    marginTop: 10,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cell: {
    width: '49%',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: LC.bgElev,
    borderWidth: 1,
    borderColor: LC.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
