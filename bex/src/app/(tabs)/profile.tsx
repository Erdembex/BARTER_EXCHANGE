import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/authService';
import { usersRepository } from '@/features/data';
import { isAuthEmulatorActive } from '@/lib/firebase';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { UserPortfolioGallery } from '@/components/profile/UserPortfolioGallery';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button } from '@/components/ui';
import { PortfolioItem } from '@/types';
import { Colors, Typography, Spacing } from '@/theme';

export default function ProfileScreen() {
  const { bexUser, firebaseUser, setBexUser, signOut } = useAuthStore();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!firebaseUser) return;
      authService
        .getUserDocument(firebaseUser.uid, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        })
        .then(async (user) => {
          if (!user) return;

          if (user.role === 'user') {
            const stats = await usersRepository.getMyPublicProfileStats();
            if (stats) {
              user = {
                ...user,
                displayName: stats.displayName || user.displayName,
                completedTaskCount: stats.completedTaskCount,
                portfolioItems: stats.portfolio,
              };
              setPortfolio(stats.portfolio);
            } else {
              setPortfolio(await usersRepository.getPortfolio(firebaseUser.uid));
            }
          } else {
            setPortfolio([]);
          }

          setBexUser(user);
        });
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
      <AppHeader title="Profil" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <AccountSettings
          bexUser={bexUser}
          onUserUpdated={setBexUser}
          showAdminLink
        />

        {bexUser?.role === 'user' ? (
          <UserPortfolioGallery
            items={portfolio}
            emptyText="Admin onaylı teslim görsellerin burada görünür. Görev teslim edip onay aldıkça portföyün büyür."
          />
        ) : null}

        <Button
          title="Yayın Checklist"
          variant="outline"
          onPress={() => router.push('/setup-guide' as Href)}
        />

        <Button title="Çıkış Yap" variant="outline" onPress={handleLogout} />

        <View style={styles.meta}>
          <Text style={styles.metaText}>BEX v{appVersion}</Text>
          {__DEV__ && (
            <Text style={styles.metaText}>
              {isAuthEmulatorActive() ? 'Emulator · demo veri' : 'Canlı Firebase'}
            </Text>
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
    paddingTop: Spacing[2],
    paddingBottom: Spacing[10],
    alignItems: 'center',
    gap: Spacing[4],
  },
  meta: { alignItems: 'center', gap: Spacing[1], marginTop: Spacing[2] },
  metaText: { ...Typography.caption, color: Colors.textTertiary },
});
