import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { adminRepository } from '@/features/admin';
import { BexUser } from '@/types';
import { Input, Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Colors, Typography, Spacing, Radius } from '@/theme';

const ROLE_LABELS: Record<BexUser['role'], string> = {
  user: 'Kullanıcı',
  business: 'İşletme',
  admin: 'Admin',
};

export default function AdminUsersScreen() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<BexUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUid, setActionUid] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await adminRepository.searchUsers(search);
    setUsers(list);
    setLoading(false);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleBan = (user: BexUser) => {
    const next = !user.isBanned;
    Alert.alert(
      next ? 'Hesabı Askıya Al' : 'Askıyı Kaldır',
      next
        ? `${user.displayName} hesabını askıya almak istediğine emin misin?`
        : `${user.displayName} hesabının askısını kaldırmak istediğine emin misin?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: next ? 'Askıya Al' : 'Kaldır',
          style: next ? 'destructive' : 'default',
          onPress: async () => {
            setActionUid(user.uid);
            try {
              await adminRepository.setUserBanned(user.uid, next);
              showToast(next ? 'Hesap askıya alındı.' : 'Askı kaldırıldı.');
              await load();
            } catch {
              showToast('İşlem başarısız.');
            } finally {
              setActionUid(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Kullanıcı Yönetimi</Text>
      </View>

      <View style={styles.searchRow}>
        <Input
          placeholder="Ad, e-posta veya uid ara..."
          value={search}
          onChangeText={setSearch}
          containerStyle={{ flex: 1 }}
        />
        <Button title="Ara" size="md" fullWidth={false} onPress={load} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Kullanıcı bulunamadı.</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, item.isBanned && styles.cardBanned]}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{item.displayName || '—'}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{ROLE_LABELS[item.role]}</Text>
                </View>
              </View>
              <Text style={styles.email}>{item.email || item.uid}</Text>
              <Text style={styles.meta}>
                Görev: {item.completedTaskCount ?? 0} · İtibar: {item.reputationScore ?? 0}
              </Text>
              {item.isBanned ? (
                <Text style={styles.bannedLabel}>⛔ Askıda</Text>
              ) : null}
              {item.role !== 'admin' ? (
                <Button
                  title={item.isBanned ? 'Askıyı Kaldır' : 'Askıya Al'}
                  variant={item.isBanned ? 'outline' : 'danger'}
                  size="sm"
                  loading={actionUid === item.uid}
                  onPress={() => toggleBan(item)}
                  style={{ marginTop: Spacing[3] }}
                />
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  back: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingMedium, color: Colors.textPrimary },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[3],
    alignItems: 'flex-start',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing[5], paddingTop: 0, gap: Spacing[3], flexGrow: 1 },
  empty: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingTop: Spacing[10],
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing[3],
  },
  cardBanned: { borderColor: Colors.error, opacity: 0.9 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  name: { ...Typography.labelLarge, color: Colors.textPrimary, flex: 1 },
  roleBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  roleText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  email: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  meta: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing[1] },
  bannedLabel: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '700',
    marginTop: Spacing[2],
  },
});
