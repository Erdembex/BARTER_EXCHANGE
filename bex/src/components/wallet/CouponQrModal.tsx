import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Coupon } from '@/types';
import { encodeCouponQr, getCouponRemainingUses } from '@/lib/couponUtils';
import { Colors, Typography, Spacing, Radius } from '@/theme';

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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Kupon QR</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Kapat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.reward}>{coupon.rewardDescription}</Text>
          {businessName ? (
            <Text style={styles.business}>{businessName}</Text>
          ) : null}
          <Text style={styles.code}>{coupon.couponCode}</Text>

          <View style={styles.qrWrap}>
            <QRCode
              value={qrValue}
              size={220}
              color={Colors.textPrimary}
              backgroundColor={Colors.card}
            />
          </View>

          <Text style={styles.hint}>
            İşletme bu kodu okutarak kuponunu doğrular.
          </Text>
          <Text style={styles.uses}>
            Kalan kullanım: {remaining}/{coupon.totalUses}
          </Text>
        </View>
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
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  title: { ...Typography.headingMedium, color: Colors.textPrimary },
  close: { ...Typography.labelLarge, color: Colors.primary },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
  },
  reward: {
    ...Typography.headingLarge,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing[1],
  },
  business: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing[2],
  },
  code: {
    ...Typography.labelLarge,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing[6],
  },
  qrWrap: {
    padding: Spacing[5],
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing[5],
  },
  hint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  uses: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
});
