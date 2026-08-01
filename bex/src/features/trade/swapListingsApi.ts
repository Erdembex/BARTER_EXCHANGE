import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { fetchSwapEligibleCoupons, isBackendCouponId } from '@/features/coupon/couponsApi';
import {
  CreateTradeListingInput,
  TradeListing,
  TradeListingStatus,
  TradeOffer,
  TradeOfferStatus,
} from './types';
import { t, getLocale } from '@/i18n';

/** Takkas JWT oturumu varsa takas işlemleri REST üzerinden yapılır */
export async function useSwapRestBackend(): Promise<boolean> {
  return hasRestAuthSession();
}

export { isBackendCouponId };

/** Spring Boot SwapListingCardResponse */
export type SwapListingCardDto = {
  id: string;
  ownerId?: string;
  offeredRewardType?: string;
  offeredQuantity?: number;
  offeredUnit?: string | null;
  offeredDescription?: string | null;
  offeredCouponExpiresAt?: string | null;
  wantedRewardType?: string;
  wantedQuantity?: number;
  wantedDescription?: string | null;
  status?: string;
  createdAt?: string;
  expiresAt?: string | null;
};

type SwapListingsPageDto = {
  content?: SwapListingCardDto[];
  nextCursor?: string | null;
  hasMore?: boolean;
};

export type SwapListingDetailDto = {
  id: string;
  ownerId?: string;
  offeredCouponId?: string;
  wantedRewardType?: string;
  wantedQuantity?: number;
  wantedDescription?: string | null;
  status?: string;
  createdAt?: string;
  expiresAt?: string | null;
};

export type CreateSwapListingPayload = {
  offeredCouponId: string;
  wantedRewardType?: string;
  wantedQuantity?: number;
  wantedDescription?: string;
};

function avatarInitial(name: string): string {
  const trimmed = name.trim();
  return (trimmed[0] ?? '?').toUpperCase();
}

function formatRewardLabel(dto: SwapListingCardDto): string {
  if (dto.offeredDescription?.trim()) return dto.offeredDescription.trim();
  const parts = [dto.offeredQuantity, dto.offeredUnit, dto.offeredRewardType]
    .filter((part) => part !== null && part !== undefined && `${part}`.trim())
    .map(String);
  return parts.join(' ') || t('swapListingsApi.defaultReward');
}

function formatWantedLabel(dto: SwapListingCardDto): string {
  if (dto.wantedDescription?.trim()) return dto.wantedDescription.trim();
  const parts = [dto.wantedQuantity, dto.wantedRewardType].filter(Boolean).map(String);
  return parts.length ? parts.join(' ') : t('swapListingsApi.defaultWantedOffer');
}

