import { Coupon } from '@/types';

export interface CouponQrPayload {
  couponId: string;
  businessId: string;
  hash: string;
  issuedAt: number;
}

export function buildCouponQrPayload(coupon: Coupon): CouponQrPayload {
  return {
    couponId: coupon.id,
    businessId: coupon.businessId,
    hash: coupon.qrCode,
    issuedAt: coupon.createdAt.toMillis(),
  };
}

export function encodeCouponQr(coupon: Coupon): string {
  const json = JSON.stringify(buildCouponQrPayload(coupon));
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(unescape(encodeURIComponent(json)));
  }
  return json;
}

export function getCouponRemainingUses(coupon: Coupon): number {
  return Math.max(0, coupon.totalUses - coupon.usedCount);
}

export function isCouponExpired(coupon: Coupon): boolean {
  return coupon.expiresAt.toMillis() < Date.now();
}

export function getCouponDisplayStatus(
  coupon: Coupon
): 'active' | 'exhausted' | 'expired' {
  if (coupon.status === 'exhausted') return 'exhausted';
  if (coupon.status === 'expired' || isCouponExpired(coupon)) return 'expired';
  return 'active';
}

export const COUPON_STATUS_LABELS = {
  active: 'Aktif',
  exhausted: 'Tükendi',
  expired: 'Süresi doldu',
} as const;
