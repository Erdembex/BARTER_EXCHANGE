import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Typography, Spacing, createThemedStyles, useThemeColors } from '@/theme';

interface BackHeaderProps {
  title: string;
}

export function BackHeader({ title }: BackHeaderProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <Text style={styles.backText}>← Geri</Text>
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[2],
  },
  backBtn: { paddingVertical: Spacing[1] },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingSmall, color: Colors.textPrimary, flex: 1 },
}));
