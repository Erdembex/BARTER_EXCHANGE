import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { useBusiness } from '@/features/business/useBusiness';
import { tasksRepository } from '@/features/data';
import { Task, TaskCategory, TaskDifficulty } from '@/types';
import { ALL_CATEGORIES, CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/constants/taskLabels';
import { Button, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

const DIFFICULTIES: TaskDifficulty[] = ['easy', 'medium', 'hard'];

interface FormState {
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  estimatedHours: string;
  rewardDescription: string;
  rewardQuantity: string;
  maxApplicants: string;
  deadlineDays: string;
}

function taskToForm(task: Task): FormState {
  const daysLeft = Math.max(
    1,
    Math.ceil((task.deadline.toMillis() - Date.now()) / 86400000)
  );
  return {
    title: task.title,
    description: task.description,
    category: task.category,
    difficulty: task.difficulty,
    estimatedHours: String(task.estimatedHours),
    rewardDescription: task.rewardDescription,
    rewardQuantity: String(task.rewardQuantity),
    maxApplicants: String(task.maxApplicants),
    deadlineDays: String(daysLeft),
  };
}

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { business } = useBusiness();
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    tasksRepository.getById(id).then((task) => {
      if (!task) {
        setError('Görev bulunamadı.');
        setLoading(false);
        return;
      }
      if (task.approvedByAdmin) {
        setError('Onaylanmış görevler düzenlenemez. Duraklatmayı deneyebilirsin.');
      }
      setForm(taskToForm(task));
      setLoading(false);
    });
  }, [id]);

  const update = (patch: Partial<FormState>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));

  const handleSave = async () => {
    if (!business || !id || !form) return;
    if (form.title.trim().length < 5) {
      setError('Başlık en az 5 karakter olmalı.');
      return;
    }
    if (form.description.trim().length < 20) {
      setError('Açıklama en az 20 karakter olmalı.');
      return;
    }
    if (!form.rewardDescription.trim()) {
      setError('Ödül açıklaması gerekli.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await tasksRepository.update(id, business.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        difficulty: form.difficulty,
        estimatedHours: parseInt(form.estimatedHours, 10) || 1,
        rewardDescription: form.rewardDescription.trim(),
        rewardQuantity: parseInt(form.rewardQuantity, 10) || 1,
        maxApplicants: parseInt(form.maxApplicants, 10) || 1,
        deadline: Timestamp.fromDate(
          new Date(Date.now() + parseInt(form.deadlineDays, 10) * 86400000)
        ),
      });
      Alert.alert('Kaydedildi', 'Görev güncellendi.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!form) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Görev yüklenemedi.'}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Geri</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Görevi Düzenle</Text>
          <Text style={styles.subtitle}>Yalnızca admin onayı bekleyen görevler düzenlenebilir.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Input label="Görev başlığı" value={form.title} onChangeText={(t) => update({ title: t })} />
          <Input
            label="Açıklama"
            value={form.description}
            onChangeText={(t) => update({ description: t })}
            multiline
            numberOfLines={5}
          />
          <Text style={styles.fieldLabel}>Kategori</Text>
          <View style={styles.chips}>
            {ALL_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, form.category === cat && styles.chipActive]}
                onPress={() => update({ category: cat })}
              >
                <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input
            label="Ödül açıklaması"
            value={form.rewardDescription}
            onChangeText={(t) => update({ rewardDescription: t })}
          />
          <Input
            label="Maksimum başvuru"
            value={form.maxApplicants}
            onChangeText={(t) => update({ maxApplicants: t })}
            keyboardType="number-pad"
          />
          <Input
            label="Son başvuru (gün)"
            value={form.deadlineDays}
            onChangeText={(t) => update({ deadlineDays: t })}
            keyboardType="number-pad"
          />

          <Button title="Kaydet" onPress={handleSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
  scroll: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  back: { ...Typography.labelMedium, color: Colors.textSecondary },
  backLink: { ...Typography.labelMedium, color: Colors.primary },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textMuted },
  fieldLabel: { ...Typography.labelMedium, color: Colors.textPrimary, marginTop: Spacing[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.labelMedium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.textOnPrimary },
  error: { ...Typography.bodySmall, color: Colors.error },
});
