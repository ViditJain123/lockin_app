import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '../../constants/BrandColors';
import { Fonts } from '../../constants/Fonts';

interface ReviewCardProps {
  name: string;
  username: string;
  avatarUrl: string;
  text: string;
  rating?: number;
}

/**
 * ReviewCard - Displays a user review with avatar, name, rating, and text
 * Used in the SocialProofScreen to show testimonials
 */
export default function ReviewCard({
  name,
  username,
  avatarUrl,
  text,
  rating = 5,
}: ReviewCardProps) {
  return (
    <View style={styles.container}>
      {/* Header with avatar, name, and stars */}
      <View style={styles.header}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.username}>{username}</Text>
        </View>
        <View style={styles.stars}>
          {Array.from({ length: rating }).map((_, index) => (
            <Ionicons key={index} name="star" size={16} color="#FFD700" />
          ))}
        </View>
      </View>

      {/* Review text */}
      <Text style={styles.reviewText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandColors.background.card,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: BrandColors.text.primary,
  },
  username: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: BrandColors.text.muted,
    marginTop: 2,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    lineHeight: 22,
  },
});
