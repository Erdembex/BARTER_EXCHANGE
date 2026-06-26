import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui';
import { Colors, Typography, Spacing } from '@/theme';

export default function BannedScreen() {
  const { signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await authService.logout();
    signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.emoji}>⛔</Text>
        <Text style={styles.title}>Hesabın askıya alındı</Text>
        <Text style={styles.text}>
          BEX hesabına erişim geçici olarak kapatıldı. Bunun bir hata olduğunu düşünüyorsan
          destek ekibiyle iletişime geç.
        </Text>
        <Button title="Çıkış Yap" variant="outline" onPress={handleLogout} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    gap: Spacing[4],
  },
  emoji: { fontSize: 56 },
  title: { ...Typography.headingLarge, color: Colors.textPrimary, textAlign: 'center' },
  text: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[4],
  },
});
