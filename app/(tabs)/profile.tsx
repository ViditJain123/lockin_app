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
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActivityHeatmap from '../../components/ActivityHeatmap';
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
    dailyActivity,
    isLoading,
    fetchStats,
    fetchActivity,
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
      fetchActivity(user.id);
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
        <ActivityIndicator size="small" color="#fa576a" />
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
      {/* Profile Header Section */}
      <View style={styles.headerSection}>
        {/* Avatar on the left */}
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
        </View>

        {/* Name and Stats on the right */}
        <View style={styles.infoContainer}>
          {/* User Name */}
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
      </View>

      {/* Activity Heatmap */}
      <View style={styles.heatmapContainer}>
        <ActivityHeatmap data={dailyActivity} />
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
            tintColor="#fa576a"
            colors={['#fa576a']}
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
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#fa576a',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(250, 87, 106, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 36,
    fontFamily: Fonts.bold,
    color: '#fa576a',
  },
  infoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: 'white',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: 'white',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  heatmapContainer: {
    marginBottom: 20,
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
