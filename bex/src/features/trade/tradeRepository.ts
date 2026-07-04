import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { formatRelativeTime } from '@/lib/dateUtils';
import { COLLECTIONS } from '@/types';
import { couponsRepository } from '@/features/data/applicationsRepository';
import { usersRepository } from '@/features/data/usersRepository';
import {
  notifyTradeOfferAccepted,
  notifyTradeOfferReceived,
  notifyTradeOfferRejected,
} from './tradeNotifications';
import { executeTradeSwap } from './tradeCouponSwap';
import { cloudFunctions } from '@/features/functions/cloudFunctions';
import {
  createSwapListing,
  fetchMySwapListings,
  fetchSwapEligibleCoupons,
  fetchSwapListings,
  isBackendCouponId,
  useSwapRestBackend,
} from './swapListingsApi';
import {
  CreateTradeListingInput,
  CreateTradeOfferInput,
  TRADE_COUPON_PRIVATE_DOC,
  TRADE_PRIVATE_COLLECTION,
  TradeListing,
  TradeListingPrivateCoupon,
  TradeListingRecord,
  TradeOffer,
  TradeOfferPrivateCoupon,
  TradeOfferRecord,
  TradeSwapResult,
} from './types';
import { Coupon } from '@/types';

function avatarInitial(name: string): string {
  const trimmed = name.trim();
  return (trimmed[0] ?? '?').toUpperCase();
}

function toPublicOffer(record: TradeOfferRecord): TradeOffer {
  return {
    id: record.id,
    listingId: record.listingId,
    listingTitle: record.listingTitle,
    fromUserId: record.fromUserId,
    fromUserName: record.fromUserName,
    counterCouponId: record.counterCouponId,
    counterRewardLabel: record.counterRewardLabel ?? 'Kupon',
    message: record.message ?? '',
    counterListingId: record.counterListingId,
    status: record.status,
    createdAtLabel: formatRelativeTime(record.createdAt) || 'Az önce',
  };
}

function getLockedCouponIds(userId: string): Set<string> {
  const locked = new Set<string>();

  for (const listing of demoStore.getTradeListings()) {
    if (listing.ownerId === userId && listing.status === 'active') {
      locked.add(listing.couponId);
    }
  }

  for (const offer of demoStore.getTradeOffers()) {
    if (offer.fromUserId === userId && offer.status === 'pending' && offer.counterCouponId) {
      locked.add(offer.counterCouponId);
    }
  }

  return locked;
}

async function getLockedCouponIdsForUser(userId: string): Promise<Set<string>> {
  if (shouldUseDemoData()) {
    return getLockedCouponIds(userId);
  }

  const locked = new Set<string>();

  try {
    const [listingsSnap, offersSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, COLLECTIONS.TRADE_LISTINGS),
          where('ownerId', '==', userId),
          where('status', '==', 'active')
        )
      ),
      getDocs(
        query(
          collection(db, COLLECTIONS.TRADE_OFFERS),
          where('fromUserId', '==', userId),
          where('status', '==', 'pending')
        )
      ),
    ]);

    listingsSnap.docs.forEach((d) => {
      const couponId = d.data().couponId as string | undefined;
      if (couponId) locked.add(couponId);
    });

    offersSnap.docs.forEach((d) => {
      const counterCouponId = d.data().counterCouponId as string | undefined;
      if (counterCouponId) locked.add(counterCouponId);
    });
  } catch {
    // İndeks/izin hatasında boş set — validateTradeCoupon yine de kontrol eder
  }

  return locked;
}

async function validateTradeCoupon(
  userId: string,
  couponId: string,
  locked: Set<string>
): Promise<Coupon> {
  const coupon = await couponsRepository.getById(couponId);
  if (!coupon || coupon.userId !== userId || coupon.status !== 'active') {
    throw Object.assign(new Error('Geçersiz veya kullanılamayan kupon.'), {
      code: 'invalid-coupon',
    });
  }
  if (locked.has(couponId)) {
    throw Object.assign(new Error('Bu kupon zaten aktif bir takasta.'), {
      code: 'coupon-locked',
    });
  }
  return coupon;
}

