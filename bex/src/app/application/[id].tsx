import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { applicationsRepository, tasksRepository } from '@/features/data';
import { Application } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/constants/taskLabels';
import { Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser } = useAuthStore();
  const { showToast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const app = await applicationsRepository.getById(id);
    setApplication(app);
    if (app) {
      const task = await tasksRepository.getById(app.taskId);
      setTaskTitle(task?.title ?? 'Görev');
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const canCancel =
    application &&
    firebaseUser &&
    application.userId === firebaseUser.uid &&
    ['pending', 'approved'].includes(application.status);

  const handleCancel = () => {
    if (!application || !firebaseUser) return;

    Alert.alert(
      'Başvuruyu İptal Et',
      'Bu başvuruyu iptal etmek istediğine emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const ok = await applicationsRepository.cancel(
              application.id,
              firebaseUser.uid
            );
            setCancelling(false);
            if (ok) {
              showToast('Başvurun iptal edildi.');
              await load();
            } else {
              showToast('Başvuru iptal edilemedi.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Başvuru bulunamadı.</Text>
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

        <Text style={styles.title}>Başvuru Detayı</Text>
        <Text style={styles.taskTitle}>{taskTitle}</Text>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </Text>
        </View>

        <Text style={styles.section}>Ön Yazı</Text>
        <Text style={styles.body}>{application.coverLetter || '—'}</Text>

        {application.portfolioUrl ? (
          <>
            <Text style={styles.section}>Portfolio</Text>
            <Text style={styles.link}>{application.portfolioUrl}</Text>
          </>
        ) : null}

        {application.submissionText ? (
          <>
            <Text style={styles.section}>Teslim Açıklaması</Text>
            <Text style={styles.body}>{application.submissionText}</Text>
          </>
        ) : null}

        {canCancel && (
          <Button
            title="Başvuruyu İptal Et"
            variant="outline"
            onPress={handleCancel}
            loading={cancelling}
            style={styles.cancelBtn}
            textStyle={{ color: Colors.error }}
          />
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
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  taskTitle: { ...Typography.bodyLarge, color: Colors.textSecondary },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
  },
  statusText: { ...Typography.labelMedium, color: Colors.primary },
  section: { ...Typography.labelLarge, color: Colors.textPrimary, marginTop: Spacing[2] },
  body: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
  link: { ...Typography.bodySmall, color: Colors.info },
  cancelBtn: { marginTop: Spacing[4], borderColor: Colors.error },
});
