import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '@/hooks/useNetwork';
import { Typography, Spacing, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetwork();
  const Colors = useThemeColors();
  const { t } = useTranslation();

  if (isConnected) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + Spacing[2], backgroundColor: Colors.error }]}>
      <Text style={styles.text}>{t('banners.offline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: Spacing[3],
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
  },
  text: {
    ...Typography.labelMedium,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
