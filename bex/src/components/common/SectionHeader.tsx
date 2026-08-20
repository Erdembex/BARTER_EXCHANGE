import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Typography, Spacing, createThemedStyles, useThemeColors } from '../../theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  title: {
    ...Typography.headingSmall,
    color: Colors.textPrimary,
  },
  action: {
    ...Typography.labelMedium,
    color: Colors.primary,
  },
}));
