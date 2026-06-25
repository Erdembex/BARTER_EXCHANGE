import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { tasksRepository, applicationsRepository, EnrichedTask } from '@/features/data';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/common/Toast';
import { Button, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function ApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser } = useAuthStore();
  const { showToast } = useToast();
  const [task, setTask] = useState<EnrichedTask | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) tasksRepository.getEnrichedById(id).then(setTask);
  }, [id]);

  const handleSubmit = async () => {
    if (!coverLetter.trim() || coverLetter.trim().length < 20) {
      setError('Lütfen en az 20 karakterlik bir açıklama yaz.');
      return;
    }
    if (!firebaseUser || !task) return;

    setLoading(true);
    setError('');

    try {
      await applicationsRepository.create(firebaseUser.uid, {
        taskId: task.id,
        businessId: task.businessId,
        coverLetter: coverLetter.trim(),
        portfolioUrl: portfolioUrl.trim() || undefined,
      });
      showToast('Başvurun gönderildi!');
      router.replace('/(tabs)/applications' as Href);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Başvuru gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Başvuru Yap</Text>
          {task && (
            <View style={styles.taskPreview}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskReward}>🎁 {task.rewardDescription}</Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Neden bu göreve uygunsun?"
            placeholder="Deneyimlerini, becerilerini ve motivasyonunu anlat..."
            value={coverLetter}
            onChangeText={setCoverLetter}
            multiline
            numberOfLines={5}
          />

          <Input
            label="Portfolio / örnek çalışma linki (opsiyonel)"
            placeholder="https://..."
            value={portfolioUrl}
            onChangeText={setPortfolioUrl}
            keyboardType="url"
            autoCapitalize="none"
          />

          <Button title="Başvuruyu Gönder" onPress={handleSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[5], paddingBottom: Spacing[10] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  taskPreview: {
    padding: Spacing[4],
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    gap: Spacing[2],
  },
  taskTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  taskReward: { ...Typography.bodySmall, color: Colors.textSecondary },
  errorBox: {
    backgroundColor: Colors.errorLight,
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: { ...Typography.bodySmall, color: Colors.error },
});
