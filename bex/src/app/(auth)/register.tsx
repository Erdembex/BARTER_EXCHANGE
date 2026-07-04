import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { AUTH_HOME_ROUTE } from '@/lib/authRouting';
import { UserRole } from '@/types';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { Button, Input, BexLogo } from '@/components/ui';

const ROLES: { id: UserRole; label: string; desc: string; emoji: string }[] = [
  {
    id: 'user',
    label: 'Kullanıcı',
    desc: 'Görev al, ödül kazan',
    emoji: '🎯',
  },
  {
    id: 'business',
    label: 'İşletme',
    desc: 'Görev yayınla, yetenek bul',
    emoji: '🏢',
  },
];

export default function RegisterScreen() {
  const { setBexUser, setFirebaseUser } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim() || displayName.trim().length < 2) {
      newErrors.displayName = 'Ad en az 2 karakter olmalıdır.';
    }
    if (!email.trim() || !email.includes('@')) {
      newErrors.email = 'Geçerli bir e-posta girin.';
    }
    if (password.length < 8) {
      newErrors.password = 'Şifre en az 8 karakter olmalıdır.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const { user } = await authService.register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        role,
      });

      const profile = await authService.getUserDocument(user.uid, {
        email: user.email ?? email.trim(),
        displayName: user.displayName ?? displayName.trim(),
      });
      setFirebaseUser(user);
      setBexUser(profile);

      router.replace(AUTH_HOME_ROUTE);
    } catch (err: any) {
      const code: string = err?.code ?? '';
      const message = err?.message || getAuthErrorMessage(code);
      console.error('[RegisterScreen] Kayıt hatası:', code, message);

      if (code === 'auth/email-already-in-use') {
        setErrors({ email: message });
      } else if (code === 'auth/weak-password') {
        setErrors({ password: message });
      } else if (code === 'auth/invalid-email') {
        setErrors({ email: message });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Geri butonu */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>

          {/* Başlık */}
          <View style={styles.header}>
            <BexLogo size="sm" />
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>
              Platformumuza katıl. Ücretsiz, hızlı ve güvenli.
            </Text>
          </View>

          {/* Rol seçimi */}
          <View style={styles.roleSection}>
            <Text style={styles.sectionLabel}>Hesap Türü</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setRole(r.id)}
                  style={[
                    styles.roleCard,
                    role === r.id && styles.roleCardActive,
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={styles.roleEmoji}>{r.emoji}</Text>
                  <Text
                    style={[
                      styles.roleLabel,
                      role === r.id && styles.roleLabelActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                  {role === r.id && (
                    <View style={styles.roleCheck}>
                      <Text style={styles.roleCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errors.general && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            )}

            <Input
              label={role === 'business' ? 'İşletme Adı' : 'Ad Soyad'}
              placeholder={role === 'business' ? 'Kafe Adı, Kuaför...' : 'Adın Soyadın'}
              value={displayName}
              onChangeText={setDisplayName}
              error={errors.displayName}
              autoComplete="name"
              textContentType="name"
            />

            <Input
              label="E-posta"
              placeholder="ornek@email.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />

            {__DEV__ ? (
              <Text style={styles.devHint}>
                Admin paneli testi: admin@bex.dev ile kayıt ol
              </Text>
            ) : null}

            <Input
              label="Şifre"
              placeholder="En az 8 karakter"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              isPassword
              hint="Büyük harf, küçük harf ve rakam içersin."
            />

            <Input
              label="Şifre Tekrar"
              placeholder="Şifreni tekrar gir"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              isPassword
            />

            {/* Gizlilik notu */}
            <Text style={styles.termsText}>
              Kayıt olarak{' '}
              <Text style={styles.termsLink}>Kullanım Koşulları</Text>
              {' '}ve{' '}
              <Text style={styles.termsLink}>Gizlilik Politikası</Text>
              'nı kabul etmiş olursun.
            </Text>

            <Button
              title="Kayıt Ol"
              onPress={handleRegister}
              loading={loading}
            />
          </View>

          {/* Giriş yap linki */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Zaten hesabın var mı? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[8],
    gap: Spacing[6],
  },
  back: {
    alignSelf: 'flex-start',
  },
  backText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  header: {
    gap: Spacing[3],
  },
  title: {
    ...Typography.headingLarge,
    color: Colors.textPrimary,
    marginTop: Spacing[2],
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  roleSection: {
    gap: Spacing[3],
  },
  sectionLabel: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  roleCard: {
    flex: 1,
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 4,
    position: 'relative',
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  roleEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  roleLabel: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  roleLabelActive: {
    color: Colors.textPrimary,
  },
  roleDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  roleCheck: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  form: {
    gap: Spacing[5],
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: Colors.error,
  },
  devHint: {
    ...Typography.caption,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    padding: Spacing[3],
    borderRadius: Radius.md,
    marginTop: -Spacing[2],
  },
  termsText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: -Spacing[2],
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  loginText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  loginLink: {
    ...Typography.labelLarge,
    color: Colors.primary,
  },
});
