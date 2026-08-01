import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { mapCategoryToBackendSkill } from '@/features/listing/listingsApi';
import { ChatOffer, ChatOfferStatus, TaskCategory } from '@/types';

export type SendChatOfferInput = {
  title: string;
  description: string;
  category: TaskCategory;
  estimatedHours: number;
  rewardDescription: string;
  rewardQuantity: number;
  validityDays: number;
  note?: string;
};

type OfferDto = {
  id?: string;
  messageId?: string;
  listingId?: string;
  listingTitle?: string | null;
  listingDescription?: string | null;
  resultApplicationId?: string | null;
  rewardType?: string;
  quantity?: number;
  unit?: string;
  validityDays?: number;
  note?: string | null;
  status?: string;
};

function mapHoursToWeekly(hours: number): string {
  if (hours <= 3) return 'H1_3';
  if (hours <= 5) return 'H3_5';
  if (hours <= 10) return 'H5_10';
  return 'H10_PLUS';
}

function mapOffer(dto: OfferDto): ChatOffer {
  const status = (dto.status?.toUpperCase() ?? 'PENDING') as ChatOfferStatus;
  return {
    id: String(dto.id),
    messageId: String(dto.messageId ?? ''),
    listingId: dto.listingId ? String(dto.listingId) : undefined,
    listingTitle: dto.listingTitle?.trim() || undefined,
    listingDescription: dto.listingDescription?.trim() || undefined,
    resultApplicationId: dto.resultApplicationId ? String(dto.resultApplicationId) : undefined,
    rewardType: dto.rewardType ?? 'CUSTOM',
    quantity: dto.quantity ?? 1,
    unit: dto.unit?.trim() || 'adet',
    validityDays: dto.validityDays ?? 30,
    note: dto.note?.trim() || undefined,
    status,
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function formatOfferLabel(offer: ChatOffer): string {
  if (offer.listingTitle) return offer.listingTitle;
  const typeLabels: Record<string, string> = {
    COFFEE: 'Kahve',
    GYM_MEMBERSHIP: 'Spor',
    PRODUCT: 'Ürün',
    DISCOUNT: 'İndirim',
    CUSTOM: 'Özel ödül',
  };
  const typeLabel = typeLabels[offer.rewardType.toUpperCase()] ?? offer.rewardType;
  return `${offer.quantity} ${offer.unit} · ${typeLabel}`;
}

export async function sendConversationOffer(
  conversationId: string,
  input: SendChatOfferInput
): Promise<ChatOffer> {
  try {
    const { data } = await apiClient.post<OfferDto>(
      `/api/conversations/${conversationId}/offers`,
      {
        title: input.title.trim(),
        description: input.description.trim(),
        weeklyHours: mapHoursToWeekly(input.estimatedHours),
        skills: [mapCategoryToBackendSkill(input.category)],
        reward: {
          rewardType: 'CUSTOM',
          quantity: input.rewardQuantity,
          unit: 'adet',
          validityDays: input.validityDays,
          description: input.rewardDescription.trim(),
        },
        note: input.note?.trim() || undefined,
      }
    );
    return mapOffer(data);
  } catch (error) {
    throw mapError(error, 'İş ilanı gönderilemedi.');
  }
}

export async function acceptConversationOffer(
  conversationId: string,
  offerId: string
): Promise<void> {
  try {
    await apiClient.patch(`/api/conversations/${conversationId}/offers/${offerId}/accept`);
  } catch (error) {
    throw mapError(error, 'İş ilanı kabul edilemedi.');
  }
}

export async function rejectConversationOffer(
  conversationId: string,
  offerId: string
): Promise<void> {
  try {
    await apiClient.patch(`/api/conversations/${conversationId}/offers/${offerId}/reject`);
  } catch (error) {
    throw mapError(error, 'İş ilanı reddedilemedi.');
  }
}

export { mapOffer as mapOfferDto };
