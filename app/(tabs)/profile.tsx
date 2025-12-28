import { BlurView } from 'expo-blur';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <BlurView intensity={20} style={styles.glassCard}>
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
