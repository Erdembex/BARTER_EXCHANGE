import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { tasksRepository, EnrichedTask } from '@/features/data';
import { shouldUseListingsRest } from '@/features/listing/listingsApi';
import { TaskCategory, TaskDifficulty } from '@/types';
import { SearchBar, CategoryFilter, TaskCard } from '@/components/tasks';
import { LocationFilter } from '@/components/common/LocationPicker';
import { TaskListSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { AppHeader } from '@/components/navigation/AppHeader';
import { useAuthStore } from '@/store/authStore';
import { saveLocationFilter } from '@/lib/locationFilterStorage';
import { resolveLocationFilter } from '@/lib/resolveLocationFilter';
import { Colors, Typography, Spacing, Radius } from '@/theme';

const DIFFICULTIES: (TaskDifficulty | null)[] = [null, 'easy', 'medium', 'hard'];
const DIFF_LABELS: Record<string, string> = {
  all: 'Tümü',
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

export default function TasksScreen() {
  const { bexUser, isInitialized } = useAuthStore();
  const didInitFilter = useRef(false);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [filterReady, setFilterReady] = useState(false);
  const [category, setCategory] = useState<TaskCategory | null>(null);
  const [difficulty, setDifficulty] = useState<TaskDifficulty | null>(null);
  const [restListings, setRestListings] = useState(false);
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    shouldUseListingsRest().then(setRestListings);
  }, []);

  useEffect(() => {
    if (!isInitialized || didInitFilter.current) return;

    let cancelled = false;

    (async () => {
      const resolved = await resolveLocationFilter(bexUser);
      if (cancelled) return;

      setCity(resolved.city);
      setDistrict(resolved.district);

      didInitFilter.current = true;
      setFilterReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isInitialized, bexUser?.city, bexUser?.district]);

  useEffect(() => {
    if (!filterReady) return;
    saveLocationFilter({ city, district });
  }, [city, district, filterReady]);

  const filterTasks = useCallback(
    (list: EnrichedTask[]) =>
      list.filter((t) => {
        if (category && t.category !== category) return false;
        if (difficulty && t.difficulty !== difficulty) return false;
        if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [category, difficulty, search]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { tasks: fetched, lastDoc: doc, nextCursor: cursor } = await tasksRepository.getActive(
        10,
        null,
        { city: city ?? undefined, district: district ?? undefined, category }
      );
      setTasks(fetched);
      setLastDoc(doc);
      setNextCursor(cursor);
      setHasMore(cursor !== null || (doc !== null && fetched.length >= 10));
    } catch {
      setTasks([]);
      setLoadError('Görevler yüklenemedi. Sunucu kapalı olabilir — aşağı çekerek tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [city, district, category]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    if (!nextCursor && !lastDoc) return;
    setLoadingMore(true);
    const cursorArg = nextCursor ?? lastDoc ?? undefined;
    const { tasks: fetched, lastDoc: doc, nextCursor: cursor } = await tasksRepository.getActive(
      10,
      cursorArg,
      { city: city ?? undefined, district: district ?? undefined, category }
    );
    setTasks((prev) => [...prev, ...fetched]);
    setLastDoc(doc);
    setNextCursor(cursor);
    setHasMore(cursor !== null || (doc !== null && fetched.length >= 10));
    setLoadingMore(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!filterReady) return;
    loadInitial();
  }, [loadInitial, filterReady]);

  const displayed = filterTasks(tasks);

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Görevler" />
      <View style={styles.header}>
        <Text style={styles.subtitle}>Becerinle ödül kazan</Text>
      </View>

      <View style={styles.filters}>
        <SearchBar value={search} onChangeText={setSearch} />
        <LocationFilter
          city={city}
          district={district}
          onCityChange={setCity}
          onDistrictChange={setDistrict}
        />
        <CategoryFilter selected={category} onSelect={setCategory} />
        {!restListings ? (
          <View style={styles.diffRow}>
            {DIFFICULTIES.map((d) => {
              const key = d ?? 'all';
              const active = difficulty === d;
              return (
                <Text
                  key={key}
                  style={[styles.diffChip, active && styles.diffChipActive]}
                  onPress={() => setDifficulty(d)}
                >
                  {DIFF_LABELS[key]}
                </Text>
              );
            })}
          </View>
        ) : null}
      </View>

      {loading ? (
        <TaskListSkeleton count={5} />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} /> : null
          }
          ListEmptyComponent={
            loadError ? (
              <Text style={styles.error}>{loadError}</Text>
            ) : (
              <Text style={styles.empty}>Bu filtrelere uygun görev yok.</Text>
            )
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              businessName={item.businessName}
              businessVerified={item.businessVerified}
              businessIsDangerous={item.businessIsDangerous}
              compact
              onPress={() => router.push(`/task/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing[5], paddingTop: Spacing[1], paddingBottom: Spacing[2] },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary },
  filters: { paddingHorizontal: Spacing[5], gap: Spacing[3], paddingBottom: Spacing[3] },
  diffRow: { flexDirection: 'row', gap: Spacing[2] },
  diffChip: {
    ...Typography.caption,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    color: Colors.textSecondary,
    overflow: 'hidden',
  },
  diffChipActive: {
    backgroundColor: Colors.primary,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  list: { paddingHorizontal: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  empty: { ...Typography.bodyMedium, color: Colors.textTertiary, textAlign: 'center', marginTop: 40 },
  error: { ...Typography.bodyMedium, color: Colors.error, textAlign: 'center', marginTop: 40, lineHeight: 22 },
});
