import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { adminRepository } from '@/features/admin';
import { fetchPendingComplaintsAdmin } from '@/features/complaint/complaintsApi';
import { authService } from '@/features/auth/authService';
import { shouldUseDemoData } from '@/lib/devMode';
import { Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function AdminPanelScreen() {
  const { bexUser, signOut } = useAuthStore();
  const { showToast } = useToast();
  const [pendingTasks, setPendingTasks] = useState(0);
  const [pendingKyc, setPendingKyc] = useState(0);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [pendingComplaints, setPendingComplaints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    const [tasks, verifications, submissions, complaints] = await Promise.all([
      adminRepository.getPendingTasks(),
      adminRepository.getPendingVerifications(),
      adminRepository.getPendingSubmissions(),
      fetchPendingComplaintsAdmin().catch(() => []),
    ]);
    setPendingTasks(tasks.length);
    setPendingKyc(verifications.length);
    setPendingSubmissions(submissions.length);
    setPendingComplaints(complaints.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    signOut();
    router.replace('/(auth)/onboarding');
  };

  const handleSeedCatalog = async () => {
    if (shouldUseDemoData()) {
      showToast('Emulator modunda demo veri zaten bellekte. Canlı Firestore için emulator kapalı test gerekir.');
      return;
    }

    setSeeding(true);
    try {
      const result = await adminRepository.seedLiveCatalog();
      showToast(`${result.businesses} işletme, ${result.tasks} görev yüklendi.`);
    } catch (err: unknown) {
      const code = (err as Error)?.message;
      if (code === 'already-seeded') {
        showToast('Firestore zaten dolu — seed atlandı.');
      } else {
        showToast('Demo içerik yüklenemedi.');
      }
    } finally {
      setSeeding(false);
    }
  };

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
            <Text style={styles.greeting}>Admin Paneli</Text>
            <Text style={styles.name}>{bexUser?.displayName ?? 'Yönetici'}</Text>
          </View>
          <Button title="Çıkış" variant="outline" size="sm" fullWidth={false} onPress={handleLogout} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>Görev onayı bekliyor</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingSubmissions}</Text>
            <Text style={styles.statLabel}>Teslim incelemesi</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingKyc}</Text>
            <Text style={styles.statLabel}>KYC incelemesi</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingComplaints}</Text>
            <Text style={styles.statLabel}>Şikayet incelemesi</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Görev Moderasyonu"
            onPress={() => router.push('/(admin)/tasks' as Href)}
          />
          <Button
            title="Teslim Moderasyonu"
            variant="secondary"
            onPress={() => router.push('/(admin)/submissions' as Href)}
          />
          <Button
            title="İşletme Doğrulama (KYC)"
            variant="outline"
            onPress={() => router.push('/(admin)/verifications' as Href)}
          />
          <Button
            title="Şikayet Moderasyonu"
            variant="outline"
            onPress={() => router.push('/(admin)/complaints' as Href)}
          />
          <Button
            title="Kullanıcı Yönetimi"
            variant="outline"
            onPress={() => router.push('/(admin)/users' as Href)}
          />
          <Button
            title="Bildirimler"
            variant="outline"
            onPress={() => router.push('/(admin)/notifications' as Href)}
          />
          <Button
            title="Hesap Ayarları"
            variant="ghost"
            onPress={() => router.push('/settings' as Href)}
          />
          <Button
            title="Canlı Firestore'a Demo Yükle"
            variant="outline"
            onPress={handleSeedCatalog}
            loading={seeding}
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Moderasyon</Text>
          <Text style={styles.noteText}>
            Onaylanan görevler kullanıcılara görünür. Teslimler admin onayından sonra işletme kupon verir.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[6],
    gap: Spacing[3],
  },
  greeting: { ...Typography.bodyMedium, color: Colors.textSecondary },
  name: { ...Typography.headingLarge, color: Colors.textPrimary, marginTop: 2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginBottom: Spacing[6] },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statValue: { ...Typography.displayMedium, color: Colors.primary },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing[1],
  },
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
