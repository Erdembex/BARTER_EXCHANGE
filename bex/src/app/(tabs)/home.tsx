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
import {
  tasksRepository,
  businessesRepository,
  applicationsRepository,
} from '@/features/data';
import type { EnrichedTask } from '@/features/data';
import { Business, Application, TaskCategory } from '@/types';
import { getGreeting } from '@/lib/taskUtils';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { APPLICATION_STATUS_LABELS } from '@/constants/taskLabels';
import { SearchBar, CategoryFilter, TaskCard, BusinessCard } from '@/components/tasks';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Colors, Typography, Spacing } from '@/theme';

export default function HomeScreen() {
  const { bexUser, firebaseUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TaskCategory | null>(null);
  const [featured, setFeatured] = useState<EnrichedTask[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [featuredTasks, popularBusinesses] = await Promise.all([
        tasksRepository.getFeatured(),
        businessesRepository.getPopular(6),
      ]);
      setFeatured(featuredTasks);
      setBusinesses(popularBusinesses);

      if (firebaseUser) {
        try {
          if (shouldUseDemoData()) {
            demoStore.ensureSampleApplicationsForUser(firebaseUser.uid);
          }
          const apps = await applicationsRepository.getActiveByUser(firebaseUser.uid);
          setMyApplications(apps);
        } catch {
          setMyApplications([]);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [firebaseUser]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredFeatured = featured.filter((t) => {
    if (category && t.category !== category) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const goToTask = (id: string) => router.push(`/task/${id}`);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* Karşılama */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>
                {getGreeting(bexUser?.displayName)}
              </Text>
              <Text style={styles.subGreeting}>
                Bugün hangi görevi tamamlayacaksın?
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile' as Href)}
              style={styles.profileBtn}
            >
              <Text style={styles.profileText}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Arama */}
        <SearchBar value={search} onChangeText={setSearch} />

        {/* Kategoriler */}
        <CategoryFilter selected={category} onSelect={setCategory} />

        {/* Aktif görevlerim */}
        {myApplications.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Aktif Görevlerim"
              actionLabel="Tümü →"
              onAction={() => router.push('/(tabs)/applications' as Href)}
            />
            {myApplications.slice(0, 2).map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.appRow}
                onPress={() => router.push(`/application/${app.id}` as Href)}
                activeOpacity={0.85}
              >
                <Text style={styles.appStatus}>
                  {APPLICATION_STATUS_LABELS[app.status]}
                </Text>
                <Text style={styles.appTask} numberOfLines={1}>
                  Görev #{app.taskId.slice(0, 8)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Öne çıkan görevler */}
        <View style={styles.section}>
          <SectionHeader
            title="Öne Çıkan Görevler"
            actionLabel="Tümü →"
            onAction={() => router.push('/(tabs)/tasks')}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {filteredFeatured.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                businessName={task.businessName}
                onPress={() => goToTask(task.id)}
              />
            ))}
            {filteredFeatured.length === 0 && (
              <Text style={styles.empty}>Görev bulunamadı.</Text>
            )}
          </ScrollView>
        </View>

        {/* Popüler işletmeler */}
        <View style={styles.section}>
          <SectionHeader title="Popüler İşletmeler" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[5], paddingBottom: Spacing[10] },
  header: { gap: Spacing[1] },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  headerText: { flex: 1, gap: Spacing[1] },
  profileBtn: { paddingVertical: Spacing[1], paddingHorizontal: Spacing[2] },
  profileText: { fontSize: 22 },
  greeting: { ...Typography.headingLarge, color: Colors.textPrimary },
  subGreeting: { ...Typography.bodyMedium, color: Colors.textSecondary },
  section: { gap: Spacing[2] },
  hScroll: { gap: Spacing[3], paddingRight: Spacing[2] },
  empty: { ...Typography.bodySmall, color: Colors.textTertiary, paddingVertical: Spacing[4] },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: Spacing[2],
  },
  appStatus: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontWeight: '700',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: 6,
  },
  appTask: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
});
