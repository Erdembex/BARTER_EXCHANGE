import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router, Href } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/authService';
import { isAppCheckReady } from '@/lib/appCheck';
import { isAuthEmulatorActive } from '@/lib/firebase';
import { Button } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

const ROLE_LABELS = {
  user: 'Kullanıcı',
  business: 'İşletme',
  admin: 'Yönetici',
} as const;

export default function ProfileScreen() {
  const { bexUser, firebaseUser, signOut } = useAuthStore();

  const handleLogout = async () => {
    await authService.logout();
    signOut();
    router.replace('/(auth)/onboarding');
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profil</Text>

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
          <Row label="Telefon" value={bexUser?.phone || 'Eklenmedi'} />
          <Row label="Tamamlanan görev" value={String(bexUser?.completedTaskCount ?? 0)} />
          <Row label="İtibar puanı" value={String(bexUser?.reputationScore ?? 0)} />
        </View>

        {!bexUser?.phoneVerified && (
          <Button
            title="Telefonu Doğrula"
            variant="secondary"
            onPress={() => router.push('/(auth)/phone-verification' as Href)}
          />
        )}

        <Button title="Çıkış Yap" variant="outline" onPress={handleLogout} />

        <View style={styles.meta}>
          <Text style={styles.metaText}>BEX v{appVersion}</Text>
          {__DEV__ && (
            <Text style={styles.metaText}>
              {isAuthEmulatorActive() ? 'Emulator modu' : 'Production Firebase'}
              {isAppCheckReady() ? ' · App Check aktif' : ''}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing[5],
    paddingBottom: Spacing[10],
    alignItems: 'center',
    gap: Spacing[4],
  },
  title: {
    ...Typography.headingLarge,
    color: Colors.textPrimary,
    alignSelf: 'flex-start',
  },
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
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], justifyContent: 'center' },
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
  meta: { alignItems: 'center', gap: Spacing[1], marginTop: Spacing[2] },
  metaText: { ...Typography.caption, color: Colors.textTertiary },
});
