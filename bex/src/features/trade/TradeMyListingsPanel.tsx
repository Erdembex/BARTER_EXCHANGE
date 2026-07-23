import React, { useState } from 'react';
import { FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { createBox } from '@shopify/restyle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { tradeTheme, TradeTheme } from './tradeTheme';
import { TradeListing } from './types';
import { TradeCreateListingModal } from './TradeCreateListingModal';
import { TradeListingOffersModal } from './TradeListingOffersModal';
import { tradeRepository } from './tradeRepository';

const Box = createBox<TradeTheme>();

const STATUS_LABEL: Record<TradeListing['status'], string> = {
  active: 'Aktif',
  paused: 'Duraklatıldı',
  completed: 'Tamamlandı',
};

interface TradeMyListingsPanelProps {
  ownerId: string;
  listings: TradeListing[];
  onRefresh: () => void | Promise<void>;
  refreshing?: boolean;
}

export function TradeMyListingsPanel({
  ownerId,
  listings,
  onRefresh,
  refreshing = false,
}: TradeMyListingsPanelProps) {
  const [createVisible, setCreateVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState<TradeListing | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = (listing: TradeListing) => {
    Alert.alert(
      'İlanı iptal et',
      'Bu takas ilanı kaldırılacak. Devam etmek istiyor musun?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal et',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(listing.id);
            try {
              await tradeRepository.cancelListing(ownerId, listing.id);
              await onRefresh();
            } catch (err) {
              Alert.alert(
                'Hata',
                err instanceof Error ? err.message : 'İlan iptal edilemedi.'
              );
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <Box flex={1}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: tradeTheme.spacing.lg,
          paddingBottom: tradeTheme.spacing['2xl'],
          flexGrow: listings.length === 0 ? 1 : undefined,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tradeTheme.colors.tradePrimary}
          />
        }
        ListHeaderComponent={
          <Box paddingBottom="md">
            <Button title="+ İlan Oluştur" onPress={() => setCreateVisible(true)} />
          </Box>
        }
        ListEmptyComponent={
          <Box paddingTop="xl" alignItems="center">
            <Text variant="bodyMuted" style={{ textAlign: 'center' }}>
              Henüz ilanın yok. Aktif kuponunu pazara koyarak takas başlatabilirsin.
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
                  {item.title}
                </Text>
                <Text variant="caption" marginTop="xs">
                  {item.rewardLabel} · {item.createdAtLabel}
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

            <Text variant="bodyMuted" marginTop="sm" numberOfLines={3}>
              {item.description}
            </Text>

            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              marginTop="md"
              paddingTop="md"
              borderTopWidth={1}
              borderTopColor="border"
            >
              <Text variant="caption">
                {item.offerCount > 0 ? `${item.offerCount} teklif` : 'Henüz teklif yok'}
              </Text>
              {item.status === 'active' ? (
                <Box flexDirection="row" gap="sm">
                  <TouchableOpacity activeOpacity={0.82} onPress={() => setSelectedListing(item)}>
                    <Box
                      backgroundColor="tradePrimary"
                      paddingHorizontal="md"
                      paddingVertical="sm"
                      borderRadius="md"
                    >
                      <Text variant="buttonPrimary" style={{ color: '#FFFFFF' }}>
                        Teklifleri Gör
                      </Text>
                    </Box>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() => handleCancel(item)}
                    disabled={cancellingId === item.id}
                  >
                    <Box
                      paddingHorizontal="md"
                      paddingVertical="sm"
                      borderRadius="md"
                      borderWidth={1}
                      borderColor="border"
                    >
                      <Text variant="caption">
                        {cancellingId === item.id ? '...' : 'İptal'}
                      </Text>
                    </Box>
                  </TouchableOpacity>
                </Box>
              ) : null}
            </Box>
          </Box>
        )}
      />

      <TradeCreateListingModal
        visible={createVisible}
        ownerId={ownerId}
        onClose={() => setCreateVisible(false)}
        onCreated={onRefresh}
      />

      <TradeListingOffersModal
        visible={selectedListing !== null}
        listing={selectedListing}
        ownerId={ownerId}
        onClose={() => setSelectedListing(null)}
        onUpdated={onRefresh}
      />
    </Box>
  );
}
