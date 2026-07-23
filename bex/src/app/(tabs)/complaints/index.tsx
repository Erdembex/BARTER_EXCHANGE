import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button } from '@/components/ui';
import {
  COMPLAINT_REASON_LABELS,
  fetchMyComplaints,
  fetchPublicComplaints,
  type ComplaintDto,
  type PublicComplaintDto,
} from '@/features/complaint/complaintsApi';
import { formatShortDate } from '@/lib/dateUtils';
import { Timestamp } from 'firebase/firestore';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function ComplaintBexScreen() {
  const [publicItems, setPublicItems] = useState<PublicComplaintDto[]>([]);
  const [myItems, setMyItems] = useState<ComplaintDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [pub, mine] = await Promise.all([
      fetchPublicComplaints().catch(() => []),
      fetchMyComplaints().catch(() => []),
    ]);
    setPublicItems(pub);
    setMyItems(mine);
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

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Şikayet BEX" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Text style={styles.lead}>
          Admin onayından geçen şikayetler burada listelenir. Haklı bulunan işletmeler etiketli
          görünür.
        </Text>

        <Button
          title="İşletme Şikayet Et"
          onPress={() => router.push('/complaint/submit' as Href)}
        />

        <Text style={styles.sectionTitle}>Onaylı şikayetler ({publicItems.length})</Text>
        {publicItems.length === 0 ? (
          <Text style={styles.empty}>Henüz yayınlanmış şikayet yok.</Text>
        ) : (
          publicItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/business/${item.businessProfileId}` as Href)}
            >
              <View style={styles.tag}>
                <Text style={styles.tagText}>⚠ Şikayet BEX</Text>
              </View>
              <Text style={styles.cardTitle}>{item.businessName}</Text>
              <Text style={styles.cardMeta}>
                {COMPLAINT_REASON_LABELS[item.reason]} ·{' '}
                {item.approvedAt
                  ? formatShortDate(Timestamp.fromDate(new Date(item.approvedAt)))
                  : '—'}
              </Text>
              <Text style={styles.cardBody} numberOfLines={3}>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {myItems.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Şikayetlerim</Text>
            {myItems.map((item) => (
              <View key={item.id} style={styles.myCard}>
                <Text style={styles.cardTitle}>{item.businessName}</Text>
                <Text style={styles.cardMeta}>
                  {COMPLAINT_REASON_LABELS[item.reason]} · {item.status}
                </Text>
                <Text style={styles.cardBody} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  lead: { ...Typography.bodyMedium, color: Colors.textMuted, lineHeight: 22 },
  sectionTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginTop: Spacing[2] },
  empty: { ...Typography.bodySmall, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.error + '55',
    gap: Spacing[2],
  },
  myCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[1],
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.error + '18',
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  tagText: { ...Typography.caption, color: Colors.error, fontWeight: '700' },
  cardTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  cardMeta: { ...Typography.caption, color: Colors.textMuted },
  cardBody: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
});
