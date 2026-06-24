import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useBusiness } from '@/features/business/useBusiness';
import { submitBusinessVerification } from '@/features/business/verificationService';
import { VERIFICATION_STATUS_LABELS } from '@/constants/businessLabels';
import { Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function BusinessVerificationScreen() {
  const { business, reload } = useBusiness();
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const status = business?.verificationStatus ?? 'none';
  const canUpload = status === 'none' || status === 'rejected';

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setSelectedFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
    });
  };

  const handleSubmit = async () => {
    if (!business || !selectedFile) return;

    setUploading(true);
    try {
      await submitBusinessVerification(business, selectedFile);
      showToast('Evrak yüklendi. İnceleme bekleniyor.');
      setSelectedFile(null);
      await reload();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Evrak yüklenemedi.';
      showToast(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>İşletme Doğrulama</Text>
        <Text style={styles.subtitle}>
          Güven ortamı için vergi levhası, işletme belgesi veya resmi evrak
          yükleyin. Admin onayından sonra doğrulanmış rozet alırsınız.
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Durum</Text>
          <Text style={styles.statusValue}>
            {VERIFICATION_STATUS_LABELS[status]}
          </Text>
        </View>

        {status === 'verified' && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✓ İşletmeniz doğrulandı. Müşteriler güven rozetinizi görebilir.
            </Text>
          </View>
        )}

        {status === 'pending' && (
          <View style={styles.pendingBox}>
            <Text style={styles.pendingText}>
              Evrakınız inceleniyor. Sonuç bildirimle iletilecek.
            </Text>
          </View>
        )}

        {canUpload && (
          <>
            <Button
              title={selectedFile ? 'Dosyayı Değiştir' : 'PDF veya Fotoğraf Seç'}
              variant="outline"
              onPress={pickDocument}
            />

            {selectedFile && (
              <View style={styles.fileCard}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileType}>{selectedFile.mimeType}</Text>
              </View>
            )}

            <Button
              title="Evrakı Gönder"
              onPress={handleSubmit}
              loading={uploading}
              disabled={!selectedFile}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing[1],
  },
  statusLabel: { ...Typography.caption, color: Colors.textTertiary },
  statusValue: { ...Typography.headingSmall, color: Colors.primary },
  successBox: {
    backgroundColor: Colors.successLight,
    padding: Spacing[4],
    borderRadius: Radius.md,
  },
  successText: { ...Typography.bodySmall, color: Colors.success },
  pendingBox: {
    backgroundColor: Colors.warningLight,
    padding: Spacing[4],
    borderRadius: Radius.md,
  },
  pendingText: { ...Typography.bodySmall, color: Colors.warning },
  fileCard: {
    backgroundColor: Colors.surface,
    padding: Spacing[4],
    borderRadius: Radius.md,
    gap: Spacing[1],
  },
  fileName: { ...Typography.labelMedium, color: Colors.textPrimary },
  fileType: { ...Typography.caption, color: Colors.textTertiary },
});
