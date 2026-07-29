import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  emoji?: string;
  onPress?: () => void;
}

export function StatCard({ label, value, emoji, onPress }: StatCardProps) {
  const content = (
    <>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  emoji: {
    fontSize: 20,
    marginBottom: Spacing[1],
  },
  value: {
    ...Typography.headingMedium,
    color: Colors.textPrimary,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
  },
});
