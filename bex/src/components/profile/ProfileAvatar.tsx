import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/theme';
import { resolveMediaUrl } from '@/lib/mediaUrl';

interface ProfileAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
  onPress?: () => void;
  editable?: boolean;
  loading?: boolean;
}

export function ProfileAvatar({
  name,
  avatarUrl,
  size = 48,
  onPress,
  editable = false,
  loading = false,
}: ProfileAvatarProps) {
  const initial = (name ?? '?').charAt(0).toUpperCase();
  const radius = size / 2;
  const resolvedAvatarUrl = avatarUrl ? resolveMediaUrl(avatarUrl) : null;

  const avatarContent = loading ? (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: radius }]}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  ) : resolvedAvatarUrl ? (
    <Image
      source={{ uri: resolvedAvatarUrl }}
      style={{ width: size, height: size, borderRadius: radius }}
    />
  ) : (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.initial, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );

  if (!onPress) {
    return avatarContent;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={loading}
      style={editable ? { position: 'relative' } : undefined}
    >
      {avatarContent}
      {editable && !loading ? (
        <View style={[styles.editBadge, { right: 0, bottom: 0 }]}>
          <Text style={styles.editIcon}>✎</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  initial: {
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  editBadge: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  editIcon: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
