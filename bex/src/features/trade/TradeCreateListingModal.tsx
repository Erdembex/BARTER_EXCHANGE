import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { createBox } from '@shopify/restyle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/common/Toast';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { Coupon } from '@/types';
import { tradeRepository } from './tradeRepository';
import { tradeTheme, TradeTheme } from './tradeTheme';
import { CreateTradeListingInput } from './types';

const Box = createBox<TradeTheme>();

interface TradeCreateListingModalProps {
  visible: boolean;
  ownerId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function TradeCreateListingModal({
  visible,
  ownerId,
  onClose,
  onCreated,
}: TradeCreateListingModalProps) {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedTrade, setSuggestedTrade] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    (async () => {
      if (shouldUseDemoData()) {
        demoStore.ensureSampleCouponForUser(ownerId);
      }
      const list = await tradeRepository.getAvailableTradeCoupons(ownerId);
      setCoupons(list);
      setSelectedCouponId(list[0]?.id ?? null);
    })();
  }, [visible, ownerId]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setSuggestedTrade('');
    setSelectedCouponId(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedCouponId) {
      showToast('Takasa koymak için aktif bir kupon seç.');
      return;
    }

    const selected = coupons.find((coupon) => coupon.id === selectedCouponId);
    const input: CreateTradeListingInput = {
      title: title.trim() || selected?.rewardDescription || 'Takas ilanı',
      description: description.trim() || selected?.rewardDescription || '',
      suggestedTrade: suggestedTrade.trim(),
      rewardLabel: selected?.rewardDescription || 'Kupon',
      couponId: selectedCouponId,
    };

    if (input.suggestedTrade.length < 5) {
      showToast('Önerilen takas en az 5 karakter olmalı.');
      return;
    }

    setSubmitting(true);
    try {
      await tradeRepository.createListing(ownerId, input);
      showToast('İlanın yayınlandı.');
      reset();
      onCreated();
      onClose();
    } catch (err) {
      showToast((err as Error).message || 'İlan oluşturulamadı.');
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
        onPress={handleClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable onPress={(event) => event.stopPropagation()}>
            <Box
              backgroundColor="surface"
              borderTopLeftRadius="xl"
              borderTopRightRadius="xl"
              padding="lg"
              paddingBottom="2xl"
              borderTopWidth={1}
              borderColor="border"
              maxHeight="90%"
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <Box
                  width={40}
                  height={4}
                  borderRadius="full"
                  backgroundColor="border"
                  alignSelf="center"
                  marginBottom="md"
                />

                <Text variant="headingSmall">İlan Oluştur</Text>
                <Text variant="bodyMuted" marginTop="xs" marginBottom="md">
                  Aktif kuponunu pazara koy. Kupon kodun ilanda görünmez.
                </Text>

                <Text variant="label" marginBottom="xs">
                  Kupon
                </Text>
                {coupons.length === 0 ? (
                  <Text variant="bodyMuted" marginBottom="md">
                    Aktif kuponun yok. Önce bir görev tamamlayıp kupon kazan.
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
                          <Text variant="caption">{coupon.totalUses - coupon.usedCount} kullanım kaldı</Text>
                        </Box>
                      </TouchableOpacity>
                    );
                  })
                )}

                <Text variant="label" marginTop="md" marginBottom="xs">
                  Başlık
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Örn. 3x Kahve Kuponu"
                  placeholderTextColor={tradeTheme.colors.textMuted}
                  style={inputStyle}
                />

                <Text variant="label" marginTop="md" marginBottom="xs">
                  Açıklama
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Kupon detayları..."
                  placeholderTextColor={tradeTheme.colors.textMuted}
                  multiline
                  style={[inputStyle, { minHeight: 72, textAlignVertical: 'top' }]}
                />

                <Text variant="label" marginTop="md" marginBottom="xs">
                  Önerilen Takas
                </Text>
                <TextInput
                  value={suggestedTrade}
                  onChangeText={setSuggestedTrade}
                  placeholder="Ne karşılığında takas edersin?"
                  placeholderTextColor={tradeTheme.colors.textMuted}
                  style={inputStyle}
                />

                <Button
                  title={submitting ? 'Yayınlanıyor...' : 'İlanı Yayınla'}
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={submitting || coupons.length === 0}
                  style={{ marginTop: 16, marginBottom: 8 }}
                />
                <Button title="Vazgeç" variant="ghost" onPress={handleClose} />
              </ScrollView>
            </Box>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
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
  marginBottom: 4,
} as const;
