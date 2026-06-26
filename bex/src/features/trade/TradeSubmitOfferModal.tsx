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
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !userId) return;

    (async () => {
      if (shouldUseDemoData()) {
        demoStore.ensureSampleCouponForUser(userId);
      }
      const list = await tradeRepository.getAvailableTradeCoupons(userId);
      const filtered = listing
        ? list.filter((coupon) => coupon.id !== listing.couponId)
        : list;
      setCoupons(filtered);
      setSelectedCouponId(filtered[0]?.id ?? null);
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
      showToast('Takasa katılmak için kupon seçmelisin.');
      return;
    }

    setSubmitting(true);
    try {
      await tradeRepository.submitOffer(userId, listing.id, {
        counterCouponId: selectedCouponId,
        message: note.trim() || undefined,
      });
      showToast(`Teklifin gönderildi. Kuponun takas onayına kadar kilitlendi.`);
      reset();
      onSubmitted();
      onClose();
    } catch (err) {
      showToast((err as Error).message || 'Teklif gönderilemedi.');
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
            <Text variant="headingSmall">Takasa Katıl</Text>
            {listing ? (
              <>
                <Text variant="bodyMuted" marginTop="xs">
                  {listing.title}
                </Text>
                <Text variant="caption" marginTop="sm" marginBottom="md">
                  Karşılık olarak kendi kuponlarından birini seç. Onaylanırsa eski kodlar imha edilir,
                  yeni kodlar Kuponlarım sekmesinde oluşur.
                </Text>
              </>
            ) : null}

            <Text variant="label" marginBottom="xs">
              Kuponlarım
            </Text>
            {coupons.length === 0 ? (
              <Text variant="bodyMuted" marginBottom="md">
                Takasa uygun aktif kuponun yok. Kuponlarım sekmesinden kupon kazan veya başka bir
                kuponu takasta kullanma.
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
                        {coupon.totalUses - coupon.usedCount} kullanım · Kod paylaşılmaz
                      </Text>
                    </Box>
                  </TouchableOpacity>
                );
              })
            )}

            <Text variant="label" marginTop="md" marginBottom="xs">
              Not (isteğe bağlı)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Kısa bir mesaj..."
              placeholderTextColor={tradeTheme.colors.textMuted}
              maxLength={200}
              style={inputStyle}
            />
          </ScrollView>

          <Button
            title={submitting ? 'Gönderiliyor...' : 'Takas Teklifini Gönder'}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || coupons.length === 0}
            style={{ marginTop: 8, marginBottom: 8 }}
          />
          <Button title="Vazgeç" variant="ghost" onPress={handleClose} />
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
