import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import {
  applicationsRepository,
  tasksRepository,
  approveApplicationAndIssueCoupon,
} from '@/features/data';
import { Application, Task } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/constants/taskLabels';
import { Button, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser } = useAuthStore();
  const [application, setApplication] = useState<Application | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const app = await applicationsRepository.getById(id);
    setApplication(app);
    if (app) {
      const t = await tasksRepository.getById(app.taskId);
      setTask(t);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleApprove = async () => {
    if (!application || !firebaseUser) return;
    setActionLoading(true);
    try {
      const coupon = await approveApplicationAndIssueCoupon(
        application.id,
        firebaseUser.uid,
        reviewNote
      );
      Alert.alert(
        'Onaylandı',
        coupon
          ? `Kupon oluşturuldu: ${coupon.couponCode}`
          : 'Başvuru onaylandı.',
        [{ text: 'Tamam', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Hata', 'İşlem tamamlanamadı.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    setActionLoading(true);
    try {
      await applicationsRepository.updateStatus(
        application.id,
        'rejected',
        reviewNote || 'Başvuru reddedildi.'
      );
      Alert.alert('Reddedildi', 'Başvuru reddedildi.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Hata', 'İşlem tamamlanamadı.');
    } finally {
      setActionLoading(false);
    }
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
        <Text style={styles.errorText}>Başvuru bulunamadı.</Text>
      </View>
    );
  }

  const canReview = ['pending', 'submitted'].includes(application.status);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Başvuru Detayı</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </Text>
        </View>

        <Text style={styles.taskTitle}>{task?.title ?? 'Görev'}</Text>
        <Text style={styles.meta}>Kullanıcı: {application.userId.slice(0, 8)}…</Text>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Başvuru mesajı</Text>
          <Text style={styles.blockText}>{application.coverLetter || '—'}</Text>
        </View>

        {application.portfolioUrl ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(application.portfolioUrl!)}
          >
            <Text style={styles.link}>Portfolio linkini aç →</Text>
          </TouchableOpacity>
        ) : null}

        {application.submissionText ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Teslim açıklaması</Text>
            <Text style={styles.blockText}>{application.submissionText}</Text>
          </View>
        ) : null}

        {application.submissionFiles.length > 0 ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Dosyalar</Text>
            {application.submissionFiles.map((url, i) => (
              <Text key={i} style={styles.file}>
                📎 {url}
              </Text>
            ))}
          </View>
        ) : null}

        {canReview && (
          <>
            <Input
              label="Değerlendirme notu (opsiyonel)"
              value={reviewNote}
              onChangeText={setReviewNote}
              placeholder="Onay veya red gerekçesi..."
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
            <View style={styles.actions}>
              <Button
                title="Onayla & Kupon Ver"
                onPress={handleApprove}
                loading={actionLoading}
              />
              <Button
                title="Reddet"
                variant="danger"
                onPress={handleReject}
                loading={actionLoading}
                disabled={actionLoading}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    marginBottom: Spacing[3],
  },
  badgeText: { ...Typography.labelMedium, color: Colors.primaryDark },
  taskTitle: { ...Typography.headingLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  meta: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing[5] },
  block: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  blockTitle: { ...Typography.labelMedium, color: Colors.textPrimary, marginBottom: Spacing[2] },
  blockText: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
  link: { ...Typography.labelMedium, color: Colors.primary, marginBottom: Spacing[4] },
  file: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing[1] },
  actions: { gap: Spacing[3], marginTop: Spacing[4] },
  errorText: { ...Typography.bodyMedium, color: Colors.error },
});
