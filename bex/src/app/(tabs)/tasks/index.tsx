import React, { useCallback, useState } from 'react';
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
import { TaskCategory, TaskDifficulty } from '@/types';
import { SearchBar, CategoryFilter, TaskCard } from '@/components/tasks';
import { TaskListSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { Colors, Typography, Spacing } from '@/theme';

const DIFFICULTIES: (TaskDifficulty | null)[] = [null, 'easy', 'medium', 'hard'];
const DIFF_LABELS: Record<string, string> = {
  all: 'Tümü',
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

export default function TasksScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TaskCategory | null>(null);
  const [difficulty, setDifficulty] = useState<TaskDifficulty | null>(null);
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    const { tasks: fetched, lastDoc: doc } = await tasksRepository.getActive(10);
    setTasks(fetched);
    setLastDoc(doc);
    setHasMore(doc !== null && fetched.length >= 10);
    setLoading(false);
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    setLoadingMore(true);
    const { tasks: fetched, lastDoc: doc } = await tasksRepository.getActive(10, lastDoc);
    setTasks((prev) => [...prev, ...fetched]);
    setLastDoc(doc);
    setHasMore(doc !== null && fetched.length >= 10);
    setLoadingMore(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  };

  React.useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const displayed = filterTasks(tasks);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Görevler</Text>
        <Text style={styles.subtitle}>Becerinle ödül kazan</Text>
      </View>

      <View style={styles.filters}>
        <SearchBar value={search} onChangeText={setSearch} />
        <CategoryFilter selected={category} onSelect={setCategory} />
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
            <Text style={styles.empty}>Bu filtrelere uygun görev yok.</Text>
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              businessName={item.businessName}
              businessVerified={item.businessVerified}
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
  header: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4], gap: 4 },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
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
});
