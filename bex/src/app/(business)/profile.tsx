import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/authService';
import { useBusiness } from '@/features/business/useBusiness';
import { isAuthEmulatorActive } from '@/lib/firebase';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button } from '@/components/ui';
import {
  BUSINESS_CATEGORY_LABELS,
  VERIFICATION_STATUS_LABELS,
} from '@/constants/businessLabels';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function BusinessProfileScreen() {
  const { bexUser, firebaseUser, setBexUser, signOut } = useAuthStore();
  const { business, loading } = useBusiness();

  useFocusEffect(
    useCallback(() => {
      if (!firebaseUser) return;
      authService.refreshProfile().then((user) => {
        if (user) setBexUser(user);
      });
    }, [firebaseUser, setBexUser])
  );

  const handleLogout = async () => {
    await authService.logout();
    signOut();
    router.replace('/(auth)/onboarding');
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const verificationStatus = business?.verificationStatus ?? 'none';

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Profil" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && !business ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing[8] }} />
        ) : (
          <>
            <View style={styles.businessCard}>
              <Text style={styles.businessCardTitle}>İşletme bilgileri</Text>
              <Text style={styles.businessName}>{business?.name ?? bexUser?.displayName ?? 'İşletme'}</Text>
              {business?.category ? (
                <Text style={styles.businessMeta}>
                  {BUSINESS_CATEGORY_LABELS[business.category]}
                </Text>
              ) : null}
              {business?.address ? (
                <Text style={styles.businessMeta}>{business.address}</Text>
              ) : null}
              <View
                style={[
                  styles.verificationBadge,
                  verificationStatus === 'verified' && styles.verificationVerified,
                  verificationStatus === 'pending' && styles.verificationPending,
                  verificationStatus === 'rejected' && styles.verificationRejected,
                ]}
              >
                <Text style={styles.verificationText}>
                  {VERIFICATION_STATUS_LABELS[verificationStatus]}
                </Text>
              </View>

              {business?.id ? (
                <TouchableOpacity
                  onPress={() => router.push(`/business/${business.id}` as Href)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.link}>Herkese açık işletme sayfası →</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.quickLinks}>
              {verificationStatus !== 'verified' ? (
                <Button
                  title="İşletme Doğrulama (KYC)"
                  variant="secondary"
                  onPress={() => router.push('/(business)/verification' as Href)}
                />
              ) : null}
              {!bexUser?.phoneVerified ? (
                <Button
                  title="Telefon Doğrula"
                  variant="outline"
                  onPress={() => router.push('/(auth)/phone-verification' as Href)}
                />
              ) : null}
              <Button
                title="Abonelik & Faturalar"
                variant="outline"
                onPress={() => router.push('/(business)/subscription' as Href)}
              />
            </View>
          </>
        )}

        <AccountSettings
          bexUser={bexUser}
          onUserUpdated={setBexUser}
          showAdminLink={bexUser?.role === 'admin'}
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
            <Text style={styles.metaText}>
              {isAuthEmulatorActive() ? 'Emulator · demo veri' : 'Canlı backend'}
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
  businessCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  businessCardTitle: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  businessName: {
    ...Typography.headingMedium,
    color: Colors.textPrimary,
  },
  businessMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  verificationBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  verificationVerified: { backgroundColor: Colors.successLight },
  verificationPending: { backgroundColor: Colors.warningLight },
  verificationRejected: { backgroundColor: Colors.errorLight },
  verificationText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  link: {
    ...Typography.labelMedium,
    color: Colors.primary,
    marginTop: Spacing[2],
  },
  quickLinks: {
    width: '100%',
    gap: Spacing[3],
  },
  meta: { alignItems: 'center', gap: Spacing[1], marginTop: Spacing[2] },
  metaText: { ...Typography.caption, color: Colors.textTertiary },
});
