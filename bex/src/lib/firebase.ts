import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage, connectStorageEmulator } from 'firebase/storage';

/** Yalnızca EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true iken Firebase etkin. */
const useFirebaseEmulator =
  __DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

export function getAuthEmulatorHost(): string {
  if (Platform.OS === 'web') {
    return '127.0.0.1';
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return '127.0.0.1';
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'demo.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '0',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'demo',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (useFirebaseEmulator) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  const g = globalThis as typeof globalThis & {
    __bexAuthEmulator?: boolean;
    __bexStorageEmulator?: boolean;
  };

  if (!g.__bexAuthEmulator && auth) {
    const host = getAuthEmulatorHost();
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    auth.settings.appVerificationDisabledForTesting = true;
    g.__bexAuthEmulator = true;

    if (!g.__bexStorageEmulator && storage) {
      connectStorageEmulator(storage, host, 9199);
      g.__bexStorageEmulator = true;
    }
  }
}

export { auth, db, storage, app };
export default app;
export { isAuthEmulatorActive } from './devMode';

export function isFirebaseEnabled(): boolean {
  return useFirebaseEmulator;
}
