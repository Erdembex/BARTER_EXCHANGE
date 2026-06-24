import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { AUTH_HOME_ROUTE } from '@/lib/authRouting';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { Button } from '@/components/ui';

const OTP_LENGTH = 6;

export default function PhoneVerificationScreen() {
  const goNext = () => {
    router.replace(AUTH_HOME_ROUTE);
  };
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');

  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Geçerli bir telefon numarası girin.');
      return;
    }

    setLoading(true);
    setError('');

    // TODO: Firebase Phone Auth entegrasyonu buraya gelecek
    // Şimdilik simüle ediyoruz
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      setResendTimer(60);
    }, 1200);
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Sonraki kutuya geç
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Lütfen 6 haneli kodu girin.');
      return;
    }

    setLoading(true);
    setError('');

    // TODO: Firebase Phone Auth verification
    setTimeout(() => {
      setLoading(false);
      goNext();
    }, 1200);
  };

  const handleSkip = () => {
    goNext();
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
          {step === 'phone' && (
            <TouchableOpacity onPress={handleSkip} style={styles.skip}>
              <Text style={styles.skipText}>Daha Sonra</Text>
            </TouchableOpacity>
          )}

          {/* İkon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBg}>
              <Text style={styles.icon}>📱</Text>
            </View>
          </View>

          {step === 'phone' ? (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Telefonu Doğrula</Text>
                <Text style={styles.subtitle}>
                  Hesabının güvenliğini artırmak için telefon numaranı doğrula.
                  Opsiyonel — atlayabilirsin.
                </Text>
              </View>

              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Telefon input */}
                <View style={styles.phoneContainer}>
                  <View style={styles.dialCode}>
                    <Text style={styles.dialCodeText}>🇹🇷 +90</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="5XX XXX XX XX"
                    placeholderTextColor={Colors.textTertiary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={13}
                  />
                </View>

                <Button
                  title="Kod Gönder"
                  onPress={handleSendOTP}
                  loading={loading}
                />

                <Button
                  title="Şimdilik Atla"
                  onPress={handleSkip}
                  variant="ghost"
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Kodu Gir</Text>
                <Text style={styles.subtitle}>
                  <Text style={styles.phoneHighlight}>{phone}</Text>
                  {' '}numarasına 6 haneli doğrulama kodu gönderdik.
                </Text>
              </View>

              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* OTP kutuları */}
                <View style={styles.otpRow}>
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(ref) => { otpRefs.current[i] = ref; }}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : null,
                      ]}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(val, i)}
                      onKeyPress={({ nativeEvent }) =>
                        handleOtpKeyPress(nativeEvent.key, i)
                      }
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      selectionColor={Colors.primary}
                    />
                  ))}
                </View>

                <Button
                  title="Doğrula"
                  onPress={handleVerifyOTP}
                  loading={loading}
                />

                {/* Tekrar gönder */}
                <View style={styles.resendRow}>
                  <Text style={styles.resendText}>Kod gelmedi mi? </Text>
                  {resendTimer > 0 ? (
                    <Text style={styles.resendTimer}>{resendTimer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOTP}>
                      <Text style={styles.resendLink}>Tekrar Gönder</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Telefonu değiştir */}
                <TouchableOpacity
                  style={styles.changePhone}
                  onPress={() => {
                    setStep('phone');
                    setOtp(Array(OTP_LENGTH).fill(''));
                  }}
                >
                  <Text style={styles.changePhoneText}>
                    Telefon numarasını değiştir
                  </Text>
                </TouchableOpacity>
              </View>
            </>
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
  skip: {
    alignSelf: 'flex-end',
  },
  skipText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Spacing[6],
  },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
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
  phoneHighlight: {
    color: Colors.textPrimary,
    fontWeight: '600',
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
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
  },
  phoneContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  dialCode: {
    paddingHorizontal: Spacing[4],
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
  },
  dialCodeText: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  otpBox: {
    flex: 1,
    height: 58,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  resendLink: {
    ...Typography.labelMedium,
    color: Colors.primary,
  },
  resendTimer: {
    ...Typography.labelMedium,
    color: Colors.textTertiary,
  },
  changePhone: {
    alignItems: 'center',
  },
  changePhoneText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textDecorationLine: 'underline',
  },
});
