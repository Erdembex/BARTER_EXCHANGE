import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { CustomProvider, ReCaptchaV3Provider, initializeAppCheck } from 'firebase/app-check';
import app from '@/lib/firebase';
import { isAuthEmulatorActive } from '@/lib/devMode';

let initialized = false;

function getDebugToken(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN ??
    (Constants.expoConfig?.extra as { appCheckDebugToken?: string } | undefined)
      ?.appCheckDebugToken
  );
}

function getRecaptchaSiteKey(): string | undefined {
  return process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;
}

/** Auth emulator modunda App Check atlanır (yerel geliştirme). */
export function initAppCheck(): void {
  if (initialized || isAuthEmulatorActive()) {
    return;
  }

  const debugToken = getDebugToken();

  if (__DEV__) {
    if (debugToken) {
      initializeAppCheck(app, {
        provider: new CustomProvider({
          getToken: () =>
            Promise.resolve({
              token: debugToken,
              expireTimeMillis: Date.now() + 60 * 60 * 1000,
            }),
        }),
        isTokenAutoRefreshEnabled: true,
      });
      initialized = true;
      return;
    }

    (
      globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }
    ).FIREBASE_APPCHECK_DEBUG_TOKEN = true;

    console.info(
      '[AppCheck] Debug token yok. Firebase Console > App Check > Manage debug tokens bölümüne ' +
        'konsoldaki tokeni ekle ve EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN olarak .env dosyana yaz.'
    );
    return;
  }

  if (Platform.OS === 'web') {
    const siteKey = getRecaptchaSiteKey();
    if (siteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      initialized = true;
    }
    return;
  }

  // Production native: Play Integrity / DeviceCheck — EAS dev build + RN Firebase gerekir
}

export function isAppCheckReady(): boolean {
  return initialized;
}
