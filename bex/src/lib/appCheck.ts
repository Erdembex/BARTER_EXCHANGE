import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { CustomProvider, ReCaptchaV3Provider, initializeAppCheck } from 'firebase/app-check';
import app from '@/lib/firebase';
import { isAuthEmulatorActive } from '@/lib/devMode';

let initialized = false;

function getDebugToken(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  const fromExtra = (
    Constants.expoConfig?.extra as { appCheckDebugToken?: string } | undefined
  )?.appCheckDebugToken?.trim();
  return fromExtra || undefined;
}

function getRecaptchaSiteKey(): string | undefined {
  return process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY?.trim() || undefined;
}

/**
 * App Check yalnızca bilinçli olarak yapılandırıldığında açılır.
 * Emulator / günlük geliştirmede hiçbir şey yapmaz.
 */
export function initAppCheck(): void {
  if (initialized || isAuthEmulatorActive() || __DEV__) {
    return;
  }

  const debugToken = getDebugToken();
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

  if (Platform.OS === 'web') {
    const siteKey = getRecaptchaSiteKey();
    if (siteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      initialized = true;
    }
  }
}

export function isAppCheckReady(): boolean {
  return initialized;
}
