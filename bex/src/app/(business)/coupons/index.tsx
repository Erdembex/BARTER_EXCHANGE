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
import { parseCouponScan, getCouponDisplayStatus, COUPON_STATUS_LABELS } from '@/lib/couponUtils';
import { CouponQrScanner } from '@/components/business/CouponQrScanner';
import { Button, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function CouponVerifyScreen() {
  const { firebaseUser } = useAuthStore();
  const { business } = useBusiness();
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const resolveCoupon = async (raw: string) => {
    const parsed = parseCouponScan(raw);
    if (!parsed) {
      Alert.alert('Geçersiz kod', 'QR veya kupon kodu okunamadı.');
      return null;
    }

    let found: Coupon | null = null;
    if (parsed.couponId) {
      found = await couponsRepository.getById(parsed.couponId);
    } else if (parsed.couponCode) {
      found = await couponsRepository.getByCode(parsed.couponCode);
      if (found) setCode(found.couponCode);
    }

    if (!found) {
      Alert.alert('Bulunamadı', 'Bu kupon geçersiz veya süresi dolmuş.');
      return null;
    }

    if (found.businessId !== business?.id) {
      Alert.alert('Uyarı', 'Bu kupon başka bir işletmeye ait.');
      return null;
    }

    setCoupon(found);
    return found;
  };

  const handleLookup = async () => {
    if (!code.trim()) return;
    setLoading(true);
    await resolveCoupon(code.trim());
    setLoading(false);
  };

  const handleScan = async (data: string) => {
    setLoading(true);
    await resolveCoupon(data);
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
          Müşterinin QR kodunu okut veya kupon kodunu elle gir.
        </Text>

        <Button
          title="QR Kod Okut"
          onPress={() => setScannerOpen(true)}
          style={{ marginBottom: Spacing[4] }}
        />

        <Input
          label="Kupon kodu"
          value={code}
          onChangeText={setCode}
          placeholder="BEX-XXXX-XXXX"
          autoCapitalize="characters"
        />

        <Button title="Kuponu Bul" onPress={handleLookup} loading={loading} variant="secondary" />

        {coupon && (
          <View style={styles.card}>
            <Text style={styles.cardCode}>{coupon.couponCode}</Text>
            <Text style={styles.reward}>{coupon.rewardDescription}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Durum</Text>
              <Text style={styles.value}>
                {COUPON_STATUS_LABELS[getCouponDisplayStatus(coupon)]}
              </Text>
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
      </ScrollView>

      <CouponQrScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
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
  cardCode: {
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
});
