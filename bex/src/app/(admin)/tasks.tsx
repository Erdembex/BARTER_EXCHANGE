import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { adminRepository } from '@/features/admin';
import type { EnrichedTask } from '@/features/data/businessesRepository';
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/constants/taskLabels';
import { Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function AdminTasksScreen() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await adminRepository.getPendingTasks();
    setTasks(list);
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

  const handleApprove = async (task: EnrichedTask) => {
    setLoadingId(task.id);
    try {
      await adminRepository.approveTask(task.id);
      showToast('Görev onaylandı — kullanıcılara görünür.');
      await load();
    } catch {
      showToast('Onaylama başarısız.');
    }
    setLoadingId(null);
  };

  const handleReject = (task: EnrichedTask) => {
    Alert.alert('Görevi Reddet', `"${task.title}" yayından kaldırılsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: async () => {
          setLoadingId(task.id);
          try {
            await adminRepository.rejectTask(task.id);
            showToast('Görev reddedildi.');
            await load();
          } catch {
            showToast('Reddetme başarısız.');
          }
          setLoadingId(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>← Geri</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Görev Moderasyonu</Text>
            <Text style={styles.subtitle}>{tasks.length} onay bekliyor</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Onay bekleyen görev yok.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.business}>{item.businessName}</Text>
            <Text style={styles.meta}>
              {CATEGORY_LABELS[item.category]} · {DIFFICULTY_LABELS[item.difficulty]} · 🎁{' '}
              {item.rewardDescription}
            </Text>
            <Text style={styles.desc} numberOfLines={3}>
              {item.description}
            </Text>
            <View style={styles.actions}>
              <Button
                title="Onayla"
                size="md"
                onPress={() => handleApprove(item)}
                loading={loadingId === item.id}
                style={{ flex: 1 }}
              />
              <Button
                title="Reddet"
                variant="outline"
                size="md"
                onPress={() => handleReject(item)}
                disabled={loadingId === item.id}
                style={{ flex: 1 }}
                textStyle={{ color: Colors.error }}
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing[5], paddingBottom: Spacing[10], flexGrow: 1 },
  header: { marginBottom: Spacing[4] },
  back: { ...Typography.labelMedium, color: Colors.textSecondary, marginBottom: Spacing[2] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  business: { ...Typography.bodySmall, color: Colors.primary, marginBottom: Spacing[1] },
  meta: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing[2] },
  desc: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing[4] },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  empty: { alignItems: 'center', paddingTop: Spacing[10] },
  emptyText: { ...Typography.bodyMedium, color: Colors.textMuted },
});
