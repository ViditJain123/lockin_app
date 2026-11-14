import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';
import { FOCUS_SOUNDS, playFocusSound, stopFocusSound, type FocusSoundId } from '@/lib/focusSound';
import { optionSelect } from '@/lib/haptics';
import { usePrefsStore } from '@/store/usePrefsStore';

/**
 * Glass pill showing the current background sound; tap to pick one.
 * While a session is live the choice plays right away. Before it starts,
 * the sheet plays a preview that stops when you close it.
 */
export default function FocusSoundPicker({ sessionActive }: { sessionActive: boolean }) {
  const insets = useSafeAreaInsets();
  const focusSound = usePrefsStore((s) => s.focusSound);
  const setFocusSound = usePrefsStore((s) => s.setFocusSound);
  const [open, setOpen] = useState(false);
  const current = FOCUS_SOUNDS.find((x) => x.id === focusSound) ?? FOCUS_SOUNDS[0];
  const on = focusSound !== 'off';

  const choose = (id: FocusSoundId) => {
    optionSelect();
    setFocusSound(id);
    playFocusSound(id);
  };

  const close = () => {
    setOpen(false);
    // Preview only: the session starts the sound for real
    if (!sessionActive) stopFocusSound();
  };

  return (
    <>
      <Pressable
        onPress={() => {
          optionSelect();
          setOpen(true);
        }}
        style={({ pressed }) => [styles.pill, on && styles.pillOn, pressed && { transform: [{ scale: 0.96 }] }]}
        accessibilityRole="button"
        accessibilityLabel={`Background sound: ${current.label}`}
      >
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <Ionicons name={on ? 'musical-notes' : 'musical-notes-outline'} size={14} color={on ? T.orange : T.inkSoft} />
        <Text style={[styles.pillText, on && { color: T.white }]}>{on ? current.label : 'Add sound'}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) + 6 }]}>
            <View style={styles.grabber} />
            <Text style={styles.title}>Focus sound</Text>
            <Text style={styles.sub}>Plays on a loop while you're locked in.</Text>
            <View style={styles.grid}>
              {FOCUS_SOUNDS.map((x) => {
                const sel = x.id === focusSound;
                return (
                  <Pressable
                    key={x.id}
                    onPress={() => choose(x.id)}
                    style={({ pressed }) => [styles.card, sel && styles.cardOn, pressed && { opacity: 0.85 }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: sel }}
                  >
                    <View style={[styles.icon, sel && styles.iconOn]}>
                      <Ionicons name={x.icon as any} size={18} color={sel ? T.white : T.inkSoft} />
                    </View>
                    <Text style={styles.cardTitle}>{x.label}</Text>
                    <Text style={styles.cardNote}>{x.note}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={close} style={styles.done} accessibilityRole="button">
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: 'rgba(14,14,14,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  pillOn: {
    borderColor: 'rgba(255,102,0,0.55)',
  },
  pillText: {
    fontFamily: Fonts.bold,
    fontSize: 12.5,
    color: T.inkSoft,
  },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: T.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: T.line,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: T.lineStrong, marginBottom: 16 },
  title: { fontFamily: Fonts.bold, fontSize: 20, color: T.ink },
  sub: { marginTop: 2, fontFamily: Fonts.medium, fontSize: 13, color: T.inkMute },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  card: {
    width: '48.4%',
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.cardHi,
    borderWidth: 1,
    borderColor: T.line,
  },
  cardOn: { borderColor: T.orange, backgroundColor: 'rgba(255,102,0,0.10)' },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.sunk,
    marginBottom: 10,
  },
  iconOn: { backgroundColor: T.orange },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 14.5, color: T.ink },
  cardNote: { marginTop: 2, fontFamily: Fonts.medium, fontSize: 12, color: T.inkMute },
  done: {
    marginTop: 18,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.orange,
  },
  doneText: { fontFamily: Fonts.bold, fontSize: 15, color: T.white },
});
