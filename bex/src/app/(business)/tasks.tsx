import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useBusiness } from '@/features/business/useBusiness';
import { tasksRepository } from '@/features/data';
import { Task } from '@/types';
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/constants/taskLabels';
import { Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function BusinessTasksScreen() {
  const { business, loading: bizLoading } = useBusiness();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

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

  const handlePauseToggle = (task: Task) => {
    if (!business) return;
    const pausing = task.status === 'active';
    if (!task.approvedByAdmin && pausing) {
      showToast('Onay bekleyen görev duraklatılamaz.');
      return;
    }
    Alert.alert(
      pausing ? 'Görevi Duraklat' : 'Görevi Yeniden Başlat',
      pausing
        ? 'Görev kullanıcılara geçici olarak görünmez olur.'
        : 'Görev tekrar kullanıcılara görünür olur.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: pausing ? 'Duraklat' : 'Başlat',
          onPress: async () => {
            setActionId(task.id);
            try {
              await tasksRepository.setStatus(
                task.id,
                business.id,
                pausing ? 'paused' : 'active'
              );
              showToast(pausing ? 'Görev duraklatıldı.' : 'Görev yeniden aktif.');
              await load();
            } catch (err: unknown) {
              showToast(err instanceof Error ? err.message : 'İşlem başarısız.');
            } finally {
              setActionId(null);
            }
          },
        },
      ]
    );
  };

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
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              router.navigate(`/(business)/applications/index?taskId=${item.id}` as Href)
            }
          >
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
            {item.status === 'paused' ? (
              <Text style={styles.pausedLabel}>⏸ Duraklatıldı</Text>
            ) : null}
            <View style={styles.actions}>
              {!item.approvedByAdmin ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push(`/(business)/edit-task/${item.id}` as Href)}
                >
                  <Text style={styles.actionText}>Düzenle</Text>
                </TouchableOpacity>
              ) : null}
              {item.approvedByAdmin ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handlePauseToggle(item)}
                  disabled={actionId === item.id}
                >
                  <Text style={styles.actionText}>
                    {item.status === 'paused' ? 'Yeniden Başlat' : 'Duraklat'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={styles.tapHint}>Başvuruları gör →</Text>
          </TouchableOpacity>
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
  pausedLabel: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
    marginTop: Spacing[1],
  },
  actions: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[2] },
  actionBtn: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  tapHint: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing[2],
    fontWeight: '600',
  },
  empty: { alignItems: 'center', paddingTop: Spacing[16] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing[3] },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary },
  emptyText: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: Spacing[1] },
});
