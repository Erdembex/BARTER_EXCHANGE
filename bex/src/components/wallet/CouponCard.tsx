import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Coupon } from '@/types';
import {
  getCouponRemainingUses,
  getCouponDisplayStatus,
  COUPON_STATUS_LABELS,
} from '@/lib/couponUtils';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface CouponCardProps {
  coupon: Coupon;
  businessName?: string;
  onPress: () => void;
}

const STATUS_COLORS = {
  active: Colors.primary,
  exhausted: Colors.textTertiary,
  expired: Colors.warning,
};

export function CouponCard({ coupon, businessName, onPress }: CouponCardProps) {
  const displayStatus = getCouponDisplayStatus(coupon);
  const remaining = getCouponRemainingUses(coupon);
  const statusColor = STATUS_COLORS[displayStatus];

  return (
    <TouchableOpacity
      style={[styles.card, displayStatus !== 'active' && styles.cardMuted]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={displayStatus !== 'active'}
    >
      <View style={styles.header}>
        <Text style={styles.reward} numberOfLines={2}>
          {coupon.rewardDescription}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {COUPON_STATUS_LABELS[displayStatus]}
          </Text>
        </View>
      </View>

      {businessName ? (
        <Text style={styles.business}>{businessName}</Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.code}>{coupon.couponCode}</Text>
        {displayStatus === 'active' && (
          <Text style={styles.uses}>
            {remaining}/{coupon.totalUses} hak
          </Text>
        )}
      </View>

      {displayStatus === 'active' && (
        <Text style={styles.tapHint}>QR görmek için dokun →</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  cardMuted: {
    opacity: 0.75,
    borderLeftColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  reward: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  business: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing[2],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    ...Typography.labelMedium,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  uses: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tapHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing[2],
  },
});
