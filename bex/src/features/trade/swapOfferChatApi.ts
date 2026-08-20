import { apiClient } from '@/lib/api';

export type SwapOfferMessage = {
  id: string;
  swapOfferId: string;
  senderId: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

type SwapOfferMessageDto = {
  id: string;
  swapOfferId: string;
  senderId: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

function mapMessage(dto: SwapOfferMessageDto): SwapOfferMessage {
  return {
    id: dto.id,
    swapOfferId: dto.swapOfferId,
    senderId: dto.senderId,
    body: dto.body,
    createdAt: dto.createdAt,
    mine: dto.mine,
  };
}

export async function fetchSwapOfferMessages(offerId: string): Promise<SwapOfferMessage[]> {
  const { data } = await apiClient.get<SwapOfferMessageDto[]>(
    `/api/swap-offers/${offerId}/messages`
  );
  return Array.isArray(data) ? data.map(mapMessage) : [];
}

export async function sendSwapOfferMessage(
  offerId: string,
  body: string
): Promise<SwapOfferMessage> {
  const { data } = await apiClient.post<SwapOfferMessageDto>(
    `/api/swap-offers/${offerId}/messages`,
    { body }
  );
  return mapMessage(data);
}
