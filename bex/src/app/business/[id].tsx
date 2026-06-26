import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { businessesRepository, tasksRepository, EnrichedTask } from '@/features/data';
import { Business } from '@/types';
import { BUSINESS_CATEGORY_LABELS } from '@/constants/businessLabels';
import { TaskCard } from '@/components/tasks';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [biz, taskList] = await Promise.all([
      businessesRepository.getById(id),
      tasksRepository.getPublicActiveByBusiness(id),
    ]);
    setBusiness(biz);
    setTasks(taskList);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>İşletme bulunamadı.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Geri dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{business.name.charAt(0)}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.name}>{business.name}</Text>
            <Text style={styles.category}>
              {BUSINESS_CATEGORY_LABELS[business.category]}
            </Text>
          </View>
          {business.isVerified ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Doğrulanmış</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.address}>📍 {business.address}</Text>
        <Text style={styles.score}>
          ⭐ {business.reputationScore} · {business.totalTasksPublished} görev yayınladı
        </Text>

        <Text style={styles.sectionTitle}>Aktif Görevler</Text>
        {tasks.length === 0 ? (
          <Text style={styles.empty}>Şu an açık görev yok.</Text>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskWrap}>
              <TaskCard
                task={task}
                businessName={business.name}
                compact
                onPress={() => router.push(`/task/${task.id}` as Href)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  backLink: { ...Typography.labelMedium, color: Colors.primary },
  error: { ...Typography.bodyMedium, color: Colors.error },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  logo: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 28, fontWeight: '800', color: Colors.textOnPrimary },
  heroText: { flex: 1, gap: 4 },
  name: { ...Typography.headingLarge, color: Colors.textPrimary },
  category: { ...Typography.bodySmall, color: Colors.textSecondary },
  verifiedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  verifiedText: { ...Typography.caption, color: Colors.success, fontWeight: '700' },
  address: { ...Typography.bodyMedium, color: Colors.textSecondary },
  score: { ...Typography.bodySmall, color: Colors.textTertiary },
  sectionTitle: { ...Typography.headingSmall, color: Colors.textPrimary, marginTop: Spacing[2] },
  empty: { ...Typography.bodyMedium, color: Colors.textTertiary },
  taskWrap: { marginBottom: Spacing[3] },
});
