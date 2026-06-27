import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { db, COLLECTIONS } from '../lib/firestore';
import { pushNotification } from '../lib/notifications';

type TradeOfferDoc = {
  listingId: string;
  listingTitle: string;
  fromUserId: string;
  fromUserName: string;
  status: string;
};

/** Yeni takas teklifi → ilan sahibine bildirim */
export const onTradeOfferCreated = onDocumentCreated(
  'trade_offers/{offerId}',
  async (event) => {
    const offer = event.data?.data() as TradeOfferDoc | undefined;
    const offerId = event.params.offerId;
    if (!offer || offer.status !== 'pending') return;

    const listingSnap = await db.collection(COLLECTIONS.TRADE_LISTINGS).doc(offer.listingId).get();
    if (!listingSnap.exists) return;

    const ownerId = listingSnap.data()?.ownerId as string | undefined;
    if (!ownerId || ownerId === offer.fromUserId) return;

    await pushNotification({
      userId: ownerId,
      title: 'Yeni takas teklifi',
      body: `${offer.fromUserName}, "${offer.listingTitle}" ilanına teklif gönderdi.`,
      type: 'trade_offer_received',
      data: {
        listingId: offer.listingId,
        offerId,
        tradeTab: 'mine',
      },
    });
  }
);

/** Teklif reddedildi → teklif verene bildirim (manuel red; kabul executeTradeSwap'te) */
export const onTradeOfferUpdated = onDocumentUpdated(
  'trade_offers/{offerId}',
  async (event) => {
    const before = event.data?.before.data() as TradeOfferDoc | undefined;
    const after = event.data?.after.data() as TradeOfferDoc | undefined;
    const offerId = event.params.offerId;

    if (!before || !after || before.status === after.status) return;
    if (before.status !== 'pending' || after.status !== 'rejected') return;

    await pushNotification({
      userId: after.fromUserId,
      title: 'Teklif güncellendi',
      body: `"${after.listingTitle}" ilanındaki teklifin reddedildi.`,
      type: 'trade_offer_rejected',
      data: {
        listingId: after.listingId,
        offerId,
        tradeTab: 'offers',
      },
    });
  }
);
