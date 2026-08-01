import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBox } from '@shopify/restyle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/common/Toast';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { Coupon } from '@/types';
import { tradeRepository } from './tradeRepository';
import { tradeTheme, TradeTheme } from './tradeTheme';
import { TradeListing } from './types';
import { useTranslation } from '@/i18n';

const Box = createBox<TradeTheme>();
const SHEET_HEIGHT = Math.round(Dimensions.get('window').height * 0.88);

interface TradeSubmitOfferModalProps {
  visible: boolean;
  listing: TradeListing | null;
  userId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function TradeSubmitOfferModal({
  visible,
  listing,
  userId,
  onClose,
  onSubmitted,
}: TradeSubmitOfferModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  useEffect(() => {
    if (!visible || !userId) return;

    (async () => {
      setLoadingCoupons(true);
      try {
        if (shouldUseDemoData()) {
          demoStore.ensureSampleCouponForUser(userId);
        }
        const list = await tradeRepository.getAvailableTradeCoupons(userId);
        const filtered = listing
          ? list.filter((coupon) => coupon.id !== listing.couponId)
          : list;
        setCoupons(filtered);
        setSelectedCouponId(filtered[0]?.id ?? null);
      } finally {
        setLoadingCoupons(false);
      }
    })();
  }, [visible, userId, listing?.couponId]);

  const reset = () => {
    setNote('');
    setSelectedCouponId(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!listing || !selectedCouponId) {
      showToast(t('tradeSubmitOfferModal.selectCouponError'));
      return;
    }

    setSubmitting(true);
    try {
      await tradeRepository.submitOffer(userId, listing.id, {
        counterCouponId: selectedCouponId,
        message: note.trim() || undefined,
      });
      showToast(t('tradeSubmitOfferModal.submittedToast'));
      reset();
      onSubmitted();
      onClose();
    } catch (err) {
      showToast((err as Error).message || t('tradeSubmitOfferModal.submitFailedToast'));
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View
          style={[
            styles.sheet,
            { height: SHEET_HEIGHT, paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.handle} />
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text variant="headingSmall">{t('tradeSubmitOfferModal.title')}</Text>
            {listing ? (
              <>
                <Text variant="bodyMuted" marginTop="xs">
                  {listing.title}
                </Text>
                <Text variant="caption" marginTop="sm" marginBottom="md">
                  {t('tradeSubmitOfferModal.infoText')}
                </Text>
              </>
            ) : null}

            <Text variant="label" marginBottom="xs">
              {t('tradeSubmitOfferModal.myCouponsLabel')}
            </Text>
            {loadingCoupons ? (
              <Box alignItems="center" paddingVertical="lg">
                <ActivityIndicator color={tradeTheme.colors.tradePrimary} />
              </Box>
            ) : coupons.length === 0 ? (
              <Text variant="bodyMuted" marginBottom="md">
                {t('tradeSubmitOfferModal.noCouponText')}
              </Text>
            ) : (
              coupons.map((coupon) => {
                const selected = selectedCouponId === coupon.id;
                return (
                  <TouchableOpacity
                    key={coupon.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedCouponId(coupon.id)}
                  >
                    <Box
                      padding="sm"
                      borderRadius="md"
                      marginBottom="sm"
                      borderWidth={1}
                      borderColor={selected ? 'tradePrimary' : 'border'}
                      backgroundColor={selected ? 'tradePrimaryLight' : 'background'}
                    >
                      <Text variant="label">{coupon.rewardDescription}</Text>
                      <Text variant="caption">
                        {t('tradeSubmitOfferModal.usesAndNoShare', { count: coupon.totalUses - coupon.usedCount })}
                      </Text>
                    </Box>
                  </TouchableOpacity>
                );
              })
            )}

            <Text variant="label" marginTop="md" marginBottom="xs">
              {t('tradeSubmitOfferModal.noteLabel')}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('tradeSubmitOfferModal.notePlaceholder')}
              placeholderTextColor={tradeTheme.colors.textMuted}
              maxLength={200}
              style={inputStyle}
            />
          </ScrollView>

          <Button
            title={submitting ? t('tradeSubmitOfferModal.submitting') : t('tradeSubmitOfferModal.submit')}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || loadingCoupons || coupons.length === 0}
            style={{ marginTop: 8, marginBottom: 8 }}
          />
          <Button title={t('tradeSubmitOfferModal.cancel')} variant="ghost" onPress={handleClose} />
        </View>
      </View>
    </Modal>
  );
}

const inputStyle = {
  backgroundColor: tradeTheme.colors.background,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: tradeTheme.colors.border,
  padding: 12,
  color: tradeTheme.colors.text,
  marginBottom: 8,
} as const;

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    width: '100%',
    backgroundColor: tradeTheme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: tradeTheme.colors.border,
    paddingHorizontal: tradeTheme.spacing.lg,
    paddingTop: tradeTheme.spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: tradeTheme.colors.border,
    alignSelf: 'center',
    marginBottom: tradeTheme.spacing.md,
  },
});
