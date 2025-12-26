import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePlacement, useUser } from 'expo-superwall';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { subscriptionStatus } = useUser();

  const isSubscribed = subscriptionStatus?.status === 'ACTIVE';

  const { registerPlacement, state: placementState } = usePlacement({
    onPresent: (paywallInfo) => {
      console.log('[Profile] Paywall presented:', paywallInfo.name);
    },
    onDismiss: (paywallInfo, result) => {
      console.log('[Profile] Paywall dismissed:', result?.type);
    },
    onError: (error) => {
      console.error('[Profile] Paywall error:', error);
    },
  });

  const handleUnlockPress = async () => {
    // Register the profile_access placement
    // This should be configured as Gated in Superwall dashboard
    await registerPlacement({
      placement: 'profile_access',
      feature: () => {
        // This only runs if user is subscribed or just purchased
        console.log('[Profile] Profile access granted');
      },
    });
  };

  // Show locked state if not subscribed
  if (!isSubscribed) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <BlurView intensity={20} style={styles.glassCard}>
          {/* Lock Icon */}
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={48} color="#fa576a" />
          </View>

          <Text style={styles.lockedTitle}>Profile Locked</Text>
          <Text style={styles.lockedDescription}>
            Subscribe to unlock your profile and access premium features
          </Text>
        </BlurView>

        {/* Unlock Button */}
        <Pressable
          style={({ pressed }) => [
            styles.unlockButton,
            pressed && styles.unlockButtonPressed,
            placementState.status === 'presenting' && styles.unlockButtonDisabled,
          ]}
          onPress={handleUnlockPress}
          disabled={placementState.status === 'presenting'}
        >
          <Ionicons name="sparkles" size={20} color="#000000" />
          <Text style={styles.unlockText}>
            {placementState.status === 'presenting' ? 'Loading...' : 'Unlock Profile'}
          </Text>
        </Pressable>

        {/* Sign Out Button - always available */}
        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.signOutButtonPressed,
          ]}
          onPress={signOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  // Show full profile when subscribed
  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <BlurView intensity={20} style={styles.glassCard}>
        {/* Pro Badge */}
        <View style={styles.proBadge}>
          <Ionicons name="sparkles" size={12} color="#000000" />
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>

        {/* User Avatar */}
        {user?.user_metadata?.avatar_url && (
          <Image
            source={{ uri: user.user_metadata.avatar_url }}
            style={styles.avatar}
          />
        )}

        {/* User Info */}
        <Text style={styles.title}>Profile</Text>
        {user?.email && (
          <Text style={styles.email}>{user.email}</Text>
        )}
        {user?.user_metadata?.full_name && (
          <Text style={styles.name}>{user.user_metadata.full_name}</Text>
        )}
      </BlurView>

      {/* Sign Out Button */}
      <Pressable
        style={({ pressed }) => [
          styles.signOutButton,
          pressed && styles.signOutButtonPressed,
        ]}
        onPress={signOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  glassCard: {
    padding: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(250, 87, 106, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  lockedDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fa576a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fa576a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  name: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fa576a',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  unlockButtonPressed: {
    backgroundColor: '#e04d5d',
  },
  unlockButtonDisabled: {
    opacity: 0.7,
  },
  unlockText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  signOutButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fa576a',
    width: '100%',
    alignItems: 'center',
  },
  signOutButtonPressed: {
    backgroundColor: 'rgba(250, 87, 106, 0.2)',
  },
  signOutText: {
    color: '#fa576a',
    fontSize: 16,
    fontWeight: '600',
  },
});
