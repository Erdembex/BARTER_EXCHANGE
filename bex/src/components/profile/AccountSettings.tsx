import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, Href } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/authService';
import { BexUser } from '@/types';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Colors, Typography, Spacing, Radius } from '@/theme';

const ROLE_LABELS = {
  user: 'Kullanıcı',
  business: 'İşletme',
  admin: 'Yönetici',
} as const;

interface AccountSettingsProps {
  bexUser: BexUser | null;
  onUserUpdated: (user: BexUser | null) => void;
  showAdminLink?: boolean;
}

export function AccountSettings({
  bexUser,
  onUserUpdated,
  showAdminLink = true,
}: AccountSettingsProps) {
  const { firebaseUser } = useAuthStore();
  const { showToast } = useToast();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(bexUser?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!firebaseUser) return;
    setSavingName(true);
    try {
      const updated = await authService.updateDisplayName(firebaseUser.uid, nameDraft);
      onUserUpdated(updated);
      setEditingName(false);
      showToast('Adın güncellendi.');
    } catch {
      showToast('Ad güncellenemedi.');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(bexUser?.displayName ?? '?').charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text style={styles.name}>{bexUser?.displayName ?? 'Kullanıcı'}</Text>
      <Text style={styles.email}>{bexUser?.email ?? firebaseUser?.email ?? '—'}</Text>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {ROLE_LABELS[bexUser?.role ?? 'user']}
          </Text>
        </View>
        {bexUser?.phoneVerified ? (
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Text style={[styles.badgeText, styles.badgeSuccessText]}>
              ✓ Telefon doğrulandı
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        {editingName ? (
          <View style={styles.editBlock}>
            <Input
              label="Görünen ad"
              value={nameDraft}
              onChangeText={setNameDraft}
              autoCapitalize="words"
            />
            <View style={styles.editActions}>
              <Button
                title="Kaydet"
                size="sm"
                onPress={handleSaveName}
                loading={savingName}
                style={{ flex: 1 }}
              />
              <Button
                title="Vazgeç"
                variant="ghost"
                size="sm"
                onPress={() => {
                  setEditingName(false);
                  setNameDraft(bexUser?.displayName ?? '');
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <>
            <Row label="Telefon" value={bexUser?.phone || 'Eklenmedi'} />
            <Row label="Tamamlanan görev" value={String(bexUser?.completedTaskCount ?? 0)} />
            <Row label="İtibar puanı" value={String(bexUser?.reputationScore ?? 0)} />
            <Button
              title="Adı Düzenle"
              variant="outline"
              size="sm"
              onPress={() => {
                setNameDraft(bexUser?.displayName ?? '');
                setEditingName(true);
              }}
            />
          </>
        )}
      </View>

      {showAdminLink && bexUser?.role === 'admin' && (
        <Button
          title="Admin Paneli"
          onPress={() => router.push('/(admin)/panel' as Href)}
        />
      )}

      {!bexUser?.phoneVerified && (
        <Button
          title="Telefonu Doğrula"
          variant="secondary"
          onPress={() => router.push('/(auth)/phone-verification' as Href)}
        />
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: Colors.primaryDark },
  name: { ...Typography.headingMedium, color: Colors.textPrimary },
  email: { ...Typography.bodyMedium, color: Colors.textSecondary },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeSuccess: {
    backgroundColor: Colors.success + '18',
    borderColor: Colors.success,
  },
  badgeText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  badgeSuccessText: { color: Colors.success },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[3],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing[3],
  },
  rowLabel: { ...Typography.bodySmall, color: Colors.textMuted },
  rowValue: { ...Typography.labelMedium, color: Colors.textPrimary },
  editBlock: { gap: Spacing[3] },
  editActions: { flexDirection: 'row', gap: Spacing[2] },
});
