import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { couponsRepository, businessesRepository } from '@/features/data';
import { fetchRestCoupons, hasRestAuthSession } from '@/features/coupon/couponsApi';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { getCouponDisplayStatus } from '@/lib/couponUtils';
import { Coupon } from '@/types';
import { router, Href } from 'expo-router';
import { CouponCard, CouponQrModal } from '@/components/wallet';
import { WalletSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button } from '@/components/ui';
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

    setLoading(true);

    let list: Coupon[] = [];
    let usedRest = false;

    if (await hasRestAuthSession()) {
      try {
        list = await fetchRestCoupons();
        usedRest = true;
      } catch {
        list = [];
      }
    }

    if (!usedRest) {
      if (shouldUseDemoData()) {
        demoStore.ensureSampleCouponForUser(firebaseUser.uid);
      }
      list = await couponsRepository.getByUser(firebaseUser.uid);
    }

    setCoupons(list);

    const names: Record<string, string> = {};
    for (const c of list) {
      if (c.businessName) names[c.businessId] = c.businessName;
      if (!names[c.businessId]) {
        const biz = await businessesRepository.getById(c.businessId);
        names[c.businessId] = biz?.name ?? c.businessName ?? 'İşletme';
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
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Cüzdan" />
        <WalletSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Cüzdan" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            {active.length} aktif · {archive.length} arşiv
          </Text>
        </View>

        {coupons.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>▣</Text>
            <Text style={styles.emptyTitle}>Henüz kupon yok</Text>
            <Text style={styles.emptyText}>
              Görev tamamlayıp işletme onayı aldığında kuponlar burada görünür.
            </Text>
            <Button
              title="Görevlere Göz At"
              onPress={() => router.push('/(tabs)/tasks' as Href)}
              style={{ marginTop: Spacing[5], alignSelf: 'stretch' }}
            />
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={styles.section}>Aktif Kuponlar</Text>
                {active.map((coupon, index) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    businessName={businessNames[coupon.businessId]}
                    onPress={() => setSelectedCoupon(coupon)}
                    variant={index === 0 ? 'hero' : 'default'}
                    layout="stack"
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
  scroll: { padding: Spacing[5], paddingTop: Spacing[2], paddingBottom: Spacing[10], flexGrow: 1 },
  header: {
    marginBottom: Spacing[4],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  section: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
    fontWeight: '700',
  },
  sectionArchive: {
    marginTop: Spacing[5],
    color: Colors.textSecondary,
  },
  empty: { alignItems: 'center', paddingTop: Spacing[16] },
  emptyIcon: {
    fontSize: 40,
    color: Colors.primary,
    marginBottom: Spacing[3],
    fontWeight: '300',
  },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
    textAlign: 'center',
    lineHeight: 22,
  },
});
