import { useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import ActivityHeatmap from '../../components/ActivityHeatmap';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileStore } from '../../store/useProfileStore';
import { GrindItem } from '../../lib/statsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 4;
const NUM_COLUMNS = 3;
const HORIZONTAL_PADDING = 20;
const ITEM_SIZE = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function ProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    totalHours,
    totalGrinds,
    currentStreak,
    dailyActivity,
    isLoading,
    fetchStats,
    fetchActivity,
    grinds,
    isLoadingGrinds,
    hasMoreGrinds,
    fetchGrinds,
  } = useProfileStore();

  useEffect(() => {
    if (user?.id) {
      fetchStats(user.id);
      fetchActivity(user.id);
      fetchGrinds(user.id);
    }
  }, [user?.id]);

  const handleLoadMore = () => {
    if (user?.id && hasMoreGrinds && !isLoadingGrinds) {
      fetchGrinds(user.id, true);
    }
  };

  const handleThumbnailPress = (item: GrindItem) => {
    router.push({
      pathname: '/preview',
      params: {
        videoUri: item.video_url,
        grindDurationSeconds: String(Math.floor((item.duration_ms || 0) / 1000)),
        isFromGallery: 'true',
      },
    });
  };

  const renderThumbnail = ({ item, index }: { item: GrindItem; index: number }) => {
    const isLeftColumn = index % NUM_COLUMNS === 0;
    const isRightColumn = index % NUM_COLUMNS === NUM_COLUMNS - 1;

    return (
      <TouchableOpacity
        onPress={() => handleThumbnailPress(item)}
        style={[
          styles.thumbnailContainer,
          { marginLeft: isLeftColumn ? 0 : GRID_GAP / 2 },
          { marginRight: isRightColumn ? 0 : GRID_GAP / 2 },
        ]}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.thumbnail_url || item.video_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingGrinds) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#fa576a" />
      </View>
    );
  };

  const renderEmptyGallery = () => {
    if (isLoadingGrinds) return null;
    return (
      <View style={styles.emptyGallery}>
        <Text style={styles.emptyGalleryText}>No grinds yet</Text>
        <Text style={styles.emptyGallerySubtext}>Start recording to see your grinds here</Text>
      </View>
    );
  };

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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

      {/* Gallery Grid */}
      <View style={styles.galleryContainer}>
        <FlatList
          data={grinds}
          renderItem={renderThumbnail}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyGallery}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.galleryContent}
          columnWrapperStyle={styles.galleryRow}
        />
      </View>
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
    fontWeight: 'bold',
    color: '#fa576a',
  },
  infoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 13,
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
  thumbnailContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
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
    fontWeight: '500',
  },
  emptyGallerySubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    marginTop: 4,
  },
});
