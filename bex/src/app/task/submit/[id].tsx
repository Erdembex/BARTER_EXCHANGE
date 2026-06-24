import React, { useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { applicationsRepository } from '@/features/data';
import { Button, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function SubmitTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [submissionText, setSubmissionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!submissionText.trim() || submissionText.trim().length < 10) {
      setError('Lütfen çalışmanı en az 10 karakterle açıkla.');
      return;
    }
    if (!id) return;

    setLoading(true);
    setError('');

    try {
      if (id.startsWith('demo-')) {
        router.replace('/(tabs)/home');
        return;
      }
      await applicationsRepository.submit(id, submissionText.trim(), []);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err?.message ?? 'Teslim edilemedi.');
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

          <Text style={styles.title}>Görevi Teslim Et</Text>
          <Text style={styles.subtitle}>
            Tamamladığın çalışmayı açıkla. Dosya yükleme FAZ 5'te eklenecek.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Çalışma açıklaması"
            placeholder="Ne yaptın, nasıl teslim ediyorsun..."
            value={submissionText}
            onChangeText={setSubmissionText}
            multiline
            numberOfLines={6}
          />

          <View style={styles.uploadHint}>
            <Text style={styles.uploadIcon}>📎</Text>
            <Text style={styles.uploadText}>
              Fotoğraf/dosya yükleme yakında aktif olacak
            </Text>
          </View>

          <Button title="Görevi Teslim Et" onPress={handleSubmit} loading={loading} />
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
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
  errorBox: {
    backgroundColor: Colors.errorLight,
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: { ...Typography.bodySmall, color: Colors.error },
  uploadHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  uploadIcon: { fontSize: 24 },
  uploadText: { ...Typography.bodySmall, color: Colors.textTertiary, flex: 1 },
});
