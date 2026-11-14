import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';
import { optionSelect } from '@/lib/haptics';
import { useAvatarStore } from '@/store/useAvatarStore';

import InitialsAvatar from './InitialsAvatar';
import MascotAvatar, { MASCOT_VARIANTS, mascotVariantFor } from './MascotAvatar';

const PICK_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

/** Bottom sheet for changing your profile picture: photo, camera or a mascot colour */
export default function AvatarEditSheet({ visible, onClose, userId }: { visible: boolean; onClose: () => void; userId: string }) {
  const insets = useSafeAreaInsets();
  const photoUri = useAvatarStore((s) => s.photoUri);
  const variant = useAvatarStore((s) => s.variant);
  const setPhoto = useAvatarStore((s) => s.setPhoto);
  const setVariant = useAvatarStore((s) => s.setVariant);
  const removePhoto = useAvatarStore((s) => s.removePhoto);
  const current = variant ?? mascotVariantFor(userId);

  const pick = async (fromCamera: boolean) => {
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', fromCamera ? 'Allow camera access to take a photo.' : 'Allow photo access to pick a picture.');
        return;
      }
      const res = fromCamera ? await ImagePicker.launchCameraAsync(PICK_OPTIONS) : await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS);
      if (res.canceled || !res.assets?.[0]?.uri) return;
      await setPhoto(res.assets[0].uri);
      onClose();
    } catch (err) {
      console.warn('[Avatar] pick failed', err);
      Alert.alert('Could not load that photo', 'Try another one.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) + 6 }]}>
          <View style={styles.grabber} />
          <View style={styles.previewRow}>
            <InitialsAvatar id={userId} size={72} isMe />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Profile picture</Text>
              <Text style={styles.sub}>Use a photo, or keep a Lockin mascot.</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={() => pick(false)} style={({ pressed }) => [styles.action, pressed && styles.pressed]} accessibilityRole="button">
              <Ionicons name="images-outline" size={20} color={T.ink} />
              <Text style={styles.actionText}>Choose photo</Text>
            </Pressable>
            <Pressable onPress={() => pick(true)} style={({ pressed }) => [styles.action, pressed && styles.pressed]} accessibilityRole="button">
              <Ionicons name="camera-outline" size={20} color={T.ink} />
              <Text style={styles.actionText}>Take photo</Text>
            </Pressable>
          </View>

          <Text style={styles.section}>MASCOT</Text>
          <View style={styles.swatches}>
            {MASCOT_VARIANTS.map((v, i) => {
              const selected = !photoUri && i === current;
              return (
                <Pressable
                  key={v.name}
                  onPress={() => {
                    optionSelect();
                    setVariant(i);
                  }}
                  style={[styles.swatch, selected && styles.swatchOn]}
                  accessibilityRole="button"
                  accessibilityLabel={`${v.name} mascot`}
                  accessibilityState={{ selected }}
                >
                  <MascotAvatar size={52} variant={i} />
                </Pressable>
              );
            })}
          </View>

          {photoUri ? (
            <Pressable onPress={() => removePhoto()} style={styles.remove} accessibilityRole="button">
              <Text style={styles.removeText}>Remove photo</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontFamily: Fonts.bold, fontSize: 20, color: T.ink },
  sub: { marginTop: 2, fontFamily: Fonts.medium, fontSize: 13, color: T.inkMute },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  action: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.cardHi,
    borderWidth: 1,
    borderColor: T.line,
  },
  actionText: { fontFamily: Fonts.bold, fontSize: 14, color: T.ink },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  section: { marginTop: 22, marginBottom: 10, fontFamily: Fonts.monoMedium, fontSize: 10, letterSpacing: 1.6, color: T.inkMute },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { padding: 3, borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: T.orange },
  remove: { marginTop: 18, alignSelf: 'center', padding: 8 },
  removeText: { fontFamily: Fonts.bold, fontSize: 14, color: '#FF5A4E' },
});
