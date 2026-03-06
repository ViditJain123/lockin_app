import React from 'react';
import { Modal, View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../constants/Fonts';

interface Props {
  visible: boolean;
  videoUri: string;
  onClose: () => void;
}

export default function TimelapsePreviewSheet({ visible, videoUri, onClose }: Props) {
  const handleShare = async () => {
    try {
      await shareAsync(videoUri);
    } catch {
      Alert.alert('Error', 'Could not share the video.');
    }
  };

  const handleSave = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save videos.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(videoUri);
      Alert.alert('Saved', 'Video saved to your gallery.');
    } catch {
      Alert.alert('Error', 'Could not save the video.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>

        <Video
          source={{ uri: videoUri }}
          style={styles.video}
          isLooping
          shouldPlay={visible}
          resizeMode={ResizeMode.CONTAIN}
        />

        <View style={styles.buttonRow}>
          <Pressable style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#FFFFFF" />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleSave}>
            <Ionicons name="download-outline" size={22} color="#FFFFFF" />
            <Text style={styles.actionText}>Save to Gallery</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
});
