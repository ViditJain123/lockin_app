import React from 'react';
import { Modal, View, Pressable, Text, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Fonts } from '../constants/Fonts';

interface Props {
  visible: boolean;
  videoUri: string;
  onClose: () => void;
}

export default function TimelapsePreviewSheet({ visible, videoUri, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            useNativeControls
            isLooping
            shouldPlay={visible}
            resizeMode={ResizeMode.CONTAIN}
          />
          <Pressable style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  doneButton: {
    marginTop: 16,
    backgroundColor: '#FF3B5C',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
});
