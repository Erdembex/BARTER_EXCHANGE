import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import {
  applicationsRepository,
  tasksRepository,
} from '@/features/data';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { StatCard } from '@/components/business';
import { Button } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { authService } from '@/features/auth/authService';

export default function BusinessDashboardScreen() {
  const { bexUser, signOut } = useAuthStore();
  const { business, loading, reload } = useBusiness();
  const [stats, setStats] = useState({
    pendingApps: 0,
    activeTasks: 0,
    pendingApproval: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    if (!business) return;
    const [apps, tasks] = await Promise.all([
      applicationsRepository.getByBusiness(business.id),
      tasksRepository.getByBusiness(business.id),
    ]);
    setStats({
      pendingApps: apps.filter((a) =>
        ['pending', 'approved', 'submitted', 'submission_approved'].includes(a.status)
      ).length,
      activeTasks: tasks.filter((t) => t.status === 'active').length,
      pendingApproval: tasks.filter((t) => !t.approvedByAdmin).length,
    });
  }, [business]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    await loadStats();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    signOut();
    router.replace('/(auth)/onboarding');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const analytics = business && shouldUseDemoData()
    ? demoStore.getAnalytics(business.id)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.name}>{business?.name ?? bexUser?.displayName}</Text>
            {business?.isVerified ? (
              <Text style={styles.verified}>✓ Doğrulanmış işletme</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Çıkış</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Bekleyen başvuru" value={stats.pendingApps} emoji="📥" />
          <StatCard label="Aktif görev" value={stats.activeTasks} emoji="🎯" />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Admin onayı bekleyen" value={stats.pendingApproval} emoji="⏳" />
          {analytics ? (
            <StatCard label="Tamamlanan görev" value={analytics.completedTasks} emoji="✅" />
          ) : (
            <StatCard label="İşletme puanı" value={business?.reputationScore ?? 0} emoji="⭐" />
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title="Yeni Görev Oluştur"
            onPress={() => router.push('/(business)/create-task')}
          />
          <Button
            title="Başvuruları İncele"
            variant="secondary"
            onPress={() => router.push('/(business)/applications')}
          />
          <Button
            title="Kupon Doğrula"
            variant="outline"
            onPress={() => router.push('/(business)/coupons/index' as Href)}
          />
          <Button
            title="Bildirimler"
            variant="ghost"
            onPress={() => router.push('/notifications/index' as Href)}
          />
          <Button
            title="Hesap Ayarları"
            variant="ghost"
            onPress={() => router.push('/settings' as Href)}
          />
          {business && business.verificationStatus !== 'verified' && (
            <Button
              title="İşletme Doğrulama (KYC)"
              variant="secondary"
              onPress={() => router.push('/(business)/verification' as Href)}
            />
          )}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Bilgi</Text>
          <Text style={styles.noteText}>
            Yeni görevler admin onayından sonra yayına alınır. Başvuruyu onayladıktan sonra
            kullanıcı görevi teslim eder; admin teslimi onaylar, ardından kupon verirsin.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[6],
  },
  greeting: { ...Typography.bodyMedium, color: Colors.textSecondary },
  name: { ...Typography.headingLarge, color: Colors.textPrimary, marginTop: 2 },
  verified: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 4,
  },
  logoutBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  logoutText: { ...Typography.labelMedium, color: Colors.textSecondary },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  actions: { gap: Spacing[3], marginTop: Spacing[4], marginBottom: Spacing[6] },
  note: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  noteTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  noteText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
});