function ensureDemoMarketSeed() {
  if (!shouldUseDemoData() || demoStore.getTradeListings().length > 0) return;

  const seeds: Omit<TradeListingRecord, 'id'>[] = [
    {
      ownerId: 'demo-trade-owner-1',
      ownerName: 'Elif K.',
      ownerAvatarInitial: 'E',
      title: '5x Ücretsiz Kahve Kuponu',
      description: 'Merkez şubede geçerli, son kullanım 30 gün içinde.',
      suggestedTrade: 'Berber / kuaför kuponu veya spor salonu hakkı',
      rewardLabel: '5 kullanım hakkı',
      couponId: 'coupon-demo-seed-1',
      status: 'active',
      offerCount: 0,
      createdAt: Timestamp.fromMillis(Date.now() - 2 * 86400000),
    },
    {
      ownerId: 'demo-trade-owner-2',
      ownerName: 'Mert A.',
      ownerAvatarInitial: 'M',
      title: 'Aylık Spor Salonu Üyeliği',
      description: 'Peak Fitness — 1 aylık tam erişim, sabah seansları dahil.',
      suggestedTrade: 'Tasarım / sosyal medya içeriği karşılığı',
      rewardLabel: '1 ay üyelik',
      couponId: 'coupon-demo-seed-2',
      status: 'active',
      offerCount: 0,
      createdAt: Timestamp.fromMillis(Date.now() - 5 * 86400000),
    },
  ];

  demoStore.setTradeListings(
    seeds.map((seed, index) => ({
      id: `demo-seed-tl-${index + 1}`,
      ...seed,
    }))
  );
}

function toPublicListing(record: TradeListingRecord): TradeListing {
  return {
    id: record.id,
    ownerId: record.ownerId,
    ownerName: record.ownerName,
    ownerAvatarInitial: record.ownerAvatarInitial,
    title: record.title,
    description: record.description,
    suggestedTrade: record.suggestedTrade,
    rewardLabel: record.rewardLabel,
    couponId: record.couponId,
    status: record.status,
    offerCount: record.offerCount,
    createdAtLabel: formatRelativeTime(record.createdAt) || 'Az önce',
  };
}

function mergeTradeListings(primary: TradeListing[], secondary: TradeListing[]): TradeListing[] {
  const seen = new Set(primary.map((listing) => listing.id));
  return [...primary, ...secondary.filter((listing) => !seen.has(listing.id))];
}

async function getLegacyMyListings(ownerId: string): Promise<TradeListing[]> {
  if (shouldUseDemoData()) {
    return demoStore
      .getTradeListings()
      .filter((listing) => listing.ownerId === ownerId)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .map(toPublicListing);
  }

  try {
    const q = query(
      collection(db, COLLECTIONS.TRADE_LISTINGS),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      toPublicListing({ id: d.id, ...d.data() } as TradeListingRecord)
    );
  } catch {
    try {
      const fallback = query(
        collection(db, COLLECTIONS.TRADE_LISTINGS),
        where('ownerId', '==', ownerId)
      );
      const snap = await getDocs(fallback);
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as TradeListingRecord)
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .map(toPublicListing);
    } catch {
      return [];
    }
  }
}

