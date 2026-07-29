import React, { useCallback, useRef, useState } from 'react';
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
import { router, useLocalSearchParams, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import {
  applicationsRepository,
  tasksRepository,
  approveApplication,
  issueCouponForSubmission,
  usersRepository,
} from '@/features/data';
import { notifyUser } from '@/features/notifications/notificationsRepository';
import { Application, Task, PortfolioItem } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/constants/taskLabels';
import { Button, Input } from '@/components/ui';
import { UserPortfolioGallery } from '@/components/profile/UserPortfolioGallery';
import { ImagePreviewGrid } from '@/components/common/ImagePreviewGrid';
import { ApplicationMessageThread } from '@/components/application/ApplicationMessageThread';
import { canUseApplicationMessages } from '@/features/messages';
import { TaskFeedbackModal } from '@/components/profile/TaskFeedbackModal';
import { submitBusinessFeedback } from '@/features/feedback/feedbackApi';
import { useToast } from '@/components/common/Toast';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser, bexUser } = useAuthStore();
  const { showToast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPortfolio, setApplicantPortfolio] = useState<PortfolioItem[]>([]);
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!id) return;
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const app = await applicationsRepository.getById(id);
      setApplication(app);
      if (app) {
        const t = await tasksRepository.getById(app.taskId);
        setTask(t);
        setApplicantName(await usersRepository.getDisplayName(app.userId));
        setApplicantPortfolio(await usersRepository.getPortfolio(app.userId));
      }
    } catch (err: unknown) {
      setApplication(null);
      Alert.alert(
        'Yüklenemedi',
        err instanceof Error ? err.message : 'Başvuru detayı açılamadı.'
      );
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleApproveApplication = async () => {
    if (!application) return;
    setActionLoading(true);
    try {
      const ok = await approveApplication(application.id, reviewNote);
      Alert.alert(
        ok ? 'Başvuru onaylandı' : 'Onaylanamadı',
        ok
          ? 'Kullanıcı görevi teslim edebilir. Mesajlaşma da açıldı.'
          : 'Bu başvuru onaylanamaz.',
        [{ text: 'Tamam', onPress: () => (ok ? router.back() : undefined) }]
      );
    } catch (err: unknown) {
      Alert.alert(
        'Hata',
        err instanceof Error ? err.message : 'İşlem tamamlanamadı.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueCoupon = async () => {
    if (!application || !firebaseUser) return;
    setActionLoading(true);
    try {
      const coupon = await issueCouponForSubmission(
        application.id,
        firebaseUser.uid,
        reviewNote
      );
      Alert.alert(
        coupon ? 'Kupon oluşturuldu' : 'İşlem başarısız',
        coupon
          ? `Kupon: ${coupon.couponCode}`
          : 'Teslim onaylanamadı.',
        [{ text: 'Tamam', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      Alert.alert(
        'Hata',
        err instanceof Error ? err.message : 'İşlem tamamlanamadı.'
      );
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
      await notifyUser({
        userId: application.userId,
        title: 'Başvurun reddedildi',
        body: reviewNote || 'İşletme başvurunu maalesef kabul etmedi.',
        type: 'application_rejected',
        data: { applicationId: application.id },
        showLocalForUserId: application.userId,
      });
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

  const canApproveApplication = application.status === 'pending';
  const awaitingAdminReview = application.status === 'submitted';
  const canIssueCoupon = application.status === 'submission_approved';

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
        <Text style={styles.meta}>Başvuran: {applicantName || application.userId.slice(0, 8)}</Text>

        <UserPortfolioGallery
          items={applicantPortfolio}
          title="Başvuranın onaylı portföyü"
          subtitle="Admin tarafından onaylanmış geçmiş çalışmalar. Başvuruyu değerlendirmeden önce inceleyin."
          emptyText="Henüz onaylı portföy görseli yok. İlk teslim admin onayından sonra burada görünür."
        />

        {applicantPortfolio.length > 0 ? (
          <Button
            title="Portföyün tamamını gör"
            variant="ghost"
            size="sm"
            onPress={() =>
              router.push({ pathname: '/user/[id]', params: { id: application.userId } } as Href)
            }
            style={{ alignSelf: 'flex-start' }}
          />
        ) : null}

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

        {firebaseUser &&
        bexUser &&
        canUseApplicationMessages(application.status) ? (
          <>
            <ApplicationMessageThread
              applicationId={application.id}
              currentUserId={firebaseUser.uid}
              currentUserRole={bexUser.role}
              peerLabel={applicantName}
              taskTitle={task?.title}
            />
            <Button
              title="Sohbeti tam ekran aç"
              variant="outline"
              onPress={() =>
                router.push(`/(business)/messages/${application.id}` as Href)
              }
            />
          </>
        ) : null}

        {application.submissionText ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Teslim açıklaması</Text>
            <Text style={styles.blockText}>{application.submissionText}</Text>
          </View>
        ) : null}

        {application.submissionFiles.length > 0 ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Teslim dosyaları</Text>
            <ImagePreviewGrid urls={application.submissionFiles} />
          </View>
        ) : null}

        {awaitingAdminReview && (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>
              Admin ekibi teslim içeriğini inceliyor (uygunsuz fotoğraf kontrolü). Onaylandıktan
              sonra buradan kupon verebilirsin.
            </Text>
          </View>
        )}

        {application.status === 'submission_approved' && (
          <View style={[styles.waitingBox, { backgroundColor: Colors.success + '18' }]}>
            <Text style={styles.waitingText}>
              Admin teslimi onayladı. Kupon oluşturmak için aşağıdaki butonu kullan.
            </Text>
          </View>
        )}

        {application.status === 'approved' && (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>
              Kullanıcı görev teslimi bekleniyor. Teslim gelince burada onaylayıp kupon verebilirsin.
            </Text>
          </View>
        )}

        {canApproveApplication && (
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
                title="Başvuruyu Onayla"
                onPress={handleApproveApplication}
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

        {canIssueCoupon && (
          <>
            <Input
              label="Teslim değerlendirme notu (opsiyonel)"
              value={reviewNote}
              onChangeText={setReviewNote}
              placeholder="Kupon notu..."
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
            <View style={styles.actions}>
              <Button
                title="Teslimi Onayla & Kupon Ver"
                onPress={handleIssueCoupon}
                loading={actionLoading}
              />
            </View>
          </>
        )}

        {['submission_approved', 'rewarded', 'approved', 'submitted'].includes(
          application.status
        ) ? (
          <>
            {['submission_approved', 'rewarded'].includes(application.status) ? (
              <Button
                title="Kullanıcıya Geri Bildirim Ver"
                variant="secondary"
                onPress={() => setShowFeedback(true)}
              />
            ) : null}
            <Button
              title="Bu Kullanıcıyı Şikayet Et"
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/complaint/submit-user',
                  params: {
                    applicationId: application.id,
                    applicationLabel: `${task?.title ?? 'Görev'} · ${applicantName}`,
                  },
                })
              }
            />
          </>
        ) : null}
      </ScrollView>

      <TaskFeedbackModal
        visible={showFeedback}
        title="Kullanıcıya geri bildirim"
        onClose={() => setShowFeedback(false)}
        onSubmit={async (stars, comment) => {
          await submitBusinessFeedback(application.id, stars, comment);
          showToast('Geri bildirimin kaydedildi.');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
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
  fileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  fileImage: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  fileLink: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
  },
  file: { ...Typography.bodySmall, color: Colors.textSecondary },
  waitingBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing[4],
    borderRadius: Radius.lg,
    marginBottom: Spacing[3],
  },
  waitingText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  actions: { gap: Spacing[3], marginTop: Spacing[4] },
  errorText: { ...Typography.bodyMedium, color: Colors.error },
});
