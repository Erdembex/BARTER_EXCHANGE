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
import { getCouponDisplayStatus, COUPON_STATUS_LABELS, isCouponExpiringSoon } from '@/lib/couponUtils';
import { Coupon } from '@/types';
import { router, Href } from 'expo-router';
import { CouponCard, CouponQrModal } from '@/components/wallet';
import { WalletSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function WalletScreen() {
  const { firebaseUser } = useAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [businessNames, setBusinessNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const load = useCallback(async () => {
    if (!firebaseUser) return;

    setLoading(true);
    setLoadError(null);

    let list: Coupon[] = [];
    let usedRest = false;

    if (await hasRestAuthSession()) {
      try {
        list = await fetchRestCoupons();
        usedRest = true;
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Kuponlar yüklenemedi.');
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

  const active = coupons.filter((c) => {
    const s = getCouponDisplayStatus(c);
    return s === 'active' || s === 'pending';
  });
  const used = coupons.filter((c) => getCouponDisplayStatus(c) === 'exhausted');
  const swapped = coupons.filter((c) => getCouponDisplayStatus(c) === 'traded');
  const expired = coupons.filter((c) => getCouponDisplayStatus(c) === 'expired');
  const expiringSoon = active.filter((c) => isCouponExpiringSoon(c));
  const historyCount = used.length + swapped.length + expired.length;

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
            {active.length} aktif · {historyCount} geçmiş
            {expiringSoon.length > 0 ? ` · ${expiringSoon.length} yakında bitiyor` : ''}
          </Text>
        </View>

        {expiringSoon.length > 0 && (
          <View style={styles.expiringBanner}>
            <Text style={styles.expiringText}>
              {expiringSoon.length} kuponun süresi 3 gün içinde dolacak. Kullanmayı unutma.
            </Text>
          </View>
        )}

        {loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Button title="Tekrar dene" variant="outline" onPress={load} />
          </View>
        ) : null}

        {coupons.length === 0 && !loadError ? (
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

            {historyCount > 0 && (
              <>
                <Text style={[styles.section, styles.sectionArchive]}>Geçmiş</Text>

                {used.length > 0 && (
                  <>
                    <Text style={styles.historyGroup}>Kullanılan</Text>
                    {used.map((coupon) => (
                      <CouponCard
                        key={coupon.id}
                        coupon={coupon}
                        businessName={businessNames[coupon.businessId]}
                        onPress={() => setSelectedCoupon(coupon)}
                      />
                    ))}
                  </>
                )}

                {swapped.length > 0 && (
                  <>
                    <Text style={styles.historyGroup}>Takas edilen</Text>
                    {swapped.map((coupon) => (
                      <CouponCard
                        key={coupon.id}
                        coupon={coupon}
                        businessName={businessNames[coupon.businessId]}
                        onPress={() => setSelectedCoupon(coupon)}
                      />
                    ))}
                  </>
                )}

                {expired.length > 0 && (
                  <>
                    <Text style={styles.historyGroup}>
                      {COUPON_STATUS_LABELS.expired}
                    </Text>
                    {expired.map((coupon) => (
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
  expiringBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginBottom: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  expiringText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
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
  historyGroup: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing[2],
    marginTop: Spacing[1],
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
  errorBox: {
    padding: Spacing[4],
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  errorText: { ...Typography.bodySmall, color: Colors.error, lineHeight: 20 },
});
