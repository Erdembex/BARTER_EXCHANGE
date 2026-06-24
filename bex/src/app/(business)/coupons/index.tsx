import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import { couponsRepository } from '@/features/data';
import { Coupon } from '@/types';
import { Button, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function CouponVerifyScreen() {
  const { firebaseUser } = useAuthStore();
  const { business } = useBusiness();
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const found = await couponsRepository.getByCode(code.trim());
    setCoupon(found);
    if (!found) {
      Alert.alert('Bulunamadı', 'Bu kupon kodu geçersiz.');
    } else if (found.businessId !== business?.id) {
      Alert.alert('Uyarı', 'Bu kupon başka bir işletmeye ait.');
      setCoupon(null);
    }
    setLoading(false);
  };

  const handleRedeem = async () => {
    if (!coupon || !firebaseUser) return;
    setLoading(true);
    const updated = await couponsRepository.redeem(coupon.id, firebaseUser.uid);
    if (updated) {
      setCoupon(updated);
      Alert.alert(
        'Kullanıldı',
        `Kalan hak: ${updated.totalUses - updated.usedCount}/${updated.totalUses}`
      );
    } else {
      Alert.alert('Hata', 'Kupon kullanılamadı. Süresi dolmuş veya tükenmiş olabilir.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Kupon Doğrula</Text>
        <Text style={styles.subtitle}>
          Müşterinin kupon kodunu gir veya QR kodu okut (FAZ 5).
        </Text>

        <Input
          label="Kupon kodu"
          value={code}
          onChangeText={setCode}
          placeholder="BEX-XXXX-XXXX"
          autoCapitalize="characters"
        />

        <Button title="Kuponu Bul" onPress={handleLookup} loading={loading} />

        {coupon && (
          <View style={styles.card}>
            <Text style={styles.code}>{coupon.couponCode}</Text>
            <Text style={styles.reward}>{coupon.rewardDescription}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Durum</Text>
              <Text style={styles.value}>{coupon.status}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Kullanım</Text>
              <Text style={styles.value}>
                {coupon.usedCount} / {coupon.totalUses}
              </Text>
            </View>
            {coupon.status === 'active' && coupon.usedCount < coupon.totalUses && (
              <Button
                title="Kullanımı Onayla"
                onPress={handleRedeem}
                loading={loading}
                style={{ marginTop: Spacing[4] }}
              />
            )}
          </View>
        )}

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            QR okuyucu FAZ 5 ile eklenecek. Şimdilik kupon kodu ile doğrulama yapabilirsin.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, marginBottom: Spacing[6] },
  card: {
    marginTop: Spacing[6],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  code: {
    ...Typography.headingMedium,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  reward: { ...Typography.bodyLarge, color: Colors.textPrimary, marginBottom: Spacing[4] },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  label: { ...Typography.bodySmall, color: Colors.textTertiary },
  value: { ...Typography.labelMedium, color: Colors.textPrimary },
  hint: {
    marginTop: Spacing[6],
    backgroundColor: Colors.surface,
    padding: Spacing[4],
    borderRadius: Radius.md,
  },
  hintText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
});
