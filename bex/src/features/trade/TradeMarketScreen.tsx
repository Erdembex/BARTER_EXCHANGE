import React, { useCallback, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ListRenderItem,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { createBox, ThemeProvider } from '@shopify/restyle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/common/Toast';
import { useAuthStore } from '@/store/authStore';
import { tradeRepository } from './tradeRepository';
import { tradeTheme, TradeTheme } from './tradeTheme';
import { TradeListing, TradeOffer } from './types';
import { TradeMyListingsPanel } from './TradeMyListingsPanel';
import { TradeMyOffersPanel } from './TradeMyOffersPanel';
import { TradeSubmitOfferModal } from './TradeSubmitOfferModal';

const Box = createBox<TradeTheme>();

type TradeTab = 'market' | 'mine' | 'offers';

const TAB_LABELS: Record<TradeTab, string> = {
  market: 'Pazar',
  mine: 'İlanlarım',
  offers: 'Tekliflerim',
};

interface TradeListingCardProps {
  item: TradeListing;
  currentUserId?: string;
  onOfferPress: (listing: TradeListing) => void;
}

function TradeListingCard({ item, currentUserId, onOfferPress }: TradeListingCardProps) {
  const isOwnListing = currentUserId != null && item.ownerId === currentUserId;

  return (
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
        {item.offerCount > 0 ? (
          <Box
            backgroundColor="tradePrimaryLight"
            paddingHorizontal="sm"
            paddingVertical="xs"
            borderRadius="full"
            borderWidth={1}
            borderColor="tradePrimaryBorder"
          >
            <Text variant="caption" style={{ color: tradeTheme.colors.tradePrimary }}>
              {item.offerCount} teklif
            </Text>
          </Box>
        ) : null}
      </Box>

      <Text variant="bodyMuted" marginTop="sm" numberOfLines={2}>
        {item.description}
      </Text>

      <Box
        marginTop="md"
        padding="sm"
        borderRadius="md"
        backgroundColor="tradePrimaryLight"
        borderLeftWidth={3}
        borderLeftColor="tradePrimary"
      >
        <Text
          variant="caption"
          marginBottom="xs"
          style={{ color: tradeTheme.colors.tradePrimary, fontWeight: '700' }}
        >
          Önerilen Takas
        </Text>
        <Text variant="body" style={{ fontSize: 14 }}>
          {item.suggestedTrade}
        </Text>
      </Box>

      <Box
        flexDirection="row"
        alignItems="center"
        marginTop="md"
        paddingTop="md"
        borderTopWidth={1}
        borderTopColor="border"
      >
        <Box
          width={40}
          height={40}
          borderRadius="md"
          backgroundColor="tradePrimary"
          alignItems="center"
          justifyContent="center"
          marginRight="sm"
        >
          <Text variant="label" style={{ color: '#FFFFFF' }}>
            {item.ownerAvatarInitial}
          </Text>
        </Box>
        <Box flex={1}>
          <Text variant="caption">İlan Sahibi</Text>
          <Text variant="label">{item.ownerName}</Text>
        </Box>
        {isOwnListing ? (
          <Text variant="caption" style={{ color: tradeTheme.colors.textMuted }}>
            Senin ilanın
          </Text>
        ) : (
          <TouchableOpacity activeOpacity={0.82} onPress={() => onOfferPress(item)}>
            <Box
              backgroundColor="tradePrimary"
              paddingHorizontal="lg"
              paddingVertical="sm"
              borderRadius="md"
            >
              <Text variant="buttonPrimary" style={{ color: '#FFFFFF' }}>
                Teklif Ver
              </Text>
            </Box>
          </TouchableOpacity>
        )}
      </Box>
    </Box>
  );
}

function TradeTabSwitch({
  active,
  onChange,
}: {
  active: TradeTab;
  onChange: (tab: TradeTab) => void;
}) {
  return (
    <Box flexDirection="row" marginTop="md">
      {(['market', 'mine', 'offers'] as TradeTab[]).map((tab, index, arr) => {
        const selected = active === tab;
        return (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.85}
            onPress={() => onChange(tab)}
            style={{ flex: 1, marginRight: index < arr.length - 1 ? 6 : 0 }}
          >
            <Box
              paddingVertical="sm"
              borderRadius="md"
              alignItems="center"
              backgroundColor={selected ? 'tradePrimary' : 'surface'}
              borderWidth={1}
              borderColor={selected ? 'tradePrimary' : 'border'}
            >
              <Text
                variant="caption"
                style={{
                  color: selected ? '#FFFFFF' : tradeTheme.colors.text,
                  fontWeight: '700',
                }}
              >
                {TAB_LABELS[tab]}
              </Text>
            </Box>
          </TouchableOpacity>
        );
      })}
    </Box>
  );
}

