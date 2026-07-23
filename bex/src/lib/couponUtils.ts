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

export function decodeCouponQr(raw: string): CouponQrPayload | null {
  try {
    let json = raw.trim();
    if (!json.startsWith('{')) {
      if (typeof globalThis.atob !== 'function') return null;
      json = decodeURIComponent(escape(globalThis.atob(json)));
    }
    const parsed = JSON.parse(json) as CouponQrPayload;
    if (parsed.couponId && parsed.businessId && parsed.hash) {
      return parsed;
    }
  } catch {
    // Geçersiz QR
  }
  return null;
}

/** QR veya düz kupon kodundan lookup bilgisi çıkarır */
export function parseCouponScan(raw: string): {
  couponId?: string;
  couponCode?: string;
} | null {
  const payload = decodeCouponQr(raw);
  if (payload) return { couponId: payload.couponId };

  const code = raw.trim().toUpperCase();
  if (code.startsWith('BEX-')) return { couponCode: code };

  return null;
}

export function getCouponRemainingUses(coupon: Coupon): number {
  return Math.max(0, coupon.totalUses - coupon.usedCount);
}

export function isCouponExpired(coupon: Coupon): boolean {
  return coupon.expiresAt.toMillis() < Date.now();
}

export function getCouponDisplayStatus(
  coupon: Coupon
): 'active' | 'pending' | 'exhausted' | 'expired' | 'traded' {
  if (coupon.status === 'pending') return 'pending';
  if (coupon.status === 'traded') return 'traded';
  if (coupon.status === 'exhausted') return 'exhausted';
  if (coupon.status === 'expired' || isCouponExpired(coupon)) return 'expired';
  return 'active';
}

const EXPIRING_SOON_MS = 3 * 24 * 60 * 60 * 1000;

export function isCouponExpiringSoon(coupon: Coupon): boolean {
  if (getCouponDisplayStatus(coupon) !== 'active') return false;
  const remaining = coupon.expiresAt.toMillis() - Date.now();
  return remaining > 0 && remaining <= EXPIRING_SOON_MS;
}

export const COUPON_STATUS_LABELS = {
  active: 'Aktif',
  pending: 'Aktivasyon bekliyor',
  exhausted: 'Tükendi',
  expired: 'Süresi doldu',
  traded: 'Takas edildi',
} as const;