function formatCreatedAtLabel(createdAt?: string): string {
  if (!createdAt) return t('tradeRepository.justNow');

  const diffMs = Date.now() - new Date(createdAt).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return t('tradeRepository.justNow');

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('tradeRepository.justNow');
  if (mins < 60) return t('swapListingsApi.minsAgo', { count: mins });

  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('swapListingsApi.hoursAgo', { count: hours });

  const days = Math.floor(hours / 24);
  if (days < 7) return t('swapListingsApi.daysAgo', { count: days });

  return new Date(createdAt).toLocaleDateString(getLocale() === 'en' ? 'en-US' : 'tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeStatus(status?: string): TradeListingStatus {
  const value = status?.toUpperCase();
  if (value === 'OPEN') return 'active';
  if (value === 'MATCHED' || value === 'COMPLETED') return 'completed';
  if (value === 'CANCELLED' || value === 'EXPIRED' || value === 'PAUSED') return 'paused';
  return 'active';
}

function mapSwapListingCard(dto: SwapListingCardDto): TradeListing {
  const rewardLabel = formatRewardLabel(dto);
  const wantedLabel = formatWantedLabel(dto);
  const ownerName = t('swapListingsApi.defaultUserName');

  return {
    id: String(dto.id),
    ownerId: dto.ownerId ? String(dto.ownerId) : '',
    ownerName,
    ownerAvatarInitial: avatarInitial(ownerName),
    title: rewardLabel,
    description: wantedLabel,
    suggestedTrade: wantedLabel,
    rewardLabel,
    couponId: '',
    status: normalizeStatus(dto.status),
    offerCount: 0,
    createdAtLabel: formatCreatedAtLabel(dto.createdAt),
  };
}

function mapSwapListingDetail(dto: SwapListingDetailDto): TradeListing {
  const wantedLabel =
    dto.wantedDescription?.trim() ||
    [dto.wantedQuantity, dto.wantedRewardType].filter(Boolean).join(' ') ||
    t('swapListingsApi.defaultListingTitle');
  const rewardLabel = wantedLabel;
  const ownerName = t('swapListingsApi.defaultUserName');

  return {
    id: String(dto.id),
    ownerId: dto.ownerId ? String(dto.ownerId) : '',
    ownerName,
    ownerAvatarInitial: avatarInitial(ownerName),
    title: wantedLabel,
    description: dto.wantedDescription?.trim() || '',
    suggestedTrade: wantedLabel,
    rewardLabel,
    couponId: dto.offeredCouponId ? String(dto.offeredCouponId) : '',
    status: normalizeStatus(dto.status),
    offerCount: 0,
    createdAtLabel: formatCreatedAtLabel(dto.createdAt),
  };
}

function extractListingArray(payload: unknown): SwapListingCardDto[] {
  if (Array.isArray(payload)) return payload as SwapListingCardDto[];

  if (payload && typeof payload === 'object') {
    const page = payload as SwapListingsPageDto & Record<string, unknown>;
    if (Array.isArray(page.content)) return page.content;
    if (Array.isArray(page.data)) return page.data as SwapListingCardDto[];
    if (Array.isArray(page.items)) return page.items as SwapListingCardDto[];
  }

  return [];
}

function mapSwapListingsError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 403) {
      return new Error(t('swapListingsApi.individualOnly'));
    }
    if (status === 400) {
      return new Error(t('swapListingsApi.invalidRequest'));
    }
    const detail = getApiErrorMessage(error, fallback);
    const prefix = status ? `[${status}] ` : '';
    return new Error(`${prefix}${detail}`);
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

/** Aktif takas ilanları — GET /api/swap-listings?pageSize=20 */
export async function fetchSwapListings(): Promise<TradeListing[]> {
  try {
    const { data } = await apiClient.get<unknown>('/api/swap-listings', {
      params: { pageSize: 20 },
    });
    return extractListingArray(data)
      .map(mapSwapListingCard)
      .filter((listing) => listing.status === 'active');
  } catch (error) {
    throw mapSwapListingsError(error, t('swapListingsApi.listingsLoadFailed'));
  }
}

/** Kendi ilanlarım — GET /api/individual/swap-listings */
export async function fetchMySwapListings(): Promise<TradeListing[]> {
  try {
    const { data } = await apiClient.get<SwapListingDetailDto[]>('/api/individual/swap-listings');
    return (Array.isArray(data) ? data : [])
      .map(mapSwapListingDetail)
      .filter((listing) => listing.status === 'active' || listing.status === 'paused');
  } catch (error) {
    throw mapSwapListingsError(error, t('swapListingsApi.myListingsLoadFailed'));
  }
}

/** Takas için kullanılabilir kuponlar — GET /api/individual/coupons?status=ACTIVE */
export { fetchSwapEligibleCoupons } from '@/features/coupon/couponsApi';

/** İlan oluştur — POST /api/individual/swap-listings */
export async function createSwapListing(input: CreateTradeListingInput): Promise<string> {
  try {
    const payload: CreateSwapListingPayload = {
      offeredCouponId: input.couponId,
      wantedRewardType: 'CUSTOM',
      wantedQuantity: 1,
      wantedDescription: input.suggestedTrade.trim() || input.title.trim() || input.rewardLabel.trim(),
    };
    const { data } = await apiClient.post<SwapListingDetailDto>(
      '/api/individual/swap-listings',
      payload
    );
    return String(data.id);
  } catch (error) {
    throw mapSwapListingsError(error, t('swapListingsApi.createFailed'));
  }
}

/** Spring Boot SwapOfferResponse */
type SwapOfferDto = {
  id: string;
  swapListingId?: string;
  offererId?: string;
  offeredCouponId?: string;
  message?: string | null;
  status?: string;
  createdAt?: string;
};

