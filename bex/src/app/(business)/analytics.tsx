import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBusiness } from '@/features/business/useBusiness';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { CATEGORY_LABELS } from '@/constants/taskLabels';
import { StatCard } from '@/components/business';
import { Colors, Typography, Spacing, Radius } from '@/theme';

import { TaskCategory } from '@/types';

type BusinessAnalytics = {
  publishedTasks: number;
  activeTasks: number;
  pendingApproval: number;
  totalApplications: number;
  pendingApplications: number;
  submittedApplications: number;
  completedTasks: number;
  couponsDistributed: number;
  couponsUsed: number;
  couponUseRate: number;
  topCategory: TaskCategory | null;
  topCategoryCount: number;
};

export default function BusinessAnalyticsScreen() {
  const { business, loading: bizLoading, reload } = useBusiness();
  const [stats, setStats] = useState<BusinessAnalytics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (!business) return;
    if (shouldUseDemoData()) {
      setStats(demoStore.getAnalytics(business.id) as BusinessAnalytics);
    } else {
      setStats({
        publishedTasks: 0,
        activeTasks: 0,
        pendingApproval: 0,
        totalApplications: 0,
        pendingApplications: 0,
        submittedApplications: 0,
        completedTasks: 0,
        couponsDistributed: 0,
        couponsUsed: 0,
        couponUseRate: 0,
        topCategory: null,
        topCategoryCount: 0,
      });
    }
  }, [business]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    load();
    setRefreshing(false);
  };

  if (bizLoading || !stats) {
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
        <Text style={styles.title}>Analitik</Text>
        <Text style={styles.subtitle}>{business?.name}</Text>

        <Text style={styles.section}>Görevler</Text>
        <View style={styles.row}>
          <StatCard label="Yayınlanan" value={stats.publishedTasks} emoji="📋" />
          <StatCard label="Aktif" value={stats.activeTasks} emoji="🟢" />
        </View>
        <View style={styles.row}>
          <StatCard label="Onay bekleyen" value={stats.pendingApproval} emoji="⏳" />
          <StatCard label="Tamamlanan" value={stats.completedTasks} emoji="✅" />
        </View>

        <Text style={styles.section}>Başvurular</Text>
        <View style={styles.row}>
          <StatCard label="Toplam" value={stats.totalApplications} emoji="📥" />
          <StatCard label="Bekleyen" value={stats.pendingApplications} emoji="🕐" />
        </View>
        <View style={styles.row}>
          <StatCard label="Teslim edilen" value={stats.submittedApplications} emoji="📤" />
        </View>

        <Text style={styles.section}>Kuponlar</Text>
        <View style={styles.row}>
          <StatCard label="Dağıtılan" value={stats.couponsDistributed} emoji="🎟️" />
          <StatCard label="Kullanılan" value={stats.couponsUsed} emoji="✔️" />
        </View>
        <View style={styles.row}>
          <StatCard label="Kullanım oranı" value={`%${stats.couponUseRate}`} emoji="📈" />
        </View>

        {stats.topCategory && (
          <View style={styles.insight}>
            <Text style={styles.insightTitle}>En popüler kategori</Text>
            <Text style={styles.insightValue}>
              {CATEGORY_LABELS[stats.topCategory]} (
              {stats.topCategoryCount} görev)
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, marginBottom: Spacing[6] },
  section: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    marginTop: Spacing[4],
    marginBottom: Spacing[3],
  },
  row: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[3] },
  insight: {
    marginTop: Spacing[6],
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  insightTitle: { ...Typography.labelMedium, color: Colors.textSecondary },
  insightValue: { ...Typography.headingSmall, color: Colors.textPrimary, marginTop: Spacing[1] },
});
