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
  Image,
} from 'react-native';
import { router, useLocalSearchParams, Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { applicationsRepository } from '@/features/data';
import { uploadSubmissionFiles } from '@/features/applications/submissionService';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function SubmitTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser } = useAuthStore();
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState<{ uri: string; name: string; mimeType: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (result.canceled || !result.assets?.length) return;

    const picked = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName ?? `photo-${index + 1}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    }));

    setFiles((prev) => [...prev, ...picked].slice(0, 5));
  };

  const removeFile = (uri: string) => {
    setFiles((prev) => prev.filter((f) => f.uri !== uri));
  };

  const handleSubmit = async () => {
    if (!submissionText.trim() || submissionText.trim().length < 10) {
      setError('Lütfen çalışmanı en az 10 karakterle açıkla.');
      return;
    }
    if (!id || !firebaseUser) return;

    setLoading(true);
    setError('');

    try {
      const fileUrls = await uploadSubmissionFiles(id, firebaseUser.uid, files);
      await applicationsRepository.submit(id, submissionText.trim(), fileUrls);
      router.replace('/(tabs)/applications' as Href);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Teslim edilemedi.');
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
            Tamamladığın çalışmayı açıkla ve kanıt fotoğrafları ekle.
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

          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>Kanıt fotoğrafları (en fazla 5)</Text>
            <Button
              title="Galeriden Seç"
              variant="outline"
              size="md"
              onPress={pickImages}
            />
            {files.length > 0 ? (
              <View style={styles.previewRow}>
                {files.map((file) => (
                  <TouchableOpacity
                    key={file.uri}
                    style={styles.thumbWrap}
                    onPress={() => removeFile(file.uri)}
                  >
                    <Image source={{ uri: file.uri }} style={styles.thumb} />
                    <Text style={styles.removeHint}>Kaldır</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.uploadHint}>Henüz fotoğraf eklenmedi.</Text>
            )}
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
  uploadSection: { gap: Spacing[3] },
  uploadLabel: { ...Typography.labelMedium, color: Colors.textPrimary },
  uploadHint: { ...Typography.bodySmall, color: Colors.textMuted },
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  thumbWrap: { alignItems: 'center', gap: 4 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  removeHint: { ...Typography.caption, color: Colors.error },
});
