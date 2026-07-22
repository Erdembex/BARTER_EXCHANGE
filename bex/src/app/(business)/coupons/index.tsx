import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import { couponsRepository } from '@/features/data';
import { Coupon } from '@/types';
import { parseCouponScan, getCouponDisplayStatus, COUPON_STATUS_LABELS } from '@/lib/couponUtils';
import {
  hasRestAuthSession,
  verifyCouponByToken,
  type CouponVerifyResult,
} from '@/features/coupon/couponsApi';
import {
  fetchIssuedCoupons,
  type BusinessIssuedCoupon,
} from '@/features/coupon/businessCouponsApi';
import { CouponQrScanner } from '@/components/business/CouponQrScanner';
import { Button, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

const ISSUED_STATUS_LABELS: Record<BusinessIssuedCoupon['statusRaw'], string> = {
  DRAFT: 'Taslak',
  ACTIVE: 'Aktif',
  USED: 'Kullanıldı',
  EXPIRED: 'Süresi doldu',
  SWAPPED: 'Takas edildi',
};

function formatDateTime(ts: BusinessIssuedCoupon['issuedAt']): string {
  if (!ts) return '-';
  try {
    return ts.toDate().toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export default function CouponVerifyScreen() {
  const { firebaseUser } = useAuthStore();
  const { business } = useBusiness();
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [history, setHistory] = useState<BusinessIssuedCoupon[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!(await hasRestAuthSession())) return;
    setHistoryLoading(true);
    try {
      setHistory(await fetchIssuedCoupons());
    } catch {
      // sessizce yut; liste boş kalır
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  /** REST modu: QR = qrToken. verify çağrısı kuponu doğrular ve anında kullanıma işaretler. */
  const verifyViaRest = async (rawToken: string) => {
    const token = rawToken.trim();
    if (!token) return;
    try {
      const outcome = await verifyCouponByToken(token);
      const messages: Record<CouponVerifyResult, { title: string; body: string }> = {
        SUCCESS: {
          title: 'Kupon kullanıldı ✓',
          body: `${outcome.rewardDescription} — kupon başarıyla doğrulandı ve kullanıldı.`,
        },
        ALREADY_USED: {
          title: 'Zaten kullanılmış',
          body: 'Bu kupon daha önce kullanılmış.',
        },
        EXPIRED: {
          title: 'Süresi dolmuş',
          body: 'Bu kuponun süresi dolmuş veya aktif değil.',
        },
      };
      const msg = messages[outcome.result];
      Alert.alert(msg.title, msg.body);
      // Doğrulama sonrası geçmişi tazele ki kullanım kaydı görünsün
      await loadHistory();
    } catch (err) {
      Alert.alert('Doğrulanamadı', (err as Error).message || 'Kupon doğrulanamadı.');
    }
  };

  const resolveCoupon = async (raw: string) => {
    if (await hasRestAuthSession()) {
      await verifyViaRest(raw);
      return null;
    }

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

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Dağıtılan Kuponlar</Text>
          {historyLoading && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>
        <Text style={styles.historySubtitle}>
          Oluşturulan kuponların durumu ve kullanım geçmişi.
        </Text>

        {!historyLoading && history.length === 0 && (
          <Text style={styles.emptyText}>Henüz dağıtılmış kupon yok.</Text>
        )}

        {history.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <View style={styles.historyRowMain}>
              <Text style={styles.historyReward} numberOfLines={1}>
                {item.rewardDescription}
              </Text>
              {item.recipientName && (
                <Text style={styles.historyRecipient} numberOfLines={1}>
                  Alıcı: {item.recipientName}
                </Text>
              )}
              <Text style={styles.historyMeta}>
                Verildi: {formatDateTime(item.issuedAt)}
              </Text>
              {item.statusRaw === 'USED' && (
                <Text style={styles.historyUsed}>
                  Kullanıldı: {formatDateTime(item.usedAt)}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.badge,
                item.statusRaw === 'USED' && styles.badgeUsed,
                item.statusRaw === 'EXPIRED' && styles.badgeExpired,
                item.statusRaw === 'SWAPPED' && styles.badgeSwapped,
              ]}
            >
              <Text style={styles.badgeText}>{ISSUED_STATUS_LABELS[item.statusRaw]}</Text>
            </View>
          </View>
        ))}
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
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[8],
  },
  historyTitle: { ...Typography.headingSmall, color: Colors.textPrimary },
  historySubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
    marginBottom: Spacing[3],
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    paddingVertical: Spacing[4],
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  historyRowMain: { flex: 1, marginRight: Spacing[3] },
  historyReward: { ...Typography.labelLarge, color: Colors.textPrimary },
  historyRecipient: {
    ...Typography.bodySmall,
    color: Colors.primary,
    marginTop: Spacing[1],
  },
  historyMeta: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing[1] },
  historyUsed: { ...Typography.bodySmall, color: Colors.success, marginTop: Spacing[1] },
  badge: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
  },
  badgeUsed: { backgroundColor: Colors.successLight },
  badgeExpired: { backgroundColor: Colors.borderLight },
  badgeSwapped: { backgroundColor: Colors.borderLight },
  badgeText: { ...Typography.labelSmall, color: Colors.textPrimary },
});
