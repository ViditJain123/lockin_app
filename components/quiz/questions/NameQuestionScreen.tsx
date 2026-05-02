import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import LCBody from '../lc/LCBody';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface NameQuestionScreenProps {
  currentStep: number;
  totalSteps: number;
  name: string;
  onNameChange: (name: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function NameQuestionScreen({
  name,
  onNameChange,
  onContinue,
  onBack,
}: NameQuestionScreenProps) {
  const isValidName = name.trim().length > 0;
  const inputRef = React.useRef<TextInput>(null);
  const [focused, setFocused] = React.useState(false);

  const handleContinue = () => {
    if (!isValidName) return;
    Keyboard.dismiss();
    onContinue();
  };

  return (
    <LCFrame glow="top">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          <LCHeader onBack={onBack} />

          <View style={styles.body}>
            <LCEyebrow text="Intro" />
            <LCDisplay
              lineOne="What do we"
              lineTwo="call you?"
              accent="two"
              size={44}
              style={{ marginTop: 10 }}
            />
            <LCBody style={{ marginTop: 10 }}>
              First things first — we'll personalize the receipts.
            </LCBody>

            <View style={{ marginTop: 36 }}>
              <Text style={styles.inputLabel}>FIRST NAME</Text>
              <Pressable onPress={() => inputRef.current?.focus()}>
                <View
                  style={[
                    styles.inputWrap,
                    focused && { borderColor: LC.red },
                  ]}
                >
                  <TextInput
                    ref={inputRef}
                    value={name}
                    onChangeText={onNameChange}
                    placeholder="TYPE HERE"
                    placeholderTextColor={LC.textMute}
                    autoFocus
                    autoCapitalize="words"
                    autoCorrect={false}
                    selectionColor={LC.red}
                    style={styles.input}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onSubmitEditing={handleContinue}
                    returnKeyType="next"
                  />
                </View>
              </Pressable>
            </View>
          </View>

          <LCCTA
            label="Lock it in"
            onPress={handleContinue}
            disabled={!isValidName}
          />
        </Pressable>
      </KeyboardAvoidingView>
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  inputLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: LC.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LC.border,
    paddingHorizontal: 18,
  },
  input: {
    fontFamily: Fonts.display,
    fontSize: 34,
    letterSpacing: 1,
    color: LC.text,
    paddingVertical: 18,
  },
});
