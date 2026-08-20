import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import type { MapPin } from './types';

type Props = {
  pins: MapPin[];
  onSelectPin: (pin: MapPin) => void;
};

/** Web'de react-native-maps yok — liste görünümü kullanılır. */
export function DiscoverMapView(_props: Props) {
  const { t } = useTranslation();
  const Colors = useThemeColors();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.text, { color: Colors.textMuted }]}>
        {t('map.listView')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[6] },
  text: { ...Typography.bodyMedium, textAlign: 'center' },
});
