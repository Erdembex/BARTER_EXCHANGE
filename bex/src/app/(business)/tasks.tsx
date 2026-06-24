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
import { tasksRepository } from '@/features/data';
import { Task } from '@/types';
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/constants/taskLabels';
import { Button } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function BusinessTasksScreen() {
  const { business, loading: bizLoading } = useBusiness();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const list = await tasksRepository.getByBusiness(business.id);
    setTasks(list);
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
        <Text style={styles.title}>Görevlerim</Text>
        <Button
          title="+ Yeni"
          size="sm"
          fullWidth={false}
          onPress={() => router.push('/(business)/create-task')}
          style={styles.newBtn}
        />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Henüz görev yok</Text>
            <Text style={styles.emptyText}>İlk görevini oluşturarak başla.</Text>
            <Button
              title="Görev Oluştur"
              onPress={() => router.push('/(business)/create-task')}
              style={{ marginTop: Spacing[4] }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: item.approvedByAdmin
                      ? Colors.successLight
                      : Colors.warningLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: item.approvedByAdmin ? Colors.success : Colors.warning },
                  ]}
                >
                  {item.approvedByAdmin ? 'Yayında' : 'Onay bekliyor'}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {CATEGORY_LABELS[item.category]} · {DIFFICULTY_LABELS[item.difficulty]}
            </Text>
            <Text style={styles.reward}>{item.rewardDescription}</Text>
            <Text style={styles.applicants}>
              {item.currentApplicantCount}/{item.maxApplicants} başvuru
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  newBtn: { paddingHorizontal: Spacing[4], minWidth: 90 },
  list: { padding: Spacing[5], paddingTop: Spacing[2], flexGrow: 1 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  cardTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: { ...Typography.caption, fontWeight: '600' },
  meta: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing[1] },
  reward: { ...Typography.bodySmall, color: Colors.primaryDark, fontWeight: '600' },
  applicants: { ...Typography.caption, color: Colors.textTertiary, marginTop: Spacing[2] },
  empty: { alignItems: 'center', paddingTop: Spacing[16] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing[3] },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary },
  emptyText: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: Spacing[1] },
});
