import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, Href } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/authService';
import { getRestProfileId } from '@/lib/auth/sessionClaims';
import { BexUser } from '@/types';
import { Button, Input } from '@/components/ui';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    if (!firebaseUser) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin gerekli', 'Profil fotoğrafı için galeri erişimine izin ver.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const updated = await authService.updateAvatar(
        firebaseUser.uid,
        asset.uri,
        asset.mimeType ?? 'image/jpeg',
        asset.fileName ?? 'avatar.jpg'
      );
      onUserUpdated(updated);
      showToast('Profil fotoğrafın güncellendi.');
    } catch {
      showToast('Profil fotoğrafı yüklenemedi.');
    } finally {
      setUploadingAvatar(false);
    }
  };

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
      <ProfileAvatar
        name={bexUser?.displayName}
        avatarUrl={bexUser?.avatarUrl}
        size={88}
        editable
        loading={uploadingAvatar}
        onPress={handlePickAvatar}
      />
      <Text style={styles.avatarHint}>Fotoğrafı değiştirmek için dokun</Text>

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

      {bexUser?.role === 'user' ? (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{bexUser.completedTaskCount ?? 0}</Text>
            <Text style={styles.statLabel}>Tamamlanan görev</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{bexUser.reputationScore ?? 0}</Text>
            <Text style={styles.statLabel}>İtibar puanı</Text>
          </View>
        </View>
      ) : null}

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

      {bexUser?.role === 'user' && firebaseUser ? (
        <Button
          title="Herkese Açık Profilim"
          variant="outline"
          onPress={async () => {
            const profileId = (await getRestProfileId()) ?? firebaseUser.uid;
            router.push(`/user/${profileId}` as Href);
          }}
        />
      ) : null}

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
  avatarHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: -Spacing[2],
  },
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    width: '100%',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { ...Typography.headingMedium, color: Colors.primaryDark },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
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
