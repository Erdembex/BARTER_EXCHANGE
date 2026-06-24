import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useBusiness } from '@/features/business/useBusiness';
import { applicationsRepository, tasksRepository } from '@/features/data';
import { Application } from '@/types';
import { ApplicationCard } from '@/components/business';
import { Colors, Typography, Spacing } from '@/theme';

export default function BusinessApplicationsScreen() {
  const { business, loading: bizLoading } = useBusiness();
  const [applications, setApplications] = useState<Application[]>([]);
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  }, [business]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
        <Text style={styles.subtitle}>{applications.length} toplam</Text>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📥</Text>
            <Text style={styles.emptyTitle}>Başvuru yok</Text>
            <Text style={styles.emptyText}>Görevlerine başvuru geldiğinde burada görünür.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ApplicationCard
            application={item}
            taskTitle={taskTitles[item.taskId] ?? 'Görev'}
            applicantName={`Kullanıcı ${item.userId.slice(-4)}`}
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
