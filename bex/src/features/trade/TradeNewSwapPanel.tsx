import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
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
import { useTranslation } from '@/i18n';

const Box = createBox<TradeTheme>();

interface TradeNewSwapPanelProps {
  ownerId: string;
  onCreated: () => void | Promise<void>;
}

export function TradeNewSwapPanel({ ownerId, onCreated }: TradeNewSwapPanelProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedTrade, setSuggestedTrade] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (shouldUseDemoData()) {
        demoStore.ensureSampleCouponForUser(ownerId);
      }
      const list = await tradeRepository.getAvailableTradeCoupons(ownerId);
      setCoupons(list);
      setSelectedCouponId(list[0]?.id ?? null);
    })();
  }, [ownerId]);

  const handleSubmit = async () => {
    if (!selectedCouponId) {
      showToast(t('tradeNewSwapPanel.selectCouponError'));
      return;
    }

    const selected = coupons.find((coupon) => coupon.id === selectedCouponId);
    const input: CreateTradeListingInput = {
      title: title.trim() || selected?.rewardDescription || t('tradeNewSwapPanel.defaultListingTitle'),
      description: description.trim() || selected?.rewardDescription || '',
      suggestedTrade: suggestedTrade.trim(),
      rewardLabel: selected?.rewardDescription || t('tradeNewSwapPanel.defaultCoupon'),
      couponId: selectedCouponId,
    };

    if (input.suggestedTrade.length < 5) {
      showToast(t('tradeNewSwapPanel.suggestedTradeMinError'));
      return;
    }

    setSubmitting(true);
    try {
      await tradeRepository.createListing(ownerId, input);
      showToast(t('tradeNewSwapPanel.publishedToast'));
      setTitle('');
      setDescription('');
      setSuggestedTrade('');
      await onCreated();
    } catch (err) {
      showToast((err as Error).message || t('tradeNewSwapPanel.createFailedToast'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: tradeTheme.spacing.lg,
        paddingBottom: tradeTheme.spacing['2xl'],
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Box
        padding="md"
        marginBottom="md"
        borderRadius="md"
        backgroundColor="tradeAccentLight"
        borderWidth={1}
        borderColor="tradeAccentBorder"
      >
        <Text variant="caption" style={{ color: tradeTheme.colors.tradeAccent, fontWeight: '700' }}>
          {t('tradeNewSwapPanel.headerTitle')}
        </Text>
        <Text variant="bodyMuted" marginTop="xs">
          {t('tradeNewSwapPanel.headerSubtitle')}
        </Text>
      </Box>

      <Text variant="label" marginBottom="xs">
        {t('tradeNewSwapPanel.couponSelectionLabel')}
      </Text>
      {coupons.length === 0 ? (
        <Box
          padding="md"
          borderRadius="md"
          borderWidth={1}
          borderColor="border"
          backgroundColor="surface"
          marginBottom="md"
        >
          <Text variant="bodyMuted">
            {t('tradeNewSwapPanel.noCouponText')}
          </Text>
        </Box>
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
                padding="md"
                borderRadius="md"
                marginBottom="sm"
                borderWidth={1}
                borderColor={selected ? 'tradePrimary' : 'border'}
        backgroundColor={selected ? 'tradePrimaryLight' : 'surface'}
                borderLeftWidth={selected ? 3 : 1}
              >
                <Text variant="label">{coupon.rewardDescription}</Text>
                <Text variant="caption">
                  {t('tradeNewSwapPanel.usesLeft', { count: coupon.totalUses - coupon.usedCount })}
                </Text>
              </Box>
            </TouchableOpacity>
          );
        })
      )}

      <Text variant="label" marginTop="md" marginBottom="xs">
        {t('tradeNewSwapPanel.listingTitleLabel')}
      </Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t('tradeNewSwapPanel.listingTitlePlaceholder')}
        placeholderTextColor={tradeTheme.colors.textMuted}
        style={inputStyle}
      />

      <Text variant="label" marginTop="md" marginBottom="xs">
        {t('tradeNewSwapPanel.descriptionLabel')}
      </Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t('tradeNewSwapPanel.descriptionPlaceholder')}
        placeholderTextColor={tradeTheme.colors.textMuted}
        multiline
        style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
      />

      <Text variant="label" marginTop="md" marginBottom="xs">
        {t('tradeNewSwapPanel.suggestedTradeLabel')}
      </Text>
      <TextInput
        value={suggestedTrade}
        onChangeText={setSuggestedTrade}
        placeholder={t('tradeNewSwapPanel.suggestedTradePlaceholder')}
        placeholderTextColor={tradeTheme.colors.textMuted}
        style={inputStyle}
      />

      <Button
        title={submitting ? t('tradeNewSwapPanel.publishing') : t('tradeNewSwapPanel.publish')}
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting || coupons.length === 0}
        style={{ marginTop: 20 }}
      />
    </ScrollView>
  );
}

const inputStyle = {
  backgroundColor: tradeTheme.colors.white,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: tradeTheme.colors.border,
  padding: 14,
  color: tradeTheme.colors.text,
  fontSize: 15,
} as const;
