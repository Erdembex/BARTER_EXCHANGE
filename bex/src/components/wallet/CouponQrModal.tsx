import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Coupon } from '@/types';
import {
  encodeCouponQr,
  getCouponDisplayStatus,
  getCouponRemainingUses,
  COUPON_STATUS_LABELS,
} from '@/lib/couponUtils';
import { getCouponVisual } from '@/lib/couponVisuals';
import { formatDaysUntil, formatShortDate } from '@/lib/dateUtils';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';

interface CouponQrModalProps {
  coupon: Coupon | null;
  businessName?: string;
  visible: boolean;
  onClose: () => void;
}

export function CouponQrModal({
  coupon,
  businessName,
  visible,
  onClose,
}: CouponQrModalProps) {
  if (!coupon) return null;

  const qrValue = encodeCouponQr(coupon);
  const remaining = getCouponRemainingUses(coupon);
  const displayStatus = getCouponDisplayStatus(coupon);
  const isActive = displayStatus === 'active';
  const visual = getCouponVisual(coupon.rewardDescription);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Kupon Detayı</Text>
          <View style={{ width: 56 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, Shadow.card]}>
            <View style={[styles.stripe, { backgroundColor: visual.stripe }]} />
            <View style={styles.heroBody}>
              <View style={styles.heroTop}>
                <View style={styles.iconBox}>
                  <Text style={styles.iconText}>{visual.emoji}</Text>
                </View>
                <View style={styles.heroMeta}>
                  <Text style={styles.category}>{visual.label.toUpperCase()}</Text>
                  <Text style={styles.status}>{COUPON_STATUS_LABELS[displayStatus]}</Text>
                </View>
              </View>
              <Text style={styles.reward}>{coupon.rewardDescription}</Text>
              {businessName ? <Text style={styles.business}>{businessName}</Text> : null}
              {coupon.couponCode ? <Text style={styles.code}>{coupon.couponCode}</Text> : null}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {coupon.usedCount}/{coupon.totalUses}
              </Text>
              <Text style={styles.statLabel}>Kullanım</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{remaining}</Text>
              <Text style={styles.statLabel}>Kalan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, styles.statValueSmall]} numberOfLines={1}>
                {displayStatus === 'expired'
                  ? formatShortDate(coupon.expiresAt)
                  : formatDaysUntil(coupon.expiresAt)}
              </Text>
              <Text style={styles.statLabel}>Geçerlilik</Text>
            </View>
          </View>

          {isActive ? (
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>Doğrulama Kodu</Text>
              <View style={styles.qrWrap}>
                <QRCode
                  value={qrValue}
                  size={220}
                  color={Colors.textPrimary}
                  backgroundColor={Colors.white}
                />
              </View>
              <Text style={styles.hint}>
                İşletme bu kodu okutarak kuponunu doğrular.
              </Text>
            </View>
          ) : (
            <View style={styles.qrMuted}>
              <Text style={styles.qrMutedText}>
                {displayStatus === 'exhausted'
                  ? 'Tüm haklar kullanıldı.'
                  : displayStatus === 'traded'
                    ? 'Bu kupon takas edildi.'
                    : 'Kuponun süresi doldu.'}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.doneText}>Kapat</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  close: { ...Typography.labelMedium, color: Colors.primary, fontWeight: '600' },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  heroCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  stripe: { width: 4 },
  heroBody: { flex: 1, padding: Spacing[5], gap: Spacing[2] },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 26, color: Colors.primary, fontWeight: '700' },
  heroMeta: { flex: 1, gap: 4 },
  category: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '800',
    letterSpacing: 1,
  },
  status: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  reward: { ...Typography.headingMedium, color: Colors.textPrimary, lineHeight: 28 },
  business: { ...Typography.bodyMedium, color: Colors.textSecondary },
  code: {
    ...Typography.labelLarge,
    color: Colors.primary,
    letterSpacing: 1,
    fontWeight: '800',
    marginTop: Spacing[1],
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing[4],
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: Spacing[1] },
  statValue: { ...Typography.headingMedium, color: Colors.textPrimary, fontSize: 18 },
  statValueSmall: { fontSize: 12, textAlign: 'center', paddingHorizontal: Spacing[1] },
  statLabel: { ...Typography.caption, color: Colors.textMuted, fontWeight: '600' },
  qrSection: { alignItems: 'center', gap: Spacing[3] },
  qrTitle: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  qrWrap: {
    padding: Spacing[4],
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hint: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center' },
  qrMuted: {
    padding: Spacing[8],
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  qrMutedText: { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center' },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    ...Shadow.primary,
  },
  doneText: {
    ...Typography.labelLarge,
    color: Colors.white,
    fontWeight: '700',
  },
});
