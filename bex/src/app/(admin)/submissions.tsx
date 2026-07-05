import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { adminRepository, EnrichedSubmission } from '@/features/admin/adminRepository';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { formatRelativeTime } from '@/lib/dateUtils';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function AdminSubmissionsScreen() {
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<EnrichedSubmission[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const list = await adminRepository.getPendingSubmissions();
    setSubmissions(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleApprove = async (item: EnrichedSubmission) => {
    setLoadingId(item.id);
    try {
      await adminRepository.approveSubmission(item.id);
      showToast('Teslim onaylandı — işletme kupon verebilir.');
      await load();
    } catch {
      showToast('Onaylama başarısız.');
    }
    setLoadingId(null);
  };

  const handleReject = (item: EnrichedSubmission) => {
    const note = rejectNote[item.id]?.trim();
    Alert.alert(
      'Teslimi Reddet',
      'Kullanıcı görevi yeniden teslim edebilir. Red gerekçesi ekle.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            setLoadingId(item.id);
            try {
              await adminRepository.rejectSubmission(
                item.id,
                note || 'İçerik uygunsuz. Lütfen düzeltip tekrar teslim et.'
              );
              showToast('Teslim reddedildi.');
              await load();
            } catch {
              showToast('Reddetme başarısız.');
            }
            setLoadingId(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={submissions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>← Geri</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Teslim Moderasyonu</Text>
            <Text style={styles.subtitle}>
              {submissions.length} teslim incelenmeyi bekliyor
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>İncelenecek teslim yok.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.taskTitle}>{item.taskTitle}</Text>
            <Text style={styles.business}>{item.businessName}</Text>
            <Text style={styles.meta}>
              Başvuran: {item.applicantName}
              {item.submittedAt
                ? ` · ${formatRelativeTime(item.submittedAt)}`
                : ''}
            </Text>

            {item.submissionText ? (
              <Text style={styles.desc}>{item.submissionText}</Text>
            ) : (
              <Text style={styles.descMuted}>Açıklama yok</Text>
            )}

            {item.submissionFiles.length > 0 ? (
              <View style={styles.fileGrid}>
                {item.submissionFiles.map((url, i) => {
                  const resolvedUrl = resolveMediaUrl(url);
                  const isImage =
                    resolvedUrl.startsWith('file:') ||
                    resolvedUrl.startsWith('content:') ||
                    /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(resolvedUrl);

                  if (isImage) {
                    return (
                      <Image key={i} source={{ uri: resolvedUrl }} style={styles.fileImage} />
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => Linking.openURL(resolvedUrl)}
                      style={styles.fileLink}
                    >
                      <Text style={styles.fileLinkText}>📎 Dosya {i + 1}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            <Input
              label="Red gerekçesi (opsiyonel)"
              value={rejectNote[item.id] ?? ''}
              onChangeText={(text) =>
                setRejectNote((prev) => ({ ...prev, [item.id]: text }))
              }
              placeholder="Uygunsuz içerik açıklaması..."
              multiline
              numberOfLines={2}
              style={{ minHeight: 56, textAlignVertical: 'top', marginBottom: Spacing[3] }}
            />

            <View style={styles.actions}>
              <Button
                title="Onayla"
                size="md"
                onPress={() => handleApprove(item)}
                loading={loadingId === item.id}
                style={{ flex: 1 }}
              />
              <Button
                title="Reddet"
                variant="outline"
                size="md"
                onPress={() => handleReject(item)}
                disabled={loadingId === item.id}
                style={{ flex: 1 }}
                textStyle={{ color: Colors.error }}
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing[5], paddingBottom: Spacing[10], flexGrow: 1 },
  header: { marginBottom: Spacing[4] },
  back: { ...Typography.labelMedium, color: Colors.textSecondary, marginBottom: Spacing[2] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  business: { ...Typography.bodySmall, color: Colors.primary, marginBottom: Spacing[1] },
  meta: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing[2] },
  desc: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing[3] },
  descMuted: { ...Typography.bodySmall, color: Colors.textMuted, marginBottom: Spacing[3] },
  fileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[3] },
  fileImage: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  fileLink: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
  },
  fileLinkText: { ...Typography.caption, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  empty: { alignItems: 'center', paddingTop: Spacing[10] },
  emptyText: { ...Typography.bodyMedium, color: Colors.textMuted },
});
