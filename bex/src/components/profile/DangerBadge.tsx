import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface DangerBadgeProps {
  compact?: boolean;
  label?: string;
}

export function DangerBadge({ compact = false, label = 'Tehlikeli' }: DangerBadgeProps) {
  return (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <Text style={[styles.text, compact && styles.textCompact]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeCompact: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
  },
  text: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  textCompact: {
    fontSize: 10,
  },
});
