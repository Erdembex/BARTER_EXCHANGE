import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, Href } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { getRestProfileId } from '@/lib/auth/sessionClaims';
import { BexUser } from '@/types';
import { Button, Input } from '@/components/ui';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { CompletedTasksModal } from '@/components/profile/CompletedTasksList';
import { usersRepository } from '@/features/data';
import { CompletedTask } from '@/types';
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
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(bexUser?.username ?? '');
  const [savingName, setSavingName] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [myCompletedTasks, setMyCompletedTasks] = useState<CompletedTask[]>([]);
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [restMode, setRestMode] = useState(false);

  useEffect(() => {
    hasRestAuthSession().then(setRestMode);
  }, []);

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
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Profil fotoğrafı yüklenemedi.';
      showToast(message);
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

  const handleSaveUsername = async () => {
    if (!firebaseUser) return;
    setSavingUsername(true);
    try {
      const updated = await authService.updateUsername(firebaseUser.uid, usernameDraft);
      onUserUpdated(updated);
      setEditingUsername(false);
      showToast('Kullanıcı adın güncellendi.');
    } catch (error) {
      const code = (error as { code?: string }).code;
      const message = code
        ? getAuthErrorMessage(code)
        : error instanceof Error && error.message
          ? error.message
          : 'Kullanıcı adı güncellenemedi.';
      showToast(message);
    } finally {
      setSavingUsername(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 8) {
      showToast('Yeni şifre en az 8 karakter olmalı.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Yeni şifreler eşleşmiyor.');
      return;
    }

    setSavingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Şifren güncellendi.');
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Şifre güncellenemedi.';
      showToast(message);
    } finally {
      setSavingPassword(false);
    }
  };

  const publicProfileHref =
    bexUser?.role === 'user' && bexUser.username
      ? (`/user/u/${bexUser.username}` as Href)
      : null;

  const handleOpenCompletedTasks = async () => {
    const stats = await usersRepository.getMyPublicProfileStats();
    setMyCompletedTasks(stats?.completedTasks ?? []);
    setShowTasksModal(true);
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
      {bexUser?.role === 'user' && bexUser.username ? (
        <Text style={styles.username}>@{bexUser.username}</Text>
      ) : null}
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
          <TouchableOpacity style={styles.statBox} onPress={handleOpenCompletedTasks}>
            <Text style={styles.statValue}>{bexUser.completedTaskCount ?? 0}</Text>
            <Text style={styles.statLabel}>Tamamlanan görev</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{bexUser.reputationScore ?? 0}</Text>
            <Text style={styles.statLabel}>İtibar puanı</Text>
          </View>
        </View>
      ) : null}

      <CompletedTasksModal
        visible={showTasksModal}
        onClose={() => setShowTasksModal(false)}
        tasks={myCompletedTasks}
        totalCount={bexUser?.completedTaskCount}
      />

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
        ) : editingUsername && bexUser?.role === 'user' ? (
          <View style={styles.editBlock}>
            <Input
              label="Kullanıcı adı"
              value={usernameDraft}
              onChangeText={(text) => setUsernameDraft(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="ornek_kullanici"
            />
            <Text style={styles.usernameHint}>
              İşletmeler seni bu adla arayabilir. 3-30 karakter, a-z, 0-9 ve _ kullanılabilir.
            </Text>
            <View style={styles.editActions}>
              <Button
                title="Kaydet"
                size="sm"
                onPress={handleSaveUsername}
                loading={savingUsername}
                style={{ flex: 1 }}
              />
              <Button
                title="Vazgeç"
                variant="ghost"
                size="sm"
                onPress={() => {
                  setEditingUsername(false);
                  setUsernameDraft(bexUser?.username ?? '');
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : editingPassword ? (
          <View style={styles.editBlock}>
            <Input
              label="Mevcut şifre"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Input
              label="Yeni şifre"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Input
              label="Yeni şifre (tekrar)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.editActions}>
              <Button
                title="Kaydet"
                size="sm"
                onPress={handleSavePassword}
                loading={savingPassword}
                style={{ flex: 1 }}
              />
              <Button
                title="Vazgeç"
                variant="ghost"
                size="sm"
                onPress={() => {
                  setEditingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <>
            <Row label="Telefon" value={bexUser?.phone || 'Eklenmedi'} />
            {bexUser?.role === 'user' ? (
              <Row
                label="Kullanıcı adı"
                value={bexUser.username ? `@${bexUser.username}` : 'Belirlenmedi'}
              />
            ) : null}
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
            {bexUser?.role === 'user' ? (
              <Button
                title="Kullanıcı Adını Düzenle"
                variant="outline"
                size="sm"
                onPress={() => {
                  setUsernameDraft(bexUser?.username ?? '');
                  setEditingUsername(true);
                }}
              />
            ) : null}
            {restMode ? (
              <Button
                title="Şifreyi Değiştir"
                variant="outline"
                size="sm"
                onPress={() => setEditingPassword(true)}
              />
            ) : null}
          </>
        )}
      </View>

      {publicProfileHref ? (
        <Button
          title="Herkese Açık Profilim"
          variant="outline"
          onPress={() => router.push(publicProfileHref)}
        />
      ) : bexUser?.role === 'user' && firebaseUser ? (
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

      {!bexUser?.phoneVerified && !restMode && (
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
  username: { ...Typography.labelMedium, color: Colors.primary },
  usernameHint: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
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