export function TradeMarketScreen() {
  const { firebaseUser } = useAuthStore();
  const { showToast } = useToast();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<TradeTab>('market');
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [myListings, setMyListings] = useState<TradeListing[]>([]);
  const [myOffers, setMyOffers] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<TradeListing | null>(null);

  const load = useCallback(async () => {
    if (!firebaseUser) {
      setListings([]);
      setMyListings([]);
      setMyOffers([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    try {
      setLoadError(null);
      const [market, mine, sent] = await Promise.all([
        tradeRepository.getActiveListings(),
        tradeRepository.getMyListings(firebaseUser.uid),
        tradeRepository.getMyOffers(firebaseUser.uid),
      ]);

      setListings(market);
      setMyListings(mine);
      setMyOffers(sent);
    } catch (err) {
      const message = (err as Error).message || 'Takas verisi yüklenemedi.';
      setLoadError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, showToast]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  React.useEffect(() => {
    if (tabParam === 'mine' || tabParam === 'offers' || tabParam === 'market') {
      setTab(tabParam);
    }
  }, [tabParam]);

  React.useEffect(() => {
    if (firebaseUser && (tab === 'mine' || tab === 'offers')) {
      load();
    }
  }, [tab, firebaseUser, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem: ListRenderItem<TradeListing> = ({ item }) => (
    <TradeListingCard
      item={item}
      currentUserId={firebaseUser?.uid}
      onOfferPress={setSelectedListing}
    />
  );

  return (
    <ThemeProvider theme={tradeTheme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: tradeTheme.colors.background }}>
        <Box flex={1} backgroundColor="background">
          <Box paddingHorizontal="lg" paddingTop="lg" paddingBottom="md">
            <Text variant="headingLarge">Takas Pazarı</Text>
            <Text variant="bodyMuted" marginTop="xs">
              Kuponlarını takas et, yeni fırsatlar keşfet.
            </Text>
            <TradeTabSwitch active={tab} onChange={setTab} />
            <Box
              flexDirection="row"
              marginTop="md"
              padding="sm"
              borderRadius="md"
              backgroundColor="tradePrimaryLight"
              borderWidth={1}
              borderColor="tradePrimaryBorder"
            >
              <Text variant="caption" style={{ color: tradeTheme.colors.tradePrimary }}>
                🔒 Kupon kodları ilanlarda gösterilmez — güvenli takas sonrası paylaşılır.
              </Text>
            </Box>
          </Box>

          {loading ? (
            <Box flex={1} alignItems="center" justifyContent="center">
              <ActivityIndicator color={tradeTheme.colors.tradePrimary} size="large" />
              <Text variant="bodyMuted" marginTop="md">
                İlanlar yükleniyor...
              </Text>
            </Box>
          ) : loadError ? (
            <Box flex={1} paddingHorizontal="lg" alignItems="center" justifyContent="center">
              <Text variant="bodyMuted" style={{ textAlign: 'center', marginBottom: 16 }}>
                {loadError}
              </Text>
              <Button
                title="Tekrar dene"
                variant="outline"
                onPress={() => {
                  setLoading(true);
                  load();
                }}
              />
            </Box>
          ) : tab === 'mine' ? (
            firebaseUser ? (
              <Box flex={1}>
                <TradeMyListingsPanel
                  ownerId={firebaseUser.uid}
                  listings={myListings}
                  onRefresh={onRefresh}
                  refreshing={refreshing}
                />
              </Box>
            ) : (
              <Box paddingHorizontal="lg">
                <Text variant="bodyMuted">İlanlarını görmek için giriş yap.</Text>
              </Box>
            )
          ) : tab === 'offers' ? (
            firebaseUser ? (
              <Box flex={1}>
                <TradeMyOffersPanel
                  userId={firebaseUser.uid}
                  offers={myOffers}
                  onRefresh={onRefresh}
                  refreshing={refreshing}
                />
              </Box>
            ) : (
              <Box paddingHorizontal="lg">
                <Text variant="bodyMuted">Tekliflerini görmek için giriş yap.</Text>
              </Box>
            )
          ) : (
            <FlatList
              data={listings}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={tradeTheme.colors.tradePrimary}
                />
              }
              ListEmptyComponent={
                <Box paddingHorizontal="lg" paddingTop="xl" alignItems="center">
                  <Text variant="bodyMuted" style={{ textAlign: 'center' }}>
                    Pazarda aktif ilan yok. İlanlarım sekmesinden ilk ilanını oluşturabilirsin.
                  </Text>
                </Box>
              }
              contentContainerStyle={{
                paddingHorizontal: tradeTheme.spacing.lg,
                paddingBottom: tradeTheme.spacing['2xl'],
                flexGrow: listings.length === 0 ? 1 : undefined,
              }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Box>

        {firebaseUser ? (
          <TradeSubmitOfferModal
            visible={selectedListing !== null}
            listing={selectedListing}
            userId={firebaseUser.uid}
            onClose={() => setSelectedListing(null)}
            onSubmitted={load}
          />
        ) : null}
      </SafeAreaView>
    </ThemeProvider>
  );
}
