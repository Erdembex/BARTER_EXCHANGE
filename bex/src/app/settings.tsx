import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/authService';
import { isAuthEmulatorActive } from '@/lib/firebase';
import { API_BASE_URL } from '@/lib/api/config';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { Button } from '@/components/ui';
import { Colors, Typography, Spacing } from '@/theme';

export default function SettingsScreen() {
  const { bexUser, firebaseUser, setBexUser, signOut } = useAuthStore();
  const { reachable } = useBackendHealth();

  useFocusEffect(
    useCallback(() => {
      if (!firebaseUser) return;
      authService
        .getUserDocument(firebaseUser.uid, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        })
        .then(setBexUser);
    }, [firebaseUser, setBexUser])
  );

  const handleLogout = async () => {
    await authService.logout();
    signOut();
    router.replace('/(auth)/onboarding');
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Hesap Ayarları</Text>

        <AccountSettings
          bexUser={bexUser}
          onUserUpdated={setBexUser}
          showAdminLink={bexUser?.role === 'admin'}
        />

        <Button
          title="Expo Test Rehberi"
          variant="primary"
          onPress={() => router.push('/expo-test-guide' as Href)}
        />

        <Button
          title="Yayın Checklist"
          variant="outline"
          onPress={() => router.push('/setup-guide' as Href)}
        />

        <Button title="Çıkış Yap" variant="outline" onPress={handleLogout} />

        <View style={styles.meta}>
          <Text style={styles.metaText}>BEX v{appVersion}</Text>
          {__DEV__ && (
            <>
              <Text style={styles.metaText}>
                {isAuthEmulatorActive() ? 'Emulator · demo veri' : 'REST · canlı API'}
              </Text>
              <Text style={styles.metaText}>API: {API_BASE_URL}</Text>
              {!isAuthEmulatorActive() && reachable !== null ? (
                <Text style={styles.metaText}>
                  Sunucu: {reachable ? 'erişilebilir' : 'ulaşılamıyor'}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing[5],
    paddingBottom: Spacing[10],
    alignItems: 'center',
    gap: Spacing[4],
  },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: {
    ...Typography.headingLarge,
    color: Colors.textPrimary,
    alignSelf: 'flex-start',
  },
  meta: { alignItems: 'center', gap: Spacing[1], marginTop: Spacing[2] },
  metaText: { ...Typography.caption, color: Colors.textTertiary },
});
