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
import { router, useLocalSearchParams } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { Button, Input } from '@/components/ui';

type Step = 'form' | 'success';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState((params.token ?? '').toString().toUpperCase());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('form');

  const handleSubmit = async () => {
    const normalizedToken = token.trim().toUpperCase();
    if (normalizedToken.length < 8) {
      setError('E-postadaki 8 haneli sıfırlama kodunu gir.');
      return;
    }
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (!/(?=.*[0-9])(?=.*[A-Z])/.test(password)) {
      setError('Şifre en az 1 rakam ve 1 büyük harf içermeli.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.completePasswordReset(normalizedToken, password);
      setStep('success');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      const message =
        (err as Error)?.message || getAuthErrorMessage(code) || 'Şifre güncellenemedi.';
      setError(message);
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
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>

          {step === 'form' ? (
            <>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔐</Text>
              </View>

              <View style={styles.header}>
                <Text style={styles.title}>Yeni Şifre Belirle</Text>
                <Text style={styles.subtitle}>
                  E-postana gelen 8 haneli kodu gir ve yeni şifreni belirle. Kod 1 saat geçerlidir.
                </Text>
              </View>

              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{error}</Text>
                  </View>
                ) : null}

                <Input
                  label="Sıfırlama Kodu"
                  placeholder="AB12CD34"
                  value={token}
                  onChangeText={(value) => setToken(value.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                <Input
                  label="Yeni Şifre"
                  placeholder="En az 8 karakter"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  hint="Büyük harf, küçük harf ve rakam içersin."
                />

                <Input
                  label="Yeni Şifre Tekrar"
                  placeholder="Şifreni tekrar gir"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                />

                <Button title="Şifreyi Güncelle" onPress={handleSubmit} loading={loading} />

                <Button
                  title="Kod gelmedi — tekrar iste"
                  onPress={() => router.replace('/(auth)/forgot-password')}
                  variant="ghost"
                />
              </View>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successEmoji}>✅</Text>
              </View>

              <Text style={styles.successTitle}>Şifren Güncellendi</Text>
              <Text style={styles.successText}>
                Yeni şifrenle giriş yapabilirsin. Eski oturumlar güvenlik için kapatıldı.
              </Text>

              <Button
                title="Giriş Ekranına Git"
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          )}
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
  iconContainer: {
    alignItems: 'center',
    marginTop: Spacing[8],
  },
  icon: {
    fontSize: 64,
  },
  header: {
    gap: Spacing[2],
  },
  title: {
    ...Typography.headingLarge,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    lineHeight: 24,
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
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing[16],
    gap: Spacing[5],
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji: {
    fontSize: 48,
  },
  successTitle: {
    ...Typography.headingLarge,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
