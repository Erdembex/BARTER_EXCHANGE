import React, { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { useBusiness } from '@/features/business/useBusiness';
import { tasksRepository } from '@/features/data';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { TaskCategory, TaskDifficulty, CreateTask } from '@/types';
import { ALL_CATEGORIES, CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/constants/taskLabels';
import { StepIndicator } from '@/components/business';
import { Button, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

const STEPS = ['Temel Bilgiler', 'Ödül', 'Gereksinimler', 'Önizleme'];
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

const initialForm: FormState = {
  title: '',
  description: '',
  category: 'design',
  difficulty: 'medium',
  estimatedHours: '4',
  rewardDescription: '',
  rewardQuantity: '1',
  maxApplicants: '3',
  deadlineDays: '14',
};

export default function CreateTaskScreen() {
  const { business } = useBusiness();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const validateStep = (): boolean => {
    setError('');
    if (step === 0) {
      if (form.title.trim().length < 5) {
        setError('Başlık en az 5 karakter olmalı.');
        return false;
      }
      if (form.description.trim().length < 20) {
        setError('Açıklama en az 20 karakter olmalı.');
        return false;
      }
    }
    if (step === 1 && !form.rewardDescription.trim()) {
      setError('Ödül açıklaması gerekli.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!business) return;
    setLoading(true);
    setError('');

    try {
      const loc = shouldUseDemoData()
        ? demoStore.defaultLocation
        : business.location;

      const data: CreateTask = {
        businessId: business.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        difficulty: form.difficulty,
        estimatedHours: parseInt(form.estimatedHours, 10) || 1,
        rewardDescription: form.rewardDescription.trim(),
        rewardQuantity: parseInt(form.rewardQuantity, 10) || 1,
        maxApplicants: parseInt(form.maxApplicants, 10) || 1,
        status: 'active',
        location: loc,
        deadline: Timestamp.fromDate(
          new Date(Date.now() + parseInt(form.deadlineDays, 10) * 86400000)
        ),
      };

      await tasksRepository.create(business.id, data);

      Alert.alert(
        'Görev gönderildi',
        'Görevin admin onayına gönderildi. Onaylandıktan sonra kullanıcılara görünür olacak.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(business)/tasks');
              }
            },
          },
        ]
      );
    } catch {
      setError('Görev oluşturulamadı. Tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Görev Oluştur</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepIndicator steps={STEPS} currentStep={step} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {step === 0 && (
            <View style={styles.section}>
              <Input
                label="Görev başlığı"
                value={form.title}
                onChangeText={(t) => update({ title: t })}
                placeholder="Örn: Sosyal medya içerik paketi"
              />
              <Input
                label="Açıklama"
                value={form.description}
                onChangeText={(t) => update({ description: t })}
                placeholder="Görevin detaylarını yaz..."
                multiline
                numberOfLines={5}
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />
              <Text style={styles.fieldLabel}>Kategori</Text>
              <View style={styles.chips}>
                {ALL_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, form.category === cat && styles.chipActive]}
                    onPress={() => update({ category: cat })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        form.category === cat && styles.chipTextActive,
                      ]}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Zorluk</Text>
              <View style={styles.chips}>
                {DIFFICULTIES.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, form.difficulty === d && styles.chipActive]}
                    onPress={() => update({ difficulty: d })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        form.difficulty === d && styles.chipTextActive,
                      ]}
                    >
                      {DIFFICULTY_LABELS[d]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label="Tahmini süre (saat)"
                value={form.estimatedHours}
                onChangeText={(t) => update({ estimatedHours: t })}
                keyboardType="number-pad"
              />
            </View>
          )}

          {step === 1 && (
            <View style={styles.section}>
              <Input
                label="Ödül açıklaması"
                value={form.rewardDescription}
                onChangeText={(t) => update({ rewardDescription: t })}
                placeholder="Örn: 5 ücretsiz kahve"
              />
              <Input
                label="Ödül adedi (kupon kullanım hakkı)"
                value={form.rewardQuantity}
                onChangeText={(t) => update({ rewardQuantity: t })}
                keyboardType="number-pad"
                hint="Kullanıcı kuponu kaç kez kullanabilir?"
              />
              <Input
                label="Maksimum başvuru sayısı"
                value={form.maxApplicants}
                onChangeText={(t) => update({ maxApplicants: t })}
                keyboardType="number-pad"
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.section}>
              <Input
                label="Son başvuru (gün)"
                value={form.deadlineDays}
                onChangeText={(t) => update({ deadlineDays: t })}
                keyboardType="number-pad"
                hint="Bugünden itibaren kaç gün geçerli?"
              />
            </View>
          )}

          {step === 3 && (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>{form.title}</Text>
              <Text style={styles.previewDesc}>{form.description}</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Ödül</Text>
                <Text style={styles.previewValue}>{form.rewardDescription}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Kategori</Text>
                <Text style={styles.previewValue}>{CATEGORY_LABELS[form.category]}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Zorluk</Text>
                <Text style={styles.previewValue}>{DIFFICULTY_LABELS[form.difficulty]}</Text>
              </View>
              <View style={styles.previewNote}>
                <Text style={styles.previewNoteText}>
                  Görev yayınlandığında kullanıcılar Görevler sekmesinde görebilir.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            {step > 0 && (
              <Button
                title="Geri"
                variant="outline"
                onPress={() => setStep(step - 1)}
                style={styles.halfBtn}
              />
            )}
            <Button
              title={step === STEPS.length - 1 ? 'Yayınla' : 'İleri'}
              onPress={handleNext}
              loading={loading}
              style={step > 0 ? styles.halfBtn : undefined}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
  },
  back: { ...Typography.labelMedium, color: Colors.textSecondary },
  screenTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  section: { gap: Spacing[1] },
  fieldLabel: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[3] },
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
  preview: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  previewTitle: { ...Typography.headingMedium, color: Colors.textPrimary, marginBottom: Spacing[2] },
  previewDesc: { ...Typography.bodyMedium, color: Colors.textSecondary, marginBottom: Spacing[4] },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  previewLabel: { ...Typography.bodySmall, color: Colors.textTertiary },
  previewValue: { ...Typography.labelMedium, color: Colors.textPrimary },
  previewNote: {
    marginTop: Spacing[4],
    backgroundColor: Colors.primaryLight,
    padding: Spacing[3],
    borderRadius: Radius.md,
  },
  previewNoteText: { ...Typography.bodySmall, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[6] },
  halfBtn: { flex: 1 },
  error: { ...Typography.bodySmall, color: Colors.error, marginBottom: Spacing[3] },
});
