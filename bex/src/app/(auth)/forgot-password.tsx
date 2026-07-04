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
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { Button, Input } from '@/components/ui';

type Step = 'form' | 'success';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('form');

  const handleReset = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(email.trim());
      setStep('success');
    } catch (err: any) {
      const code = err?.code ?? '';
      const message = err?.message || getAuthErrorMessage(code);
      if (code === 'auth/not-supported-yet') {
        setError(message);
      } else if (code === 'auth/user-not-found') {
        setError('Bu e-posta adresiyle kayıtlı hesap bulunamadı.');
      } else {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
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
          {/* Geri */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>

          {step === 'form' ? (
            <>
              {/* Başlık */}
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔑</Text>
              </View>

              <View style={styles.header}>
                <Text style={styles.title}>Şifremi Unuttum</Text>
                <Text style={styles.subtitle}>
                  E-posta adresini gir. Şifre sıfırlama bağlantısını gönderelim.
                </Text>
              </View>

              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{error}</Text>
                  </View>
                ) : null}

                <Input
                  label="E-posta"
                  placeholder="ornek@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                />

                <Button
                  title="Sıfırlama Bağlantısı Gönder"
                  onPress={handleReset}
                  loading={loading}
                />

                <Button
                  title="Giriş ekranına dön"
                  onPress={() => router.back()}
                  variant="ghost"
                />
              </View>
            </>
          ) : (
            /* Başarı durumu */
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successEmoji}>✉️</Text>
              </View>

              <Text style={styles.successTitle}>E-posta Gönderildi!</Text>
              <Text style={styles.successText}>
                <Text style={styles.emailHighlight}>{email}</Text>
                {' '}adresine şifre sıfırlama bağlantısı gönderdik.{'\n\n'}
                Spam klasörünü de kontrol etmeyi unutma.
              </Text>

              <View style={styles.successActions}>
                <Button
                  title="Giriş Ekranına Dön"
                  onPress={() => router.replace('/(auth)/login')}
                />
                <Button
                  title="Tekrar Gönder"
                  onPress={() => setStep('form')}
                  variant="outline"
                />
              </View>
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

  // Başarı durumu
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
  emailHighlight: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  successActions: {
    width: '100%',
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
});
