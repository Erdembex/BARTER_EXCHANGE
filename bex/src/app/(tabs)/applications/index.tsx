import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { applicationsRepository, tasksRepository } from '@/features/data';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { Application, ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/constants/taskLabels';
import { getApplicationQuickAction, getApplicationTarget } from '@/lib/applicationNavigation';
import { formatRelativeTime } from '@/lib/dateUtils';
import { TaskListSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { Colors, Typography, Spacing, Radius } from '@/theme';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: Colors.warning,
  approved: Colors.info,
  rejected: Colors.error,
  submitted: Colors.primary,
  submission_approved: Colors.success,
  rewarded: Colors.success,
  cancelled: Colors.textTertiary,
};

interface EnrichedApplication extends Application {
  taskTitle: string;
}

export default function MyApplicationsScreen() {
  const { firebaseUser } = useAuthStore();
  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!firebaseUser) return;

    if (shouldUseDemoData()) {
      demoStore.ensureSampleApplicationsForUser(firebaseUser.uid);
    }

    setLoading(true);
    const list = await applicationsRepository.getByUser(firebaseUser.uid);

    const enriched: EnrichedApplication[] = [];
    for (const app of list) {
      const task = await tasksRepository.getById(app.taskId);
      enriched.push({
        ...app,
        taskTitle: task?.title ?? 'Görev',
      });
    }

    setApplications(enriched);
    setLoading(false);
  }, [firebaseUser]);

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

  const activeCount = applications.filter((a) =>
    ['pending', 'approved', 'submitted', 'submission_approved'].includes(a.status)
  ).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Başvurularım</Text>
        </View>
        <TaskListSkeleton count={3} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Başvurularım</Text>
            <Text style={styles.subtitle}>
              {activeCount} aktif · {applications.length} toplam
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Henüz başvuru yok</Text>
            <Text style={styles.emptyText}>
              Görevler sekmesinden ilgilendiğin ilanlara başvurabilirsin.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(tabs)/tasks' as Href)}
            >
              <Text style={styles.emptyBtnText}>Görevlere Git</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const statusColor = STATUS_COLORS[item.status];
          const quickAction = getApplicationQuickAction(item);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(getApplicationTarget(item))}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.taskTitle}
                </Text>
                <View
                  style={[styles.badge, { backgroundColor: statusColor + '22' }]}
                >
                  <Text style={[styles.badgeText, { color: statusColor }]}>
                    {APPLICATION_STATUS_LABELS[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.preview} numberOfLines={2}>
                {item.coverLetter}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.timeText}>
                  {formatRelativeTime(item.createdAt) || '—'}
                </Text>
                <Text style={styles.tapHint}>
                  {quickAction ? quickAction.label : 'Detay →'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing[5], paddingBottom: Spacing[10], flexGrow: 1 },
  header: { marginBottom: Spacing[4] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  cardTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: { ...Typography.caption, fontWeight: '600' },
  preview: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing[2],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: { ...Typography.caption, color: Colors.textMuted },
  tapHint: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: Spacing[16] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing[3] },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
    textAlign: 'center',
    marginBottom: Spacing[5],
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  emptyBtnText: {
    ...Typography.labelLarge,
    color: Colors.textOnPrimary,
  },
});
