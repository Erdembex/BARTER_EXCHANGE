import { Timestamp } from 'firebase/firestore';

export type TradeListingStatus = 'active' | 'paused' | 'completed';

export type TradeOfferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export type TradeHistoryStatus = 'completed' | 'accepted' | 'rejected' | 'cancelled' | 'pending';

export interface TradeHistoryEntry {
  id: string;
  kind: 'offer' | 'listing';
  title: string;
  subtitle: string;
  detail: string;
  status: TradeHistoryStatus;
  createdAtLabel: string;
  referenceId: string;
}

/** Kullanıcının pazara koyduğu kupon / ödül ilanı */
export interface TradeListing {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatarInitial: string;
  title: string;
  description: string;
  suggestedTrade: string;
  rewardLabel: string;
  couponId: string;
  status: TradeListingStatus;
  offerCount: number;
  createdAtLabel: string;
}

/** Bir ilana gelen takas teklifi */
export interface TradeOffer {
  id: string;
  listingId: string;
  listingTitle: string;
  fromUserId: string;
  fromUserName: string;
  /** Teklif edenin takasa koyduğu kupon (kod gösterilmez) */
  counterCouponId: string;
  counterRewardLabel: string;
  message: string;
  counterListingId?: string;
  status: TradeOfferStatus;
  createdAtLabel: string;
}

/** Firestore trade_listings belgesi — couponCode burada tutulmaz */
export interface TradeListingRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatarInitial: string;
  title: string;
  description: string;
  suggestedTrade: string;
  rewardLabel: string;
  couponId: string;
  status: TradeListingStatus;
  offerCount: number;
  createdAt: Timestamp;
  acceptedOfferId?: string;
  acceptedFromUserId?: string;
  tradeCompletedAt?: Timestamp;
}

export type CreateTradeListingInput = Pick<
  TradeListingRecord,
  'title' | 'description' | 'suggestedTrade' | 'rewardLabel' | 'couponId'
>;

export interface TradeListingPrivateCoupon {
  couponCode: string;
  ownerId: string;
}

/** Firestore trade_offers belgesi */
export interface TradeOfferRecord {
  id: string;
  listingId: string;
  listingTitle: string;
  fromUserId: string;
  fromUserName: string;
  counterCouponId: string;
  counterRewardLabel: string;
  message: string;
  counterListingId?: string;
  status: TradeOfferStatus;
  createdAt: Timestamp;
}

/** Takas teklifi — kupon seçimi zorunlu */
export type CreateTradeOfferInput = {
  counterCouponId: string;
  message?: string;
};

export interface TradeOfferPrivateCoupon {
  couponCode: string;
  fromUserId: string;
}

export const TRADE_PRIVATE_COLLECTION = 'private';
export const TRADE_COUPON_PRIVATE_DOC = 'coupon';

export interface TradeSwapResult {
  ownerNewCouponId: string;
  offererNewCouponId: string;
}
