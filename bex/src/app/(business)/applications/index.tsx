import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useBusiness } from '@/features/business/useBusiness';
import { applicationsRepository, tasksRepository, usersRepository } from '@/features/data';
import { Application, ApplicationStatus } from '@/types';
import { ApplicationCard } from '@/components/business';
import { Colors, Typography, Spacing, Radius } from '@/theme';

type FilterKey = 'all' | 'pending' | 'submitted' | 'coupon';

const FILTERS: { key: FilterKey; label: string; statuses?: ApplicationStatus[] }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'pending', label: 'Bekleyen', statuses: ['pending'] },
  { key: 'submitted', label: 'Teslimler', statuses: ['submitted'] },
  { key: 'coupon', label: 'Kupon Bekleyen', statuses: ['submission_approved'] },
];

export default function BusinessApplicationsScreen() {
  const { business, loading: bizLoading } = useBusiness();
  const [applications, setApplications] = useState<Application[]>([]);
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({});
  const [applicantNames, setApplicantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const apps = await applicationsRepository.getByBusiness(business.id);
    setApplications(apps);

    const titles: Record<string, string> = {};
    for (const app of apps) {
      if (!titles[app.taskId]) {
        const task = await tasksRepository.getById(app.taskId);
        titles[app.taskId] = task?.title ?? 'Görev';
      }
    }
    setTaskTitles(titles);

    const names = await usersRepository.getDisplayNames(apps.map((a) => a.userId));
    setApplicantNames(names);
    setLoading(false);
  }, [business]);

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

  const filtered = useMemo(() => {
    const active = FILTERS.find((f) => f.key === filter);
    if (!active?.statuses) return applications;
    return applications.filter((a) => active.statuses!.includes(a.status));
  }, [applications, filter]);

  if (bizLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Başvurular</Text>
        <Text style={styles.subtitle}>
          {filtered.length} gösteriliyor · {applications.length} toplam
        </Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📥</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'Başvuru yok' : 'Bu filtrede başvuru yok'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Görevlerine başvuru geldiğinde burada görünür.'
                : `${FILTERS.find((f) => f.key === filter)?.label} durumunda başvuru bulunmuyor.`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ApplicationCard
            application={item}
            taskTitle={taskTitles[item.taskId] ?? 'Görev'}
            applicantName={applicantNames[item.userId] ?? `Kullanıcı ${item.userId.slice(-4)}`}
            onPress={() =>
              router.push({
                pathname: '/(business)/applications/[id]',
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[2] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
  },
  filterChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: Colors.primaryDark },
  list: { padding: Spacing[5], flexGrow: 1 },
  empty: { alignItems: 'center', paddingTop: Spacing[16] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing[3] },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
    textAlign: 'center',
  },
});
