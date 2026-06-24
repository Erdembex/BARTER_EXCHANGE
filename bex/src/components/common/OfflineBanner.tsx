import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '@/hooks/useNetwork';
import { Colors, Typography, Spacing } from '@/theme';

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetwork();

  if (isConnected) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + Spacing[2] }]}>
      <Text style={styles.text}>İnternet bağlantısı yok — çevrimdışı moddasın</Text>
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
    backgroundColor: Colors.error,
    paddingBottom: Spacing[3],
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
  },
  text: {
    ...Typography.labelMedium,
    color: Colors.textInverse,
    textAlign: 'center',
  },
});
