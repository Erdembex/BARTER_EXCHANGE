import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { BexNotification, NotificationType } from '@/types';

type NotificationDto = {
  id?: string;
  type?: string;
  referenceId?: string | null;
  referenceType?: string | null;
  title?: string;
  body?: string;
  isRead?: boolean;
  createdAt?: string;
};

type NotificationsPageDto = {
  content?: NotificationDto[];
  nextCursor?: string | null;
};

const TYPE_MAP: Record<string, NotificationType> = {
  APPLICATION_RECEIVED: 'general',
  APPLICATION_ACCEPTED: 'application_approved',
  APPLICATION_REJECTED: 'application_rejected',
  NEW_MESSAGE: 'message',
  OFFER_RECEIVED: 'trade_offer_received',
  OFFER_ACCEPTED: 'trade_offer_accepted',
  OFFER_REJECTED: 'trade_offer_rejected',
  COUPON_ISSUED: 'coupon_issued',
  COUPON_EXPIRING_SOON: 'general',
  COUPON_EXPIRED: 'general',
  SWAP_OFFER_RECEIVED: 'trade_offer_received',
  SWAP_OFFER_ACCEPTED: 'trade_offer_accepted',
  SWAP_OFFER_REJECTED: 'trade_offer_rejected',
  SWAP_COMPLETED: 'trade_offer_accepted',
  SUBSCRIPTION_RENEWED: 'general',
  SUBSCRIPTION_PAYMENT_FAILED: 'general',
  PLAN_UPGRADED: 'general',
};

function toTimestamp(value?: string): Timestamp {
  if (!value) return Timestamp.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
}

function mapNotification(dto: NotificationDto, userId: string): BexNotification {
  const typeKey = dto.type?.toUpperCase() ?? '';
  const data: Record<string, string> = {};
  if (dto.referenceId) {
    if (dto.referenceType?.toLowerCase().includes('application')) {
      data.applicationId = String(dto.referenceId);
    } else if (dto.referenceType?.toLowerCase().includes('listing')) {
      data.taskId = String(dto.referenceId);
    } else {
      data.referenceId = String(dto.referenceId);
    }
  }

  return {
    id: String(dto.id),
    userId,
    title: dto.title?.trim() || 'Bildirim',
    body: dto.body?.trim() || '',
    type: TYPE_MAP[typeKey] ?? 'general',
    data,
    read: dto.isRead ?? false,
    createdAt: toTimestamp(dto.createdAt),
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export async function fetchNotifications(
  userId: string,
  pageSize = 50
): Promise<BexNotification[]> {
  try {
    const { data, headers } = await apiClient.get<NotificationsPageDto>('/api/notifications', {
      params: { pageSize },
    });
    const rows = Array.isArray(data?.content) ? data.content : [];
    return rows.map((row) => mapNotification(row, userId));
  } catch (error) {
    throw mapError(error, 'Bildirimler yüklenemedi.');
  }
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    const { data } = await apiClient.get<{ count?: number }>('/api/notifications/unread-count');
    return typeof data?.count === 'number' ? data.count : 0;
  } catch {
    return 0;
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/api/notifications/read-all');
}

export async function markNotificationReadByReference(referenceId: string): Promise<void> {
  await apiClient.patch(`/api/notifications/read-by-reference/${referenceId}`);
}
