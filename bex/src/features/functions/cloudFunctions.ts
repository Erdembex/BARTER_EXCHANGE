import { getFunctions, httpsCallable, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import app, { isFirebaseEnabled } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';
import { Coupon } from '@/types';
import { TradeSwapResult } from '@/features/trade/types';

function getDevHost(): string {
  if (Platform.OS === 'web') return '127.0.0.1';

  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host !== 'localhost' && host !== '127.0.0.1') return host;
  }

  if (Platform.OS === 'android') return '10.0.2.2';
  return '127.0.0.1';
}

let functions: Functions | null = null;

function getFunctionsClient(): Functions {
  if (!isFirebaseEnabled() || !app) {
    throw new Error('Firebase Functions REST modunda devre dışı.');
  }
  if (!functions) {
    functions = getFunctions(app);
    if (__DEV__) {
      const g = globalThis as typeof globalThis & { __bexFunctionsEmulator?: boolean };
      if (!g.__bexFunctionsEmulator) {
        try {
          connectFunctionsEmulator(functions, getDevHost(), 5001);
          g.__bexFunctionsEmulator = true;
        } catch {
          // Emulator kapalı
        }
      }
    }
  }
  return functions;
}

type CouponResult = { coupon: Coupon };
type TradeSwapFnResult = TradeSwapResult;

export const cloudFunctions = {
  async approveApplication(
    applicationId: string,
    reviewNote?: string
  ): Promise<{ ok: boolean }> {
    if (shouldUseDemoData()) {
      throw new Error('Demo modda cloud function çağrılmamalı.');
    }
    const fn = httpsCallable<
      { applicationId: string; reviewNote?: string },
      { ok: boolean }
    >(getFunctionsClient(), 'approveApplication');
    const { data } = await fn({ applicationId, reviewNote });
    return data;
  },

  async issueCouponForSubmission(
    applicationId: string,
    reviewNote?: string
  ): Promise<Coupon> {
    if (shouldUseDemoData()) {
      throw new Error('Demo modda cloud function çağrılmamalı.');
    }
    const fn = httpsCallable<
      { applicationId: string; reviewNote?: string },
      CouponResult
    >(getFunctionsClient(), 'issueCouponForSubmission');
    const { data } = await fn({ applicationId, reviewNote });
    return data.coupon;
  },

  async redeemCoupon(couponId: string): Promise<Coupon> {
    if (shouldUseDemoData()) {
      throw new Error('Demo modda cloud function çağrılmamalı.');
    }
    const fn = httpsCallable<{ couponId: string }, CouponResult>(
      getFunctionsClient(),
      'redeemCoupon'
    );
    const { data } = await fn({ couponId });
    return data.coupon;
  },

  async executeTradeSwap(offerId: string): Promise<TradeSwapResult> {
    if (shouldUseDemoData()) {
      throw new Error('Demo modda cloud function çağrılmamalı.');
    }
    const fn = httpsCallable<{ offerId: string }, TradeSwapFnResult>(
      getFunctionsClient(),
      'executeTradeSwap'
    );
    const { data } = await fn({ offerId });
    return data;
  },
};
