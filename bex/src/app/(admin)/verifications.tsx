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
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { adminRepository } from '@/features/admin';
import { Business } from '@/types';
import { BUSINESS_CATEGORY_LABELS, VERIFICATION_STATUS_LABELS } from '@/constants/businessLabels';
import { Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function AdminVerificationsScreen() {
  const { showToast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await adminRepository.getPendingVerifications();
    setBusinesses(list);
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

  const handleApprove = async (biz: Business) => {
    setLoadingId(biz.id);
    try {
      await adminRepository.approveBusinessVerification(biz.id);
      showToast(`${biz.name} doğrulandı.`);
      await load();
    } catch {
      showToast('Doğrulama başarısız.');
    }
    setLoadingId(null);
  };

  const handleReject = (biz: Business) => {
    Alert.alert('Evrakı Reddet', `${biz.name} doğrulaması reddedilsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: async () => {
          setLoadingId(biz.id);
          try {
            await adminRepository.rejectBusinessVerification(biz.id);
            showToast('Doğrulama reddedildi.');
            await load();
          } catch {
            showToast('İşlem başarısız.');
          }
          setLoadingId(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={businesses}
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
            <Text style={styles.title}>İşletme Doğrulama</Text>
            <Text style={styles.subtitle}>{businesses.length} evrak incelemede</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Bekleyen evrak yok.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {BUSINESS_CATEGORY_LABELS[item.category]} ·{' '}
              {VERIFICATION_STATUS_LABELS[item.verificationStatus ?? 'pending']}
            </Text>
            <Text style={styles.address}>📍 {item.address}</Text>
            {item.verificationDocumentUrl ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(item.verificationDocumentUrl!)}
              >
                <Text style={styles.docLink}>Evrakı görüntüle →</Text>
              </TouchableOpacity>
            ) : null}
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
  name: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  meta: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing[1] },
  address: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing[2] },
  docLink: { ...Typography.labelMedium, color: Colors.primary, marginBottom: Spacing[4] },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  empty: { alignItems: 'center', paddingTop: Spacing[10] },
  emptyText: { ...Typography.bodyMedium, color: Colors.textMuted },
});
