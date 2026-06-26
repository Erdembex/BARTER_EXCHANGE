import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { router, Href } from 'expo-router';
import { createBox } from '@shopify/restyle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { tradeTheme, TradeTheme } from './tradeTheme';
import { TradeOffer, TradeOfferStatus } from './types';

const Box = createBox<TradeTheme>();

const STATUS_LABEL: Record<TradeOfferStatus, string> = {
  pending: 'Bekliyor',
  accepted: 'Kabul edildi',
  rejected: 'Reddedildi',
  cancelled: 'İptal',
};

interface TradeMyOffersPanelProps {
  userId: string;
  offers: TradeOffer[];
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
}

export function TradeMyOffersPanel({
  offers,
  onRefresh,
  refreshing = false,
}: TradeMyOffersPanelProps) {
  return (
    <Box flex={1}>
      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: tradeTheme.spacing.lg,
          paddingBottom: tradeTheme.spacing['2xl'],
          flexGrow: offers.length === 0 ? 1 : undefined,
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tradeTheme.colors.tradePrimary}
            />
          ) : undefined
        }
        ListEmptyComponent={
          <Box paddingTop="xl" alignItems="center">
            <Text variant="bodyMuted" style={{ textAlign: 'center' }}>
              Henüz teklif göndermedin. Pazardan ilan seçip kuponunu takasa koyabilirsin.
            </Text>
          </Box>
        }
        renderItem={({ item }) => (
          <Box
            backgroundColor="surface"
            borderRadius="lg"
            padding="md"
            marginBottom="md"
            borderWidth={1}
            borderColor="border"
          >
            <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1} marginRight="sm">
                <Text variant="headingSmall" numberOfLines={2}>
                  {item.listingTitle}
                </Text>
                <Text variant="caption" marginTop="xs">
                  {item.createdAtLabel}
                </Text>
              </Box>
              <Box
                paddingHorizontal="sm"
                paddingVertical="xs"
                borderRadius="full"
                borderWidth={1}
                borderColor="tradePrimaryBorder"
                backgroundColor="tradePrimaryLight"
              >
                <Text variant="caption" style={{ color: tradeTheme.colors.tradePrimary }}>
                  {STATUS_LABEL[item.status]}
                </Text>
              </Box>
            </Box>

            <Text variant="caption" marginTop="sm" style={{ color: tradeTheme.colors.tradePrimary }}>
              Senin kuponun: {item.counterRewardLabel}
            </Text>

            {item.status === 'accepted' ? (
              <Box marginTop="md">
                <Text variant="bodyMuted" marginBottom="sm">
                  Takas tamamlandı. Eski kodun iptal edildi; yeni kuponun Kuponlarım sekmesinde.
                </Text>
                <Button
                  title="Kuponlarım'a Git"
                  size="sm"
                  onPress={() => router.push('/(tabs)/wallet' as Href)}
                />
              </Box>
            ) : null}
          </Box>
        )}
      />
    </Box>
  );
}
