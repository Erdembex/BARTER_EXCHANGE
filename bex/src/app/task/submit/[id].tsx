import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { isCurrentApplicationOwner } from '@/features/application/applicationsApi';
import { applicationsRepository, tasksRepository } from '@/features/data';
import { uploadSubmissionFiles } from '@/features/applications/submissionService';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function SubmitTaskScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser } = useAuthStore();
  const { showToast } = useToast();
  const [taskTitle, setTaskTitle] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState<{ uri: string; name: string; mimeType: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadApplication = useCallback(async () => {
    if (!id || !firebaseUser) return;

    setChecking(true);
    setError('');

    const app = await applicationsRepository.getById(id);
    if (!app) {
      setError(t('submitTaskScreen.notFound'));
      setCanSubmit(false);
      setChecking(false);
      return;
    }

    if (!(await isCurrentApplicationOwner(app.userId, firebaseUser.uid))) {
      setError(t('submitTaskScreen.notOwner'));
      setCanSubmit(false);
      setChecking(false);
      return;
    }

    if (app.status !== 'approved') {
      setError(
        app.status === 'submitted'
          ? t('submitTaskScreen.alreadySubmitted')
          : t('submitTaskScreen.notApproved')
      );
      setCanSubmit(false);
      setChecking(false);
      return;
    }

    const task = await tasksRepository.getById(app.taskId);
    setTaskTitle(task?.title ?? t('submitTaskScreen.defaultTask'));
    setCanSubmit(true);
    setChecking(false);
  }, [id, firebaseUser]);

  useFocusEffect(
    useCallback(() => {
      loadApplication();
    }, [loadApplication])
  );

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
    if (!canSubmit) return;

    if (!submissionText.trim() || submissionText.trim().length < 10) {
      setError(t('submitTaskScreen.errorDescMin'));
      return;
    }
    if (files.length === 0) {
      setError(t('submitTaskScreen.errorNoPhoto'));
      return;
    }
    if (!id || !firebaseUser) return;

    setLoading(true);
    setError('');

    try {
      const fileUrls = await uploadSubmissionFiles(id, firebaseUser.uid, files);
      await applicationsRepository.submit(id, submissionText.trim(), fileUrls);
      showToast(t('submitTaskScreen.successToast'));
      router.replace('/(tabs)/applications' as Href);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('submitTaskScreen.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>{t('submitTaskScreen.back')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('submitTaskScreen.title')}</Text>
          {taskTitle ? <Text style={styles.taskTitle}>{taskTitle}</Text> : null}
          <Text style={styles.subtitle}>
            {t('submitTaskScreen.subtitle')}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              {!canSubmit ? (
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing[2] }}>
                  <Text style={styles.backLink}>{t('submitTaskScreen.backToApplication')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {canSubmit ? (
            <>
              <Input
                label={t('submitTaskScreen.descriptionLabel')}
                placeholder={t('submitTaskScreen.descriptionPlaceholder')}
                value={submissionText}
                onChangeText={setSubmissionText}
                multiline
                numberOfLines={6}
              />

              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>{t('submitTaskScreen.photosLabel')}</Text>
                <Button
                  title={t('submitTaskScreen.pickFromGallery')}
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
                        <Text style={styles.removeHint}>{t('submitTaskScreen.remove')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.uploadHint}>{t('submitTaskScreen.noPhotos')}</Text>
                )}
              </View>

              <Button title={t('submitTaskScreen.submit')} onPress={handleSubmit} loading={loading} />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing[5], gap: Spacing[5], paddingBottom: Spacing[10] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  backLink: { ...Typography.labelMedium, color: Colors.primary },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  taskTitle: { ...Typography.bodyLarge, color: Colors.primary, fontWeight: '600' },
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
}));
