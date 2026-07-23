import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  cancelSubscriptionAtPeriodEnd,
  createBillingPortalSession,
  createSubscriptionCheckout,
  fetchBusinessSubscription,
  fetchSubscriptionInvoices,
  fetchSubscriptionPlans,
  SubscriptionInvoice,
  SubscriptionPlan,
  BusinessSubscription,
} from '@/features/subscription/subscriptionApi';
import { BackHeader } from '@/components/navigation/BackHeader';
import { Button } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function BusinessSubscriptionScreen() {
  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sub, planList, invoiceList] = await Promise.all([
        fetchBusinessSubscription(),
        fetchSubscriptionPlans(),
        fetchSubscriptionInvoices(),
      ]);
      setSubscription(sub);
      setPlans(planList);
      setInvoices(invoiceList);
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Abonelik yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const openCheckout = async (planId: string, period: 'MONTHLY' | 'YEARLY') => {
    setActionLoading(true);
    try {
      const url = await createSubscriptionCheckout(planId, period);
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Ödeme başlatılamadı.');
    } finally {
      setActionLoading(false);
    }
  };

  const openPortal = async () => {
    setActionLoading(true);
    try {
      const url = await createBillingPortalSession();
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Portal açılamadı.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Aboneliği İptal Et',
      'Dönem sonunda abonelik sona erecek. Devam?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal et',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await cancelSubscriptionAtPeriodEnd();
              await load();
              Alert.alert('Tamam', 'Abonelik dönem sonunda iptal edilecek.');
            } catch (err) {
              Alert.alert('Hata', err instanceof Error ? err.message : 'İptal edilemedi.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <BackHeader title="Abonelik" />
        <View style={styles.center}>
          <Text style={styles.muted}>Yükleniyor…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader title="Abonelik" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {subscription ? (
          <View style={styles.currentCard}>
            <Text style={styles.planName}>{subscription.planDisplayName}</Text>
            <Text style={styles.planMeta}>
              Durum: {subscription.status}
              {subscription.cancelAtPeriodEnd ? ' · Dönem sonunda iptal' : ''}
            </Text>
            {subscription.currentPeriodEnd ? (
              <Text style={styles.planMeta}>
                Dönem bitişi:{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('tr-TR')}
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.section}>Planlar</Text>
        {plans.map((plan) => {
          const isCurrent = subscription?.planName === plan.name;
          return (
            <View key={plan.id} style={styles.planCard}>
              <Text style={styles.planTitle}>{plan.displayName}</Text>
              <Text style={styles.planPrice}>
                {plan.priceMonthly} ₺/ay · {plan.priceYearly} ₺/yıl
              </Text>
              {Object.entries(plan.features).slice(0, 4).map(([key, value]) => (
                <Text key={key} style={styles.feature}>
                  • {key}: {value}
                </Text>
              ))}
              {!isCurrent ? (
                <View style={styles.planActions}>
                  <Button
                    title="Aylık yükselt"
                    variant="outline"
                    disabled={actionLoading}
                    onPress={() => openCheckout(plan.id, 'MONTHLY')}
                  />
                  <Button
                    title="Yıllık yükselt"
                    disabled={actionLoading}
                    onPress={() => openCheckout(plan.id, 'YEARLY')}
                  />
                </View>
              ) : (
                <Text style={styles.currentBadge}>Mevcut plan</Text>
              )}
            </View>
          );
        })}

        <View style={styles.actions}>
          <Button title="Fatura & ödeme yönetimi" variant="secondary" onPress={openPortal} />
          {!subscription?.cancelAtPeriodEnd ? (
            <Button title="Dönem sonunda iptal et" variant="outline" onPress={handleCancel} />
          ) : null}
        </View>

        {invoices.length > 0 ? (
          <>
            <Text style={styles.section}>Faturalar</Text>
            {invoices.map((inv) => (
              <View key={inv.id} style={styles.invoiceRow}>
                <Text style={styles.invoiceAmount}>
                  {inv.amount} {inv.currency}
                </Text>
                <Text style={styles.invoiceStatus}>{inv.status}</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { ...Typography.bodyMedium, color: Colors.textSecondary },
  currentCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  planName: { ...Typography.headingMedium, color: Colors.textPrimary },
  planMeta: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  section: { ...Typography.labelLarge, fontWeight: '700', color: Colors.textPrimary },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[2],
  },
  planTitle: { ...Typography.labelLarge, fontWeight: '700' },
  planPrice: { ...Typography.bodySmall, color: Colors.textSecondary },
  feature: { ...Typography.caption, color: Colors.textSecondary },
  planActions: { gap: Spacing[2], marginTop: Spacing[2] },
  currentBadge: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  actions: { gap: Spacing[3] },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  invoiceAmount: { ...Typography.bodyMedium },
  invoiceStatus: { ...Typography.caption, color: Colors.textSecondary },
});
