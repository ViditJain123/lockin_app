import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ThumbnailItem from '../../components/ThumbnailItem';
import { Fonts } from '../../constants/Fonts';
import { useAuth } from '../../contexts/AuthContext';
import { LocalVideo } from '../../lib/videoStorageService';
import { useProfileStore } from '../../store/useProfileStore';
import { useVideoStore } from '../../store/useVideoStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 4;
const NUM_COLUMNS = 3;
const HORIZONTAL_PADDING = 20;
const ITEM_SIZE = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const PLACEHOLDER_COUNT = 9;

// Placeholder item component with shimmer effect
function PlaceholderItem({ index, shimmerAnim }: { index: number; shimmerAnim: Animated.Value }) {
  const isLeftColumn = index % NUM_COLUMNS === 0;
  const isRightColumn = index % NUM_COLUMNS === NUM_COLUMNS - 1;

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View
      style={[
        styles.placeholderContainer,
        {
          width: ITEM_SIZE,
          height: ITEM_SIZE * 1.3,
          marginLeft: isLeftColumn ? 0 : GRID_GAP / 2,
          marginRight: isRightColumn ? 0 : GRID_GAP / 2,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.placeholderShimmer,
          { opacity: shimmerOpacity },
        ]}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Profile stats
  const {
    totalHours,
    totalGrinds,
    currentStreak,
    isLoading,
    fetchStats,
    refreshAll,
  } = useProfileStore();

  // Local videos
  const {
    videos,
    isLoading: isLoadingVideos,
    isInitialized,
    loadVideos,
    refreshVideos,
  } = useVideoStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Shimmer animation for placeholders
  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, [shimmerAnim]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchStats(user.id);
    }
    loadVideos();
  }, [user?.id]);

  // Refresh data when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        refreshAll(user.id);
      }
      refreshVideos();
    }, [user?.id, refreshAll, refreshVideos])
  );

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      user?.id ? refreshAll(user.id) : Promise.resolve(),
      refreshVideos(),
    ]);
    setIsRefreshing(false);
  }, [user?.id, refreshAll, refreshVideos]);

  const handleThumbnailPress = (item: LocalVideo) => {
    router.push({
      pathname: '/preview',
      params: {
        videoUri: item.videoPath,
        grindDurationSeconds: String(item.durationSeconds),
        isFromGallery: 'true',
        videoId: item.id,
      },
    });
  };

  const renderThumbnail = ({ item, index }: { item: LocalVideo; index: number }) => {
    const isLeftColumn = index % NUM_COLUMNS === 0;
    const isRightColumn = index % NUM_COLUMNS === NUM_COLUMNS - 1;

    return (
      <ThumbnailItem
        thumbnailUrl={item.thumbnailPath}
        videoUrl={item.videoPath}
        size={ITEM_SIZE}
        onPress={() => handleThumbnailPress(item)}
        marginLeft={isLeftColumn ? 0 : GRID_GAP / 2}
        marginRight={isRightColumn ? 0 : GRID_GAP / 2}
      />
    );
  };

  const renderFooter = () => {
    if (!isLoadingVideos || videos.length === 0) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#FF3B5C" />
      </View>
    );
  };

  const renderEmptyGallery = () => {
    if (!isInitialized || isLoadingVideos) return null;
    return (
      <View style={styles.emptyGallery}>
        <Text style={styles.emptyGalleryText}>No grinds yet</Text>
        <Text style={styles.emptyGallerySubtext}>Start recording to see your grinds here</Text>
      </View>
    );
  };

  // Render placeholder grid while initial data is loading
  const renderPlaceholderGrid = () => {
    const placeholders = Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => i);
    const rows: number[][] = [];
    for (let i = 0; i < placeholders.length; i += NUM_COLUMNS) {
      rows.push(placeholders.slice(i, i + NUM_COLUMNS));
    }

    return (
      <View style={styles.placeholderGrid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.galleryRow}>
            {row.map((index) => (
              <PlaceholderItem key={index} index={index} shimmerAnim={shimmerAnim} />
            ))}
          </View>
        ))}
      </View>
    );
  };

  const showPlaceholderGrid = !isInitialized || (isLoadingVideos && videos.length === 0);

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return minutes.toString();
    }
    return hours.toFixed(1);
  };

  const getHoursLabel = (hours: number): string => {
    if (hours < 1) {
      return 'minutes';
    }
    return 'hours';
  };

  // Header component that scrolls with the content (Instagram-style)
  const renderListHeader = () => (
    <>
      {/* Top Row with Pro and Settings buttons */}
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() => router.push('/paywall')}
          style={styles.proButton}
        >
          <Ionicons name="star" size={14} color="#FF3B5C" />
          <Text style={styles.proButtonText}>PRO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/settings-page')}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Profile Header Section */}
      <View style={styles.headerSection}>
        {/* Centered Avatar with Streak Badge */}
        <View style={styles.avatarContainer}>
          {user?.user_metadata?.avatar_url ? (
            <Image
              source={{ uri: user.user_metadata.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {user?.user_metadata?.full_name?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          {/* Streak Badge Overlay */}
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakBadgeText}>
              {isLoading ? '-' : currentStreak}
            </Text>
          </View>
        </View>

        {/* Centered User Name */}
        <Text style={styles.userName} numberOfLines={1}>
          {user?.user_metadata?.full_name || 'User'}
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {isLoading ? '-' : formatHours(totalHours)}
            </Text>
            <Text style={styles.statLabel}>{getHoursLabel(totalHours)}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {isLoading ? '-' : totalGrinds}
            </Text>
            <Text style={styles.statLabel}>grinds</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {isLoading ? '-' : currentStreak}
            </Text>
            <Text style={styles.statLabel}>streak</Text>
          </View>
        </View>
      </View>

    </>
  );

  // When showing placeholder grid, we need to render the full layout with header
  if (showPlaceholderGrid) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {renderListHeader()}
        <View style={styles.galleryContainer}>
          {renderPlaceholderGrid()}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={videos}
        renderItem={renderThumbnail}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyGallery}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.galleryContent}
        columnWrapperStyle={videos.length >= NUM_COLUMNS ? styles.galleryRow : undefined}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FF3B5C"
            colors={['#FF3B5C']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  proButtonText: {
    color: '#FF3B5C',
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  settingsButton: {
    padding: 4,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#FF3B5C',
  },
  streakBadge: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  streakIcon: {
    fontSize: 14,
  },
  streakBadgeText: {
    color: 'white',
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginLeft: 4,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 59, 92, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: '#FF3B5C',
  },
  userName: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: 'white',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  galleryContainer: {
    flex: 1,
  },
  galleryContent: {
    paddingBottom: 20,
  },
  galleryRow: {
    marginBottom: GRID_GAP,
  },
  placeholderContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  placeholderShimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
  },
  placeholderGrid: {
    paddingBottom: 20,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyGallery: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyGalleryText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  emptyGallerySubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
});
