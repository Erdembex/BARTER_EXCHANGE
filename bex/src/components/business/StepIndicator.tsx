import React from 'react';
import { View, Text } from 'react-native';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  return (
    <View style={styles.container}>
      {steps.map((label, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;
        return (
          <View key={label} style={styles.step}>
            <View
              style={[
                styles.dot,
                isDone && styles.dotDone,
                isActive && styles.dotActive,
              ]}
            >
              <Text style={[styles.dotText, (isDone || isActive) && styles.dotTextActive]}>
                {index + 1}
              </Text>
            </View>
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[6],
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing[1],
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
  dotDone: {
    backgroundColor: Colors.primaryDark,
  },
  dotText: {
    ...Typography.labelMedium,
    color: Colors.textTertiary,
    fontSize: 12,
  },
  dotTextActive: {
    color: Colors.textOnPrimary,
  },
  label: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
}));
