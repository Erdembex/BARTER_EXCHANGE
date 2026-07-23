import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import {
  approveComplaintAdmin,
  COMPLAINT_REASON_LABELS,
  COMPLAINT_TARGET_LABELS,
  fetchPendingComplaintsAdmin,
  rejectComplaintAdmin,
  type ComplaintModerationDto,
} from '@/features/complaint/complaintsApi';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function AdminComplaintsScreen() {
  const { showToast } = useToast();
  const [items, setItems] = useState<ComplaintModerationDto[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const list = await fetchPendingComplaintsAdmin().catch(() => []);
    setItems(list);
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

  const handleApprove = async (item: ComplaintModerationDto) => {
    setLoadingId(item.id);
    try {
      await approveComplaintAdmin(item.id, item.targetType, notes[item.id]?.trim() || undefined);
      showToast('Şikayet onaylandı.');
      await load();
    } catch {
      showToast('Onaylama başarısız.');
    }
    setLoadingId(null);
  };

  const handleReject = (item: ComplaintModerationDto) => {
    Alert.alert('Şikayeti Reddet', 'Bu şikayet yayınlanmayacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: async () => {
          setLoadingId(item.id);
          try {
            await rejectComplaintAdmin(
              item.id,
              item.targetType,
              notes[item.id]?.trim() || 'Şikayet incelendi, yayına alınmadı.'
            );
            showToast('Şikayet reddedildi.');
            await load();
          } catch {
            showToast('Reddetme başarısız.');
          }
          setLoadingId(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.back} onPress={() => router.back()}>
              ← Geri
            </Text>
            <Text style={styles.title}>Şikayet Moderasyonu</Text>
            <Text style={styles.subtitle}>
              İşletme ve kullanıcı şikayetleri. Onaylanan şikayetler %30 eşiğini aşınca Tehlikeli
              rozeti görünür.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Bekleyen şikayet yok.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.business}>{item.targetName}</Text>
            <Text style={styles.meta}>
              {COMPLAINT_TARGET_LABELS[item.targetType]} · {COMPLAINT_REASON_LABELS[item.reason]} ·{' '}
              {item.status}
            </Text>
            <Text style={styles.body}>{item.description}</Text>
            <Input
              label="Admin notu (isteğe bağlı)"
              value={notes[item.id] ?? ''}
              onChangeText={(text) => setNotes((prev) => ({ ...prev, [item.id]: text }))}
              placeholder="Onay/red gerekçesi"
            />
            <View style={styles.actions}>
              <Button
                title="Onayla"
                size="sm"
                onPress={() => handleApprove(item)}
                loading={loadingId === item.id}
                style={{ flex: 1 }}
              />
              <Button
                title="Reddet"
                variant="outline"
                size="sm"
                onPress={() => handleReject(item)}
                loading={loadingId === item.id}
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
  list: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  header: { gap: Spacing[2], marginBottom: Spacing[4] },
  back: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 20 },
  empty: { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing[8] },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  business: { ...Typography.labelLarge, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textMuted },
  body: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: Spacing[2] },
});