function normalizeOfferStatus(status?: string): TradeOfferStatus {
  const value = status?.toUpperCase();
  if (value === 'ACCEPTED') return 'accepted';
  if (value === 'REJECTED') return 'rejected';
  return 'pending';
}

function mapSwapOffer(dto: SwapOfferDto, listingTitle: string): TradeOffer {
  return {
    id: String(dto.id),
    listingId: String(dto.swapListingId ?? ''),
    listingTitle,
    fromUserId: dto.offererId ? String(dto.offererId) : '',
    fromUserName: t('swapListingsApi.defaultUserName'),
    counterCouponId: dto.offeredCouponId ? String(dto.offeredCouponId) : '',
    counterRewardLabel: t('swapListingsApi.defaultReward'),
    message: dto.message?.trim() ?? '',
    status: normalizeOfferStatus(dto.status),
    createdAtLabel: formatCreatedAtLabel(dto.createdAt),
  };
}

/** Teklif gönder — POST /api/swap-listings/{id}/offers */
export async function sendSwapOffer(
  listingId: string,
  offeredCouponId: string,
  message?: string
): Promise<string> {
  try {
    const { data } = await apiClient.post<SwapOfferDto>(
      `/api/swap-listings/${listingId}/offers`,
      { offeredCouponId, message: message?.trim() || undefined }
    );
    return String(data.id);
  } catch (error) {
    throw mapSwapListingsError(error, t('swapListingsApi.offerSubmitFailed'));
  }
}

/** İlana gelen teklifler — GET /api/individual/swap-listings/{id}/offers (yalnızca ilan sahibi) */
export async function fetchSwapOffersForListing(
  listingId: string,
  listingTitle: string
): Promise<TradeOffer[]> {
  try {
    const { data } = await apiClient.get<SwapOfferDto[]>(
      `/api/individual/swap-listings/${listingId}/offers`
    );
    return (Array.isArray(data) ? data : []).map((dto) => mapSwapOffer(dto, listingTitle));
  } catch (error) {
    throw mapSwapListingsError(error, t('swapListingsApi.offersLoadFailed'));
  }
}

/** Teklifi kabul et — PATCH /api/individual/swap-listings/{id}/offers/{offerId}/accept */
export async function acceptSwapOffer(listingId: string, offerId: string): Promise<void> {
  try {
    await apiClient.patch(
      `/api/individual/swap-listings/${listingId}/offers/${offerId}/accept`
    );
  } catch (error) {
    throw mapSwapListingsError(error, t('tradeRepository.offerAcceptFailed'));
  }
}

/** Teklifi reddet — PATCH /api/individual/swap-listings/{id}/offers/{offerId}/reject */
export async function rejectSwapOffer(listingId: string, offerId: string): Promise<void> {
  try {
    await apiClient.patch(
      `/api/individual/swap-listings/${listingId}/offers/${offerId}/reject`
    );
  } catch (error) {
    throw mapSwapListingsError(error, t('tradeRepository.offerRejectFailed'));
  }
}

/** Gönderdiğim teklifler — GET /api/individual/swap-offers */
export async function fetchMySwapOffers(): Promise<TradeOffer[]> {
  try {
    const { data } = await apiClient.get<SwapOfferDto[]>('/api/individual/swap-offers');
    return (Array.isArray(data) ? data : []).map((dto) => mapSwapOffer(dto, t('swapListingsApi.defaultListingTitle')));
  } catch (error) {
    throw mapSwapListingsError(error, t('swapListingsApi.myOffersLoadFailed'));
  }
}

type SwapTradeDto = {
  id: string;
  swapListingId?: string;
  swapOfferId?: string;
  completedAt?: string;
};

/** İlan iptal — DELETE /api/individual/swap-listings/{id} */
export async function cancelSwapListing(listingId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/individual/swap-listings/${listingId}`);
  } catch (error) {
    throw mapSwapListingsError(error, t('swapListingsApi.cancelFailed'));
  }
}

/** Tamamlanan takaslar — GET /api/individual/swap-trades */
export async function fetchMySwapTrades(): Promise<SwapTradeDto[]> {
  try {
    const { data } = await apiClient.get<SwapTradeDto[]>('/api/individual/swap-trades');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw mapSwapListingsError(error, t('swapListingsApi.historyLoadFailed'));
  }
}
