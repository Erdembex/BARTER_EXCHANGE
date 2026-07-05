import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { Coupon } from '@/types';

type CouponDto = {
  id?: string;
  businessId?: string;
  businessName?: string | null;
  rewardType?: string;
  quantity?: number;
  unit?: string | null;
  description?: string | null;
  status?: string;
  issuedAt?: string;
  expiresAt?: string;
};

function mapCouponStatus(status?: string): Coupon['status'] {
  const key = status?.toUpperCase() ?? '';
  if (key === 'USED' || key === 'EXHAUSTED') return 'exhausted';
  if (key === 'EXPIRED') return 'expired';
  if (key === 'SWAPPED') return 'traded';
  return 'active';
}

function toTimestamp(value?: string): Timestamp {
  if (!value) return Timestamp.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
}

export function mapCouponDto(
  dto: CouponDto,
  applicationId: string,
  taskId: string,
  userId: string
): Coupon {
  const description =
    dto.description?.trim() ||
    [dto.quantity, dto.unit, dto.rewardType].filter(Boolean).join(' ') ||
    'Ödül';

  return {
    id: String(dto.id),
    userId,
    businessId: String(dto.businessId ?? ''),
    taskId,
    applicationId,
    rewardDescription: description,
    totalUses: dto.quantity ?? 1,
    usedCount: 0,
    qrCode: String(dto.id),
    couponCode: `BEX-${String(dto.id).slice(0, 8).toUpperCase()}`,
    expiresAt: toTimestamp(dto.expiresAt),
    usageHistory: [],
    status: mapCouponStatus(dto.status),
    createdAt: toTimestamp(dto.issuedAt),
    businessName: dto.businessName?.trim() || undefined,
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

/** POST /api/business/applications/{id}/issue-coupon */
export async function issueBusinessCoupon(
  applicationId: string,
  note?: string
): Promise<CouponDto> {
  try {
    const { data } = await apiClient.post<CouponDto>(
      `/api/business/applications/${applicationId}/issue-coupon`,
      null,
      { params: note?.trim() ? { note: note.trim() } : undefined }
    );
    return data;
  } catch (error) {
    throw mapError(error, 'Kupon oluşturulamadı.');
  }
}
