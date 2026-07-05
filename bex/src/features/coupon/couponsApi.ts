import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { Coupon } from '@/types';

type CouponDto = {
  id: string;
  businessId?: string;
  businessName?: string;
  rewardType?: string;
  quantity?: number;
  unit?: string | null;
  description?: string | null;
  status?: string;
  expiresAt?: string | null;
  issuedAt?: string | null;
};

function mapCouponDto(dto: CouponDto): Coupon {
  const description =
    dto.description?.trim() ||
    [dto.quantity, dto.unit, dto.rewardType].filter(Boolean).join(' ') ||
    'Kupon';
  const expiresAt = dto.expiresAt
    ? Timestamp.fromDate(new Date(dto.expiresAt))
    : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const statusRaw = dto.status?.toUpperCase();
  let status: Coupon['status'] = 'active';
  if (statusRaw === 'USED' || statusRaw === 'EXHAUSTED') status = 'exhausted';
  if (statusRaw === 'EXPIRED') status = 'expired';
  if (statusRaw === 'SWAPPED') status = 'traded';

  return {
    id: String(dto.id),
    userId: '',
    businessId: dto.businessId ? String(dto.businessId) : '',
    taskId: '',
    applicationId: '',
    rewardDescription: description,
    totalUses: dto.quantity ?? 1,
    usedCount: 0,
    qrCode: '',
    couponCode: '',
    expiresAt,
    usageHistory: [],
    status,
    createdAt: Timestamp.now(),
    businessName: dto.businessName?.trim() || undefined,
  };
}

function mapCouponsError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 403) {
      return new Error('Kuponlar yalnızca bireysel hesaplar için görüntülenebilir.');
    }
    const detail = getApiErrorMessage(error, fallback);
    return new Error(status ? `[${status}] ${detail}` : detail);
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

/** Backend kuponları — GET /api/individual/coupons */
export async function fetchRestCoupons(status?: 'ACTIVE'): Promise<Coupon[]> {
  try {
    const { data } = await apiClient.get<CouponDto[]>('/api/individual/coupons', {
      params: status ? { status } : undefined,
    });
    return (Array.isArray(data) ? data : []).map(mapCouponDto);
  } catch (error) {
    throw mapCouponsError(error, 'Kuponlar yüklenemedi.');
  }
}

export { hasRestAuthSession };

/** Takas için uygun backend kuponları */
export async function fetchSwapEligibleCoupons(): Promise<Coupon[]> {
  const coupons = await fetchRestCoupons('ACTIVE');
  return coupons.filter((c) => c.status === 'active' && c.totalUses > c.usedCount);
}

export function isBackendCouponId(couponId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    couponId
  );
}
