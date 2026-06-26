import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { AuthFormData, BexUser, COLLECTIONS } from '../../types';
import {
  buildDevUser,
  isAuthEmulatorActive,
  isFirestorePermissionError,
  resolveEffectiveRole,
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
    'auth/invalid-phone-number': 'Geçersiz telefon numarası.',
    'auth/invalid-verification-code': 'Doğrulama kodu hatalı.',
    'auth/credential-already-in-use': 'Bu telefon başka bir hesaba bağlı.',
    'auth/provider-already-linked': 'Telefon numaran zaten doğrulanmış.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      'Firebase bağlantı hatası. Terminalde "npm run emulators" çalıştırıp tekrar dene.',
  };
  return map[code] ?? `Bilinmeyen hata (${code})`;
}

async function finalizeUserProfile(
  uid: string,
  user: BexUser,
  fallbackEmail?: string | null
): Promise<BexUser> {
  const email = user.email || fallbackEmail || '';
  const role = resolveEffectiveRole(email, user.role);
  if (role === user.role) return user;

  const updated: BexUser = { ...user, role, email: email || user.email };
  await setDevProfile(uid, { role, email: updated.email });

  if (__DEV__) {
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, uid), { role, email: updated.email }, { merge: true });
    } catch {
      // Emulator / izin — yerel profil yeterli
    }
  }

  return updated;
}

export const authService = {
  async register(data: AuthFormData): Promise<void> {
    const { email, password, displayName, role = 'user' } = data;
    const effectiveRole = resolveEffectiveRole(email, role);

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
      portfolioItems: [],
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

  async updateDisplayName(uid: string, displayName: string): Promise<BexUser | null> {
    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      throw Object.assign(new Error('Ad en az 2 karakter olmalı.'), { code: 'invalid-name' });
    }

    const user = auth.currentUser;
    if (!user || user.uid !== uid) {
      throw Object.assign(new Error('Oturum bulunamadı.'), { code: 'not-authenticated' });
    }

    await updateProfile(user, { displayName: trimmed });
    await setDevProfile(uid, { displayName: trimmed });

    if (!shouldUseDemoData()) {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, uid), { displayName: trimmed });
      } catch {
        // Yerel profil yeterli
      }
    }

    return this.getUserDocument(uid, { email: user.email, displayName: trimmed });
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
            email: data.email || fallback?.email || '',
            isBanned: data.isBanned,
          });
          return finalizeUserProfile(uid, data, fallback?.email);
        }
      } catch (err) {
        if (!isFirestorePermissionError(err)) throw err;
      }
    }

    if (shouldUseDemoData()) {
      const profile = getDevProfile(uid);
      if (profile?.role) {
        return finalizeUserProfile(
          uid,
          buildDevUser(uid, fallback?.email, fallback?.displayName),
          fallback?.email
        );
      }

      // Eski kayıtlar: Firestore'da rol varsa yerel profile yaz
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
        if (snap.exists()) {
          const data = snap.data() as BexUser;
          await setDevProfile(uid, {
            role: data.role,
            displayName: data.displayName,
            email: data.email || fallback?.email || '',
            isBanned: data.isBanned,
          });
          return finalizeUserProfile(uid, data, fallback?.email);
        }
      } catch {
        // Emulator + prod Firestore uyumsuzluğu — yerel profile'a düş
      }

      return finalizeUserProfile(
        uid,
        buildDevUser(uid, fallback?.email, fallback?.displayName),
        fallback?.email
      );
    }

    try {
      const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      if (!snap.exists()) return null;
      const data = snap.data() as BexUser;
      return finalizeUserProfile(uid, data, fallback?.email);
    } catch (err) {
      if (isFirestorePermissionError(err) && fallback) {
        return finalizeUserProfile(
          uid,
          buildDevUser(uid, fallback.email, fallback.displayName),
          fallback.email
        );
      }
      return null;
    }
  },
};
