import React from 'react';
import { View, Image, Text, StyleSheet, ImageStyle } from 'react-native';
import { useTranslation } from '@/i18n';
import { Typography, useThemeColors } from '@/theme';
interface PasslaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

const WIDTH = { sm: 140, md: 200, lg: 260 } as const;
const ASPECT = 1.05;

export function PasslaLogo({ size = 'md', showTagline = false }: PasslaLogoProps) {
  const { t } = useTranslation();
  const Colors = useThemeColors();
  const width = WIDTH[size];
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/branding/passla-logo.png')}
        style={[styles.logo, { width, height: width * ASPECT }] as ImageStyle[]}
        resizeMode="contain"
        accessibilityLabel="Passla"
      />
      {showTagline ? (
        <Text style={[styles.tagline, { color: Colors.textMuted }]}>{t('passlaLogo.tagline')}</Text>
      ) : null}    </View>
  );
}

/** @deprecated PasslaLogo kullan */
export const BexLogo = PasslaLogo;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    maxWidth: '100%',
  },
  tagline: {
    ...Typography.bodySmall,
    letterSpacing: 0.2,
    textAlign: 'center',
  },});
