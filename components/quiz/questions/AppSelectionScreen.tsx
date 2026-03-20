import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DeviceActivitySelectionView,
  blockSelection,
} from 'react-native-device-activity';

import Button3D from '../../Button3D';
import CloudBackground from '../CloudBackground';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');
const socialImage = require('../../../assets/images/social.png');

const { width: RAW_SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(RAW_SCREEN_WIDTH, 430);

interface AppSelectionScreenProps {
  familyActivitySelection: string | null;
  onSelectionChange: (selection: string | null) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * AppSelectionScreen - Allows users to select apps to block using Apple's FamilyActivityPicker
 */
export default function AppSelectionScreen({
  familyActivitySelection,
  onSelectionChange,
  onContinue,
  onBack,
}: AppSelectionScreenProps) {
  const insets = useSafeAreaInsets();
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [tempSelection, setTempSelection] = useState<string | null>(familyActivitySelection);
  const [selectionCount, setSelectionCount] = useState({ apps: 0, categories: 0 });

  const handleOpenPicker = () => {
    setTempSelection(familyActivitySelection);
    setIsPickerVisible(true);
  };

  const handleDone = () => {
    onSelectionChange(tempSelection);
    setIsPickerVisible(false);

    // Block the selected apps
    if (tempSelection) {
      try {
        blockSelection({ activitySelectionToken: tempSelection }, 'onboardingSelection');
      } catch (error) {
        console.error('Error blocking selection:', error);
      }
    }

    // Navigate to the next screen (PaymentScreen) after modal closes
    onContinue();
  };

  const handleContinue = () => {
    // Ensure apps are blocked before continuing
    if (familyActivitySelection) {
      try {
        blockSelection({ activitySelectionToken: familyActivitySelection }, 'onboardingSelection');
      } catch (error) {
        console.error('Error blocking selection:', error);
      }
    }
    onContinue();
  };

  const hasSelection = familyActivitySelection !== null && (selectionCount.apps > 0 || selectionCount.categories > 0);

  return (
    <ImageBackground
      source={nightSkyBackground}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark overlay for better readability */}
      <View style={styles.overlay} />

      {/* Cloud/Aurora effect at top */}
      <CloudBackground height={280} />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Custom header - back button only */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={BrandColors.text.primary}
            />
          </Pressable>
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Title */}
          <Text style={styles.preTitle}>Let's set up LockIn!</Text>
          <Text style={styles.title}>
            Select your most distracting apps
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            You can always change this later in the App's settings.
          </Text>

          {/* Social Image */}
          <View style={styles.imageContainer}>
            <Image
              source={socialImage}
              style={styles.socialImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Continue button */}
        <View
          style={[
            styles.buttonContainer,
            { paddingBottom: insets.bottom + 32 },
          ]}
        >
          <Button3D
            title="Select Apps"
            onPress={handleOpenPicker}
          />
        </View>
      </View>

      {/* FamilyActivityPicker Modal */}
      <Modal
        visible={isPickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderSpacer} />
            <Text style={styles.modalTitle}>Select Apps</Text>
            <Pressable
              onPress={handleDone}
              style={({ pressed }) => [
                styles.doneButton,
                pressed && styles.doneButtonPressed,
              ]}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>

          {/* Simulator warning for developers */}
          {__DEV__ && Platform.OS === 'ios' && !Platform.isPad && (
            <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 12, fontSize: 13 }}>
              Note: App list is empty on Simulator. Test on a physical device.
            </Text>
          )}

          {/* DeviceActivitySelectionView */}
          <View style={styles.pickerContainer}>
            <DeviceActivitySelectionView
              style={styles.picker}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backButtonPressed: {
    opacity: 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  preTitle: {
    fontSize: 18,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  socialImage: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.7,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeaderSpacer: {
    width: 60,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: BrandColors.text.primary,
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneButtonPressed: {
    opacity: 0.6,
  },
  doneButtonText: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: '#007AFF',
  },
  pickerContainer: {
    flex: 1,
  },
  picker: {
    flex: 1,
  },
});
