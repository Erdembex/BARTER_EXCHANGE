import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import app from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';
import { Coupon } from '@/types';

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

const functions = getFunctions(app);

if (__DEV__) {
  const g = globalThis as typeof globalThis & { __bexFunctionsEmulator?: boolean };
  if (!g.__bexFunctionsEmulator) {
    try {
      connectFunctionsEmulator(functions, getDevHost(), 5001);
      g.__bexFunctionsEmulator = true;
    } catch {
      // Emulator kapalıysa prod functions kullanılır
    }
  }
}

type CouponResult = { coupon: Coupon };

export const cloudFunctions = {
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
    >(functions, 'issueCouponForSubmission');
    const { data } = await fn({ applicationId, reviewNote });
    return data.coupon;
  },

  async redeemCoupon(couponId: string): Promise<Coupon> {
    if (shouldUseDemoData()) {
      throw new Error('Demo modda cloud function çağrılmamalı.');
    }
    const fn = httpsCallable<{ couponId: string }, CouponResult>(
      functions,
      'redeemCoupon'
    );
    const { data } = await fn({ couponId });
    return data.coupon;
  },
};
