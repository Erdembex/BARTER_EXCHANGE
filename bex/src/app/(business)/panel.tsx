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
import { LinearGradient } from 'expo-linear-gradient';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import { authService } from '@/features/auth/authService';
import {
  applicationsRepository,
  tasksRepository,
} from '@/features/data';
import {
  getBusinessAnalytics,
} from '@/features/business/businessAnalyticsService';
import { useMessagingInbox } from '@/hooks/useMessagingInbox';
import { StatCard } from '@/components/business';
import { Button } from '@/components/ui';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';

export default function BusinessDashboardScreen() {
  const { bexUser, signOut } = useAuthStore();
  const { business, loading, reload } = useBusiness();
  const { totalUnread: messageUnread, isUnlocked: messagingUnlocked } = useMessagingInbox('business');
  const [stats, setStats] = useState({
    newApplications: 0,
    inProgressApps: 0,
    activeTasks: 0,
    pendingApproval: 0,
    completedTasks: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    if (!business) return;
    const [apps, tasks, analytics] = await Promise.all([
      applicationsRepository.getByBusiness(business.id),
      tasksRepository.getByBusiness(business.id),
      getBusinessAnalytics(business.id).catch(() => null),
    ]);
    setStats({
      newApplications: apps.filter((a) => a.status === 'pending').length,
      inProgressApps: apps.filter((a) =>
        ['approved', 'submitted', 'submission_approved'].includes(a.status)
      ).length,
      activeTasks: analytics?.activeTasks ?? tasks.filter((t) => t.status === 'active').length,
      pendingApproval:
        analytics?.pendingApproval ?? tasks.filter((t) => !t.approvedByAdmin).length,
      completedTasks: analytics?.completedTasks ?? 0,
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <LinearGradient
          colors={[Colors.secondary, Colors.gradientMid, '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <ProfileAvatar
            name={business?.name ?? bexUser?.displayName}
            avatarUrl={business?.logoUrl || bexUser?.avatarUrl}
            size={56}
          />
          <View style={styles.heroText}>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.name}>{business?.name ?? bexUser?.displayName}</Text>
            {business?.isVerified ? (
              <Text style={styles.verified}>✓ Doğrulanmış işletme</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Çıkış</Text>
          </TouchableOpacity>
        </LinearGradient>

        {messageUnread > 0 ? (
          <TouchableOpacity
            style={styles.messageCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/messages' as Href)}
          >
            <Text style={styles.messageTitle}>{messageUnread} okunmamış mesaj</Text>
            <Text style={styles.messageHint}>Sohbet sekmesine git →</Text>
          </TouchableOpacity>
        ) : messagingUnlocked ? (
          <TouchableOpacity
            style={styles.messageCardMuted}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/messages' as Href)}
          >
            <Text style={styles.messageTitleMuted}>Adaylarla sohbet et</Text>
            <Text style={styles.messageHintMuted}>Onaylı başvurulardan yaz →</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.statsRow}>
          <StatCard
            label="Yeni başvuru"
            value={stats.newApplications}
            emoji="📥"
            onPress={() => router.push('/(business)/applications' as Href)}
          />
          <StatCard
            label="Devam eden"
            value={stats.inProgressApps}
            emoji="💬"
            onPress={() => router.push('/(business)/applications' as Href)}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Aktif görev"
            value={stats.activeTasks}
            emoji="🎯"
            onPress={() => router.push('/(business)/tasks' as Href)}
          />
          <StatCard
            label="Admin onayı bekleyen"
            value={stats.pendingApproval}
            emoji="⏳"
            onPress={() => router.push('/(business)/tasks' as Href)}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Tamamlanan görev" value={stats.completedTasks} emoji="✅" />
          <View style={styles.statSpacer} />
        </View>

        <Text style={styles.sectionTitle}>Hızlı erişim</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/messages' as Href)}
          >
            <Text style={styles.quickIcon}>💬</Text>
            <Text style={styles.quickLabel}>Sohbet</Text>
            <Text style={styles.quickHint}>Aday mesajları</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/profile-search' as Href)}
          >
            <Text style={styles.quickIcon}>🔍</Text>
            <Text style={styles.quickLabel}>Profil Ara</Text>
            <Text style={styles.quickHint}>Aday portföyü</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/analytics' as Href)}
          >
            <Text style={styles.quickIcon}>📈</Text>
            <Text style={styles.quickLabel}>Analitik</Text>
            <Text style={styles.quickHint}>Performans özeti</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/notifications' as Href)}
          >
            <Text style={styles.quickIcon}>🔔</Text>
            <Text style={styles.quickLabel}>Bildirimler</Text>
            <Text style={styles.quickHint}>Son güncellemeler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/complaint/submit-user' as Href)}
          >
            <Text style={styles.quickIcon}>⚠</Text>
            <Text style={styles.quickLabel}>Kullanıcı Şikayet</Text>
            <Text style={styles.quickHint}>Tehlikeli aday bildir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/complaints/index' as Href)}
          >
            <Text style={styles.quickIcon}>📋</Text>
            <Text style={styles.quickLabel}>Şikayetlerim</Text>
            <Text style={styles.quickHint}>Gönderdiğin şikayetler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/subscription' as Href)}
          >
            <Text style={styles.quickIcon}>💳</Text>
            <Text style={styles.quickLabel}>Abonelik</Text>
            <Text style={styles.quickHint}>Plan ve faturalar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/settings' as Href)}
          >
            <Text style={styles.quickIcon}>⚙️</Text>
            <Text style={styles.quickLabel}>Ayarlar</Text>
            <Text style={styles.quickHint}>Hesap yönetimi</Text>
          </TouchableOpacity>
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
  safe: { flex: 1, backgroundColor: Colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.xl,
    marginBottom: Spacing[2],
    ...Shadow.primary,
  },
  heroText: { flex: 1, gap: 2 },
  greeting: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.85)' },
  name: { ...Typography.headingMedium, color: Colors.textInverse, fontWeight: '700' },
  verified: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  logoutText: { ...Typography.labelMedium, color: Colors.textInverse },
  messageCard: {
    padding: Spacing[4],
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accent,
    gap: Spacing[1],
  },
  messageTitle: {
    ...Typography.labelLarge,
    color: Colors.accentDark,
    fontWeight: '700',
  },
  messageHint: {
    ...Typography.caption,
    color: Colors.accentDark,
    fontWeight: '600',
  },
  messageCardMuted: {
    padding: Spacing[4],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[1],
  },
  messageTitleMuted: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  messageHintMuted: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  statSpacer: { flex: 1 },
  sectionTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    marginTop: Spacing[2],
    marginBottom: Spacing[2],
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  quickCard: {
    width: '47%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { ...Typography.labelMedium, color: Colors.textPrimary },
  quickHint: { ...Typography.caption, color: Colors.textMuted },
  actions: { gap: Spacing[3], marginBottom: Spacing[6] },
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
