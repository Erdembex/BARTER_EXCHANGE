import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { notificationsRepository, getNotificationTarget } from '@/features/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { BexNotification } from '@/types';
import { Button } from '@/components/ui';
import { formatRelativeTime } from '@/lib/dateUtils';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface NotificationListScreenProps {
  showBack?: boolean;
}

export function NotificationListScreen({ showBack = false }: NotificationListScreenProps) {
  const { firebaseUser, bexUser } = useAuthStore();
  const { refreshUnread } = useNotifications();
  const [items, setItems] = useState<BexNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!firebaseUser) return;
    const list = await notificationsRepository.getByUser(firebaseUser.uid);
    setItems(list);
    await refreshUnread();
  }, [firebaseUser, refreshUnread]);

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

  const handleMarkAll = async () => {
    if (!firebaseUser) return;
    await notificationsRepository.markAllRead(firebaseUser.uid);
    await load();
  };

  const handlePress = async (item: BexNotification) => {
    if (!firebaseUser) return;

    if (!item.read) {
      await notificationsRepository.markRead(item.id, firebaseUser.uid);
      await refreshUnread();
    }

    const target = getNotificationTarget(item, bexUser?.role);
    if (target) {
      router.push(target);
    }

    await load();
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
            {showBack ? (
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.back}>← Geri</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.title}>Bildirimler</Text>
            {items.some((n) => !n.read) ? (
              <Button
                title="Tümünü okundu işaretle"
                variant="ghost"
                size="sm"
                onPress={handleMarkAll}
                style={{ alignSelf: 'flex-start', marginTop: Spacing[2] }}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
            <Text style={styles.emptyText}>
              Başvuru, kupon, takas ve doğrulama güncellemeleri burada görünür.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => handlePress(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
            <Text style={styles.cardTime}>
              {formatRelativeTime(item.createdAt) || (item.read ? 'Okundu' : 'Yeni')}
            </Text>
          </TouchableOpacity>
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardUnread: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  cardTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  cardBody: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  cardTime: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing[2] },
  empty: { alignItems: 'center', paddingTop: Spacing[12], paddingHorizontal: Spacing[6] },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing[3] },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary, marginBottom: Spacing[1] },
  emptyText: { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
