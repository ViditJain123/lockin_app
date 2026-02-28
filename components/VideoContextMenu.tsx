import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Fonts } from '../constants/Fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH * 0.55;
const PREVIEW_HEIGHT = PREVIEW_WIDTH * 1.3;

interface VideoContextMenuProps {
  visible: boolean;
  thumbnailUrl: string | null;
  videoUrl: string;
  durationSeconds?: number;
  onClose: () => void;
  onShare: () => void;
  onSave: () => void;
  onDelete: () => void;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

const ACTIONS = [
  { key: 'share', label: 'Share', icon: 'share-outline' as const, color: '#FFFFFF' },
  { key: 'save', label: 'Save to Device', icon: 'download-outline' as const, color: '#FFFFFF' },
  { key: 'delete', label: 'Delete', icon: 'trash-outline' as const, color: '#FF3B5C' },
];

export default function VideoContextMenu({
  visible,
  thumbnailUrl,
  videoUrl,
  durationSeconds,
  onClose,
  onShare,
  onSave,
  onDelete,
}: VideoContextMenuProps) {
  const imageUri = thumbnailUrl || videoUrl;

  const handleAction = (key: string) => {
    if (key === 'share') onShare();
    else if (key === 'save') onSave();
    else if (key === 'delete') onDelete();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>

      <View style={styles.centeredContent} pointerEvents="box-none">
        <Animated.View entering={FadeIn.duration(200)} style={styles.menuContainer}>
          {/* Thumbnail preview */}
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            {durationSeconds !== undefined && (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{formatDuration(durationSeconds)}</Text>
              </View>
            )}
          </View>

          {/* Action list */}
          <View style={styles.actionList}>
            {ACTIONS.map((action, index) => (
              <React.Fragment key={action.key}>
                {index > 0 && <View style={styles.separator} />}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => handleAction(action.key)}
                  activeOpacity={0.6}
                >
                  <Ionicons name={action.icon} size={20} color={action.color} />
                  <Text style={[styles.actionLabel, { color: action.color }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    alignItems: 'center',
  },
  previewContainer: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  actionList: {
    width: PREVIEW_WIDTH + 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
  },
});
