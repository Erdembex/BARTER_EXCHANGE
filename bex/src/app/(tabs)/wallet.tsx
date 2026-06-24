import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { couponsRepository, businessesRepository } from '@/features/data';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { getCouponDisplayStatus } from '@/lib/couponUtils';
import { Coupon } from '@/types';
import { CouponCard, CouponQrModal } from '@/components/wallet';
import { Colors, Typography, Spacing } from '@/theme';

export default function WalletScreen() {
  const { firebaseUser } = useAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [businessNames, setBusinessNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const load = useCallback(async () => {
    if (!firebaseUser) return;

    if (shouldUseDemoData()) {
      demoStore.ensureSampleCouponForUser(firebaseUser.uid);
    }

    setLoading(true);
    const list = await couponsRepository.getByUser(firebaseUser.uid);
    setCoupons(list);

    const names: Record<string, string> = {};
    for (const c of list) {
      if (!names[c.businessId]) {
        const biz = await businessesRepository.getById(c.businessId);
        names[c.businessId] = biz?.name ?? 'İşletme';
      }
    }
    setBusinessNames(names);
    setLoading(false);
  }, [firebaseUser]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const active = coupons.filter((c) => getCouponDisplayStatus(c) === 'active');
  const archive = coupons.filter((c) => getCouponDisplayStatus(c) !== 'active');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Kuponlarım</Text>
          <Text style={styles.subtitle}>
            {active.length} aktif · {archive.length} arşiv
          </Text>
        </View>

        {coupons.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎟️</Text>
            <Text style={styles.emptyTitle}>Henüz kupon yok</Text>
            <Text style={styles.emptyText}>
              Görev tamamlayıp işletme onayı aldığında kuponlar burada görünür.
            </Text>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={styles.section}>Aktif Kuponlar</Text>
                {active.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    businessName={businessNames[coupon.businessId]}
                    onPress={() => setSelectedCoupon(coupon)}
                  />
                ))}
              </>
            )}

            {archive.length > 0 && (
              <>
                <Text style={[styles.section, styles.sectionArchive]}>Arşiv</Text>
                {archive.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    businessName={businessNames[coupon.businessId]}
                    onPress={() => setSelectedCoupon(coupon)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <CouponQrModal
        coupon={selectedCoupon}
        businessName={
          selectedCoupon ? businessNames[selectedCoupon.businessId] : undefined
        }
        visible={!!selectedCoupon}
        onClose={() => setSelectedCoupon(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], flexGrow: 1 },
  header: { marginBottom: Spacing[4] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  section: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
  },
  sectionArchive: {
    marginTop: Spacing[4],
    color: Colors.textSecondary,
  },
  empty: { alignItems: 'center', paddingTop: Spacing[16] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing[3] },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
    textAlign: 'center',
  },
});
