import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDinx7Ufj8QSFlztCI410kzWb-bfSNf8JU',
  authDomain: 'bexcursor.firebaseapp.com',
  projectId: 'bexcursor',
  storageBucket: 'bexcursor.firebasestorage.app',
  messagingSenderId: '671290008734',
  appId: '1:671290008734:web:f7ead50594a01d28dfc78f',
};

function getDevHost(): string {
  if (Platform.OS === 'web') {
    return '127.0.0.1';
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (hostUri) {
    return hostUri.split(':')[0];
  }

  return '127.0.0.1';
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Geliştirmede yerel Auth emulator (telefon + tarayıcı)
if (__DEV__) {
  const g = globalThis as typeof globalThis & { __bexAuthEmulator?: boolean };
  if (!g.__bexAuthEmulator) {
    const host = getDevHost();
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    g.__bexAuthEmulator = true;
  }
}

export { isAuthEmulatorActive } from './devMode';

export default app;
