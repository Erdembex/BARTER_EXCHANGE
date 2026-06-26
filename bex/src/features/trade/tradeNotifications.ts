import { notifyUser } from '@/features/notifications/notificationsRepository';

type TradeNotifyData = {
  listingId: string;
  offerId: string;
  tradeTab: 'mine' | 'offers';
};

export async function notifyTradeOfferReceived(params: {
  ownerId: string;
  fromUserName: string;
  listingTitle: string;
  listingId: string;
  offerId: string;
}): Promise<void> {
  const data: TradeNotifyData = {
    listingId: params.listingId,
    offerId: params.offerId,
    tradeTab: 'mine',
  };

  await notifyUser({
    userId: params.ownerId,
    title: 'Yeni takas teklifi',
    body: `${params.fromUserName}, "${params.listingTitle}" ilanına teklif gönderdi.`,
    type: 'trade_offer_received',
    data,
    showLocalForUserId: params.ownerId,
  });
}

export async function notifyTradeOfferAccepted(params: {
  fromUserId: string;
  listingTitle: string;
  listingId: string;
  offerId: string;
}): Promise<void> {
  const data: TradeNotifyData = {
    listingId: params.listingId,
    offerId: params.offerId,
    tradeTab: 'offers',
  };

  await notifyUser({
    userId: params.fromUserId,
    title: 'Teklifin kabul edildi',
    body: `"${params.listingTitle}" takası onaylandı. Eski kodun iptal edildi — yeni kuponun Kuponlarım sekmesinde.`,
    type: 'trade_offer_accepted',
    data,
    showLocalForUserId: params.fromUserId,
  });
}

export async function notifyTradeOfferRejected(params: {
  fromUserId: string;
  listingTitle: string;
  listingId: string;
  offerId: string;
  reason?: 'declined' | 'other_accepted';
}): Promise<void> {
  const data: TradeNotifyData = {
    listingId: params.listingId,
    offerId: params.offerId,
    tradeTab: 'offers',
  };

  const body =
    params.reason === 'other_accepted'
      ? `"${params.listingTitle}" ilanında başka bir teklif kabul edildi.`
      : `"${params.listingTitle}" ilanındaki teklifin reddedildi.`;

  await notifyUser({
    userId: params.fromUserId,
    title: 'Teklif güncellendi',
    body,
    type: 'trade_offer_rejected',
    data,
    showLocalForUserId: params.fromUserId,
  });
}