export const tradeRepository = {
  /** Takasa uygun aktif kuponlar (kilitli olanlar hariç) */
  async getAvailableTradeCoupons(userId: string): Promise<Coupon[]> {
    if (await useSwapRestBackend()) {
      try {
        const restCoupons = await fetchSwapEligibleCoupons();
        if (restCoupons.length > 0) {
          const locked = await getLockedCouponIdsForUser(userId);
          return restCoupons.filter((coupon) => !locked.has(coupon.id));
        }
      } catch {
        // Backend kupon yoksa veya hata varsa yerel/demo yedeğine düş
      }
    }

    if (shouldUseDemoData()) {
      demoStore.ensureSampleCouponForUser(userId);
    }

    const locked = await getLockedCouponIdsForUser(userId);
    const active = await couponsRepository.getActiveByUser(userId);
    return active.filter((coupon) => !locked.has(coupon.id));
  },

  /** Aktif ilanları getirir — couponCode asla dönmez */
  async getActiveListings(): Promise<TradeListing[]> {
    if (shouldUseDemoData()) {
      ensureDemoMarketSeed();
      return demoStore.getTradeListings()
        .filter((listing) => listing.status === 'active')
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .map(toPublicListing);
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.TRADE_LISTINGS),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        toPublicListing({ id: d.id, ...d.data() } as TradeListingRecord)
      );
    } catch {
      return [];
    }
  },

  async getMarketListings(): Promise<TradeListing[]> {
    const legacy = await this.getActiveListings();

    if (!(await useSwapRestBackend())) {
      return legacy;
    }

    try {
      const rest = await fetchSwapListings();
      return mergeTradeListings(rest, legacy);
    } catch {
      return legacy;
    }
  },

  async getMyListings(ownerId: string): Promise<TradeListing[]> {
    const legacy = await getLegacyMyListings(ownerId);

    if (!(await useSwapRestBackend())) {
      return legacy;
    }

    try {
      const rest = await fetchMySwapListings();
      return mergeTradeListings(rest, legacy);
    } catch {
      return legacy;
    }
  },

  /** Tek ilan — couponCode asla dönmez */
  async getListingById(listingId: string): Promise<TradeListing | null> {
    if (shouldUseDemoData()) {
      const record = demoStore.getTradeListings().find((listing) => listing.id === listingId);
      return record ? toPublicListing(record) : null;
    }

    const snap = await getDoc(doc(db, COLLECTIONS.TRADE_LISTINGS, listingId));
    if (!snap.exists()) return null;
    return toPublicListing({ id: snap.id, ...snap.data() } as TradeListingRecord);
  },

  /**
   * İlan oluşturur; kupon kodu private alt belgeye yazılır.
   * Ana ilan belgesinde couponCode tutulmaz.
   */
  async createListing(ownerId: string, input: CreateTradeListingInput): Promise<string> {
    if ((await useSwapRestBackend()) && isBackendCouponId(input.couponId)) {
      return createSwapListing(input);
    }

    const locked = await getLockedCouponIdsForUser(ownerId);
    const coupon = await validateTradeCoupon(ownerId, input.couponId, locked);

    const ownerName = await usersRepository.getDisplayName(ownerId);
    const record: Omit<TradeListingRecord, 'id'> = {
      ownerId,
      ownerName,
      ownerAvatarInitial: avatarInitial(ownerName),
      title: input.title.trim(),
      description: input.description.trim(),
      suggestedTrade: input.suggestedTrade.trim(),
      rewardLabel: input.rewardLabel.trim(),
      couponId: input.couponId,
      status: 'active',
      offerCount: 0,
      createdAt: Timestamp.now(),
    };

    const privateCoupon: TradeListingPrivateCoupon = {
      couponCode: coupon.couponCode,
      ownerId,
    };

    if (shouldUseDemoData()) {
      const id = demoStore.nextTradeId('tl');
      demoStore.setTradeListings([{ id, ...record }, ...demoStore.getTradeListings()]);
      demoStore.setTradeListingSecret(id, privateCoupon);
      return id;
    }

    const listingRef = doc(collection(db, COLLECTIONS.TRADE_LISTINGS));
    const batch = writeBatch(db);

    batch.set(listingRef, {
      ...record,
      createdAt: serverTimestamp(),
    });
    batch.set(
      doc(listingRef, TRADE_PRIVATE_COLLECTION, TRADE_COUPON_PRIVATE_DOC),
      privateCoupon
    );

    await batch.commit();
    return listingRef.id;
  },

  /**
   * Takas teklifi — teklif eden kendi kuponunu seçmek zorunda.
   */
  async submitOffer(
    fromUserId: string,
    listingId: string,
    input: CreateTradeOfferInput
  ): Promise<string> {
    if (!input.counterCouponId?.trim()) {
      throw Object.assign(new Error('Takasa katılmak için kupon seçmelisin.'), {
        code: 'missing-counter-coupon',
      });
    }

    const listing = await this.getListingById(listingId);
    if (!listing || listing.status !== 'active') {
      throw Object.assign(new Error('İlan bulunamadı veya artık aktif değil.'), {
        code: 'listing-unavailable',
      });
    }
    if (listing.ownerId === fromUserId) {
      throw Object.assign(new Error('Kendi ilanına teklif veremezsin.'), {
        code: 'self-offer',
      });
    }
    if (listing.couponId === input.counterCouponId) {
      throw Object.assign(new Error('Aynı kuponu takas edemezsin.'), {
        code: 'same-coupon',
      });
    }

    const locked = await getLockedCouponIdsForUser(fromUserId);
    const counterCoupon = await validateTradeCoupon(
      fromUserId,
      input.counterCouponId,
      locked
    );

    const fromUserName = await usersRepository.getDisplayName(fromUserId);
    const message = (input.message ?? '').trim();

    const offerBase: Omit<TradeOfferRecord, 'id'> = {
      listingId,
      listingTitle: listing.title,
      fromUserId,
      fromUserName,
      counterCouponId: counterCoupon.id,
      counterRewardLabel: counterCoupon.rewardDescription,
      message,
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    if (shouldUseDemoData()) {
      const id = demoStore.nextTradeId('to');
      demoStore.setTradeOffers([{ id, ...offerBase }, ...demoStore.getTradeOffers()]);
      demoStore.setTradeListings(
        demoStore.getTradeListings().map((item) =>
          item.id === listingId ? { ...item, offerCount: item.offerCount + 1 } : item
        )
      );

      await notifyTradeOfferReceived({
        ownerId: listing.ownerId,
        fromUserName,
        listingTitle: listing.title,
        listingId,
        offerId: id,
      });

      return id;
    }

    const offerRef = doc(collection(db, COLLECTIONS.TRADE_OFFERS));
    const batch = writeBatch(db);

    batch.set(offerRef, {
      ...offerBase,
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, COLLECTIONS.TRADE_LISTINGS, listingId), {
      offerCount: increment(1),
    });

    await batch.commit();

    return offerRef.id;
  },

  /**
   * Kupon kodunu yalnızca yetkili durumlarda okur (demo + Firestore).
   * UI bağlantısı sonraki aşamada yapılacak.
   */
  async getListingCouponCode(
    listingId: string,
    requesterId: string
  ): Promise<string | null> {
    if (shouldUseDemoData()) {
      const listing = demoStore.getTradeListings().find((item) => item.id === listingId);
      if (!listing) return null;

      const secret = demoStore.getTradeListingSecret(listingId);
      if (!secret) return null;

      const revealed =
        listing.ownerId === requesterId ||
        (listing.status === 'completed' && listing.acceptedFromUserId === requesterId);

      return revealed ? secret.couponCode : null;
    }

    const listingSnap = await getDoc(doc(db, COLLECTIONS.TRADE_LISTINGS, listingId));
    if (!listingSnap.exists()) return null;

    const listing = listingSnap.data() as TradeListingRecord;
    const canRead =
      listing.ownerId === requesterId ||
      (listing.status === 'completed' && listing.acceptedFromUserId === requesterId);

    if (!canRead) return null;

    const secretSnap = await getDoc(
      doc(
        db,
        COLLECTIONS.TRADE_LISTINGS,
        listingId,
        TRADE_PRIVATE_COLLECTION,
        TRADE_COUPON_PRIVATE_DOC
      )
    );

    if (!secretSnap.exists()) return null;
    return (secretSnap.data() as TradeListingPrivateCoupon).couponCode;
  },

  /** İlan sahibinin gelen teklifleri — couponCode dönmez */
  async getOffersForListing(listingId: string, ownerId: string): Promise<TradeOffer[]> {
    if (shouldUseDemoData()) {
      const listing = demoStore.getTradeListings().find((item) => item.id === listingId);
      if (!listing || listing.ownerId !== ownerId) return [];

      return demoStore.getTradeOffers()
        .filter((offer) => offer.listingId === listingId)
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .map(toPublicOffer);
    }

    const listingSnap = await getDoc(doc(db, COLLECTIONS.TRADE_LISTINGS, listingId));
    if (!listingSnap.exists()) return [];
    if ((listingSnap.data() as TradeListingRecord).ownerId !== ownerId) return [];

    try {
      const q = query(
        collection(db, COLLECTIONS.TRADE_OFFERS),
        where('listingId', '==', listingId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        toPublicOffer({ id: d.id, ...d.data() } as TradeOfferRecord)
      );
    } catch {
      return [];
    }
  },

  /** Kullanıcının gönderdiği teklifler — couponCode dönmez */
  async getMyOffers(fromUserId: string): Promise<TradeOffer[]> {
    if (shouldUseDemoData()) {
      return demoStore.getTradeOffers()
        .filter((offer) => offer.fromUserId === fromUserId)
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .map(toPublicOffer);
    }

    try {
      const q = query(
        collection(db, COLLECTIONS.TRADE_OFFERS),
        where('fromUserId', '==', fromUserId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        toPublicOffer({ id: d.id, ...d.data() } as TradeOfferRecord)
      );
    } catch {
      return [];
    }
  },

  async getOfferCouponCode(offerId: string, requesterId: string): Promise<string | null> {
    if (shouldUseDemoData()) {
      const offer = demoStore.getTradeOffers().find((item) => item.id === offerId);
      if (!offer) return null;

      const listing = demoStore.getTradeListings().find((item) => item.id === offer.listingId);
      const secret = demoStore.getTradeOfferSecret(offerId);
      if (!secret) return null;

      const revealed =
        offer.fromUserId === requesterId ||
        (offer.status === 'accepted' && listing?.ownerId === requesterId);

      return revealed ? secret.couponCode : null;
    }

    const offerSnap = await getDoc(doc(db, COLLECTIONS.TRADE_OFFERS, offerId));
    if (!offerSnap.exists()) return null;

    const offer = offerSnap.data() as TradeOfferRecord;
    const listingSnap = await getDoc(doc(db, COLLECTIONS.TRADE_LISTINGS, offer.listingId));
    const listing = listingSnap.exists()
      ? (listingSnap.data() as TradeListingRecord)
      : null;

    const canRead =
      offer.fromUserId === requesterId ||
      (offer.status === 'accepted' && listing?.ownerId === requesterId);

    if (!canRead) return null;

    const secretSnap = await getDoc(
      doc(
        db,
        COLLECTIONS.TRADE_OFFERS,
        offerId,
        TRADE_PRIVATE_COLLECTION,
        TRADE_COUPON_PRIVATE_DOC
      )
    );

    if (!secretSnap.exists()) return null;
    return (secretSnap.data() as TradeOfferPrivateCoupon).couponCode;
  },

  async rejectOffer(ownerId: string, offerId: string): Promise<void> {
    if (shouldUseDemoData()) {
      const offer = demoStore.getTradeOffers().find((item) => item.id === offerId);
      if (!offer) {
        throw Object.assign(new Error('Teklif bulunamadı.'), { code: 'offer-not-found' });
      }
      const listing = demoStore.getTradeListings().find((item) => item.id === offer.listingId);
      if (!listing || listing.ownerId !== ownerId) {
        throw Object.assign(new Error('Bu teklifi yönetemezsin.'), { code: 'forbidden' });
      }
      if (offer.status !== 'pending') {
        throw Object.assign(new Error('Teklif artık beklemede değil.'), { code: 'offer-closed' });
      }

      demoStore.setTradeOffers(
        demoStore.getTradeOffers().map((item) =>
          item.id === offerId ? { ...item, status: 'rejected' } : item
        )
      );

      await notifyTradeOfferRejected({
        fromUserId: offer.fromUserId,
        listingTitle: offer.listingTitle,
        listingId: offer.listingId,
        offerId: offer.id,
        reason: 'declined',
      });

      return;
    }

    const offerSnap = await getDoc(doc(db, COLLECTIONS.TRADE_OFFERS, offerId));
    if (!offerSnap.exists()) {
      throw Object.assign(new Error('Teklif bulunamadı.'), { code: 'offer-not-found' });
    }

    const offer = { id: offerSnap.id, ...offerSnap.data() } as TradeOfferRecord;
    const listingSnap = await getDoc(doc(db, COLLECTIONS.TRADE_LISTINGS, offer.listingId));
    if (!listingSnap.exists()) {
      throw Object.assign(new Error('İlan bulunamadı.'), { code: 'listing-not-found' });
    }

    const listing = listingSnap.data() as TradeListingRecord;
    if (listing.ownerId !== ownerId) {
      throw Object.assign(new Error('Bu teklifi yönetemezsin.'), { code: 'forbidden' });
    }
    if (offer.status !== 'pending' || listing.status !== 'active') {
      throw Object.assign(new Error('Teklif artık beklemede değil.'), { code: 'offer-closed' });
    }

    const batch = writeBatch(db);
    batch.update(doc(db, COLLECTIONS.TRADE_OFFERS, offerId), { status: 'rejected' });
    await batch.commit();
  },

  async acceptOffer(ownerId: string, offerId: string): Promise<TradeSwapResult> {
    if (shouldUseDemoData()) {
      const offer = demoStore.getTradeOffers().find((item) => item.id === offerId);
      if (!offer) {
        throw Object.assign(new Error('Teklif bulunamadı.'), { code: 'offer-not-found' });
      }

      const listingIndex = demoStore.getTradeListings().findIndex(
        (item) => item.id === offer.listingId
      );
      if (listingIndex < 0) {
        throw Object.assign(new Error('İlan bulunamadı.'), { code: 'listing-not-found' });
      }

      const listing = demoStore.getTradeListings()[listingIndex];
      if (listing.ownerId !== ownerId) {
        throw Object.assign(new Error('Bu teklifi yönetemezsin.'), { code: 'forbidden' });
      }
      if (offer.status !== 'pending' || listing.status !== 'active') {
        throw Object.assign(new Error('Teklif artık beklemede değil.'), { code: 'offer-closed' });
      }

      const autoRejected = demoStore.getTradeOffers().filter(
        (item) =>
          item.listingId === listing.id && item.id !== offerId && item.status === 'pending'
      );

      const swapResult = await executeTradeSwap(listing, offer);

      demoStore.setTradeOffers(
        demoStore.getTradeOffers().map((item) => {
          if (item.listingId !== listing.id) return item;
          if (item.id === offerId) return { ...item, status: 'accepted' };
          if (item.status === 'pending') return { ...item, status: 'rejected' };
          return item;
        })
      );

      demoStore.setTradeListings(
        demoStore.getTradeListings().map((item, index) =>
          index === listingIndex
            ? {
                ...item,
                status: 'completed',
                acceptedOfferId: offerId,
                acceptedFromUserId: offer.fromUserId,
                tradeCompletedAt: Timestamp.now(),
              }
            : item
        )
      );

      await notifyTradeOfferAccepted({
        fromUserId: offer.fromUserId,
        listingTitle: offer.listingTitle,
        listingId: offer.listingId,
        offerId: offer.id,
      });

      await Promise.all(
        autoRejected.map((rejected) =>
          notifyTradeOfferRejected({
            fromUserId: rejected.fromUserId,
            listingTitle: rejected.listingTitle,
            listingId: rejected.listingId,
            offerId: rejected.id,
            reason: 'other_accepted',
          })
        )
      );

      return swapResult;
    }

    const offerRef = doc(db, COLLECTIONS.TRADE_OFFERS, offerId);
    const offerSnap = await getDoc(offerRef);
    if (!offerSnap.exists()) {
      throw Object.assign(new Error('Teklif bulunamadı.'), { code: 'offer-not-found' });
    }

    const offer = { id: offerSnap.id, ...offerSnap.data() } as TradeOfferRecord;
    const listingRef = doc(db, COLLECTIONS.TRADE_LISTINGS, offer.listingId);
    const listingSnap = await getDoc(listingRef);
    if (!listingSnap.exists()) {
      throw Object.assign(new Error('İlan bulunamadı.'), { code: 'listing-not-found' });
    }

    const listing = { id: listingSnap.id, ...listingSnap.data() } as TradeListingRecord;
    if (listing.ownerId !== ownerId) {
      throw Object.assign(new Error('Bu teklifi yönetemezsin.'), { code: 'forbidden' });
    }
    if (offer.status !== 'pending' || listing.status !== 'active') {
      throw Object.assign(new Error('Teklif artık beklemede değil.'), { code: 'offer-closed' });
    }

    const swapResult = await cloudFunctions.executeTradeSwap(offerId);

    return swapResult;
  },
};
