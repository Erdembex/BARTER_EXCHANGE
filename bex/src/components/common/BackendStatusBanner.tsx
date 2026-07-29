import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '@/lib/api/config';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { useNetwork } from '@/hooks/useNetwork';
import { Colors, Typography, Spacing } from '@/theme';

export function BackendStatusBanner() {
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetwork();
  const { reachable, checking, refresh, skip } = useBackendHealth();

  if (skip || !isConnected || reachable === null || reachable) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + Spacing[2] }]}>
      <Text style={styles.text}>Sunucuya ulaşılamıyor — {API_BASE_URL}</Text>
      <Text style={styles.hint}>
        Backend kapalıysa giriş ve görevler çalışmaz. Aynı Wi‑Fi ve doğru IP’yi kontrol et.
      </Text>
      <TouchableOpacity onPress={refresh} disabled={checking} style={styles.retry}>
        <Text style={styles.retryText}>{checking ? 'Kontrol ediliyor…' : 'Tekrar dene'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    backgroundColor: '#B45309',
    paddingBottom: Spacing[3],
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
    gap: Spacing[1],
  },
  text: {
    ...Typography.labelMedium,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  hint: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 16,
  },
  retry: {
    marginTop: Spacing[1],
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[3],
  },
  retryText: {
    ...Typography.labelMedium,
    color: Colors.textInverse,
    textDecorationLine: 'underline',
  },
});
