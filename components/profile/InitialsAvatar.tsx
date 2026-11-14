import React from 'react';
import { Image, StyleSheet } from 'react-native';

import { useAvatarStore } from '@/store/useAvatarStore';

import MascotAvatar, { mascotVariantFor } from './MascotAvatar';

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Round avatar: a photo if there is one, otherwise the mascot in a muted
 * colour picked from the id. Pass `isMe` to use your own saved picture.
 */
export default function InitialsAvatar({
  id,
  size,
  uri,
  variant,
  isMe,
}: {
  id: string;
  name?: string;
  size: number;
  uri?: string | null;
  variant?: number | null;
  isMe?: boolean;
}) {
  const myPhoto = useAvatarStore((s) => s.photoUri);
  const myVariant = useAvatarStore((s) => s.variant);
  const photo = isMe ? myPhoto ?? uri : uri;
  const v = isMe ? myVariant ?? variant : variant;

  if (photo) return <Image source={{ uri: photo }} style={[{ width: size, height: size, borderRadius: size / 2 }, styles.img]} />;
  return <MascotAvatar size={size} variant={v ?? mascotVariantFor(id)} />;
}

const styles = StyleSheet.create({
  img: {
    backgroundColor: '#242424',
  },
});
