import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { AuthFormData, BexUser, COLLECTIONS } from '../../types';
import {
  buildDevUser,
  isAuthEmulatorActive,
  isFirestorePermissionError,
  shouldUseDemoData,
} from '../../lib/devMode';
import { setDevProfile, loadDevProfiles, getDevProfile } from '../../lib/devProfileStore';

// Firebase Auth hata kodlarını okunabilir Türkçe mesajlara çevirir
export function getAuthErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter olmalı.',
    'auth/operation-not-allowed':
      'E-posta/şifre girişi Firebase Console\'da etkinleştirilmemiş.\n' +
      'Authentication → Sign-in method → Email/Password → Enable.',
    'auth/user-not-found': 'Bu e-posta ile kayıtlı hesap bulunamadı.',
    'auth/wrong-password': 'Şifre hatalı.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/too-many-requests': 'Çok fazla başarısız deneme. Lütfen bekleyin.',
    'auth/network-request-failed': isAuthEmulatorActive()
      ? 'Auth emulator\'a bağlanılamadı.\n\n1. Yeni terminal: cd bex && npm run emulators\n2. Emulator açıkken uygulamayı yenile\n3. Android emülatör kullanıyorsan bilgisayarda 9099 portunun açık olduğundan emin ol'
      : 'Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.',
    'auth/user-disabled': 'Bu hesap askıya alınmış.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      'Firebase bağlantı hatası. Terminalde "npm run emulators" çalıştırıp tekrar dene.',
  };
  return map[code] ?? `Bilinmeyen hata (${code})`;
}

export const authService = {
  async register(data: AuthFormData): Promise<void> {
    const { email, password, displayName, role = 'user' } = data;
    const effectiveRole =
      __DEV__ && email.trim().toLowerCase() === 'admin@bex.dev' ? 'admin' : role;

    let credential;
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('[authService.register] Firebase hata kodu:', err?.code);
      console.error('[authService.register] Firebase hata mesajı:', err?.message);
      throw err;
    }

    const { user } = credential;

    await updateProfile(user, { displayName: displayName ?? '' });

    // Rol her zaman yerelde saklanır (emulator yeniden başlatınca kaybolmasın)
    await setDevProfile(user.uid, {
      role: effectiveRole,
      displayName: displayName ?? '',
      email,
    });

    const bexUser: Omit<BexUser, 'joinedAt'> & { joinedAt: ReturnType<typeof serverTimestamp> } = {
      uid: user.uid,
      role: effectiveRole,
      displayName: displayName ?? '',
      email,
      phone: '',
      phoneVerified: false,
      avatarUrl: '',
      reputationScore: 0,
      completedTaskCount: 0,
      joinedAt: serverTimestamp() as any,
      isBanned: false,
    };

    try {
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), bexUser);
    } catch (firestoreErr) {
      if (__DEV__) {
        console.warn('[authService.register] Firestore yazılamadı (emulator modu):', firestoreErr);
      } else {
        throw firestoreErr;
      }
    }
  },

  async login(email: string, password: string) {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('[authService.login] Firebase hata kodu:', err?.code);
      console.error('[authService.login] Firebase hata mesajı:', err?.message);
      throw err;
    }
  },

  async logout() {
    return firebaseSignOut(auth);
  },

  async resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  },

  async getUserDocument(
    uid: string,
    fallback?: { email?: string | null; displayName?: string | null }
  ): Promise<BexUser | null> {
    await loadDevProfiles();

    if (!shouldUseDemoData()) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
        if (snap.exists()) {
          const data = snap.data() as BexUser;
          await setDevProfile(uid, {
            role: data.role,
            displayName: data.displayName,
            email: data.email,
          });
          return data;
        }
      } catch (err) {
        if (!isFirestorePermissionError(err)) throw err;
      }
    }

    if (shouldUseDemoData()) {
      const profile = getDevProfile(uid);
      if (profile?.role) {
        return buildDevUser(uid, fallback?.email, fallback?.displayName);
      }

      // Eski kayıtlar: Firestore'da rol varsa yerel profile yaz
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
        if (snap.exists()) {
          const data = snap.data() as BexUser;
          await setDevProfile(uid, {
            role: data.role,
            displayName: data.displayName,
            email: data.email,
          });
          return data;
        }
      } catch {
        // Emulator + prod Firestore uyumsuzluğu — yerel profile'a düş
      }

      return buildDevUser(uid, fallback?.email, fallback?.displayName);
    }

    try {
      const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      return snap.exists() ? (snap.data() as BexUser) : null;
    } catch (err) {
      if (isFirestorePermissionError(err) && fallback) {
        return buildDevUser(uid, fallback.email, fallback.displayName);
      }
      return null;
    }
  },
};
