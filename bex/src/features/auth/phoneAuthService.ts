import { Platform } from 'react-native';
import {
  ApplicationVerifier,
  ConfirmationResult,
  PhoneAuthProvider,
  RecaptchaVerifier,
  linkWithCredential,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { isAuthEmulatorActive, shouldUseDemoData } from '@/lib/devMode';
import { setDevProfile } from '@/lib/devProfileStore';
import { COLLECTIONS } from '@/types';

let pendingConfirmation: ConfirmationResult | null = null;
let webRecaptchaVerifier: RecaptchaVerifier | null = null;

function createDevAppVerifier(): ApplicationVerifier {
  return {
    type: 'recaptcha',
    verify: () => Promise.resolve('dev-recaptcha-token'),
  };
}

function getAppVerifier(): ApplicationVerifier {
  if (isAuthEmulatorActive()) {
    return createDevAppVerifier();
  }

  if (Platform.OS === 'web') {
    if (!webRecaptchaVerifier) {
      webRecaptchaVerifier = new RecaptchaVerifier(auth, 'bex-recaptcha', {
        size: 'invisible',
      });
    }
    return webRecaptchaVerifier;
  }

  throw Object.assign(new Error('Telefon doğrulama Expo Go\'da yalnızca emulator ile çalışır.'), {
    code: 'auth/phone-auth-unavailable',
  });
}

export function formatTurkishPhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('90')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return `+90${digits}`;
}

export function validateTurkishPhone(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  const normalized = digits.startsWith('90')
    ? digits.slice(2)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  return /^5[0-9]{9}$/.test(normalized);
}

export function getPhoneAuthErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-phone-number': 'Geçersiz telefon numarası.',
    'auth/too-many-requests': 'Çok fazla deneme. Lütfen bir süre bekleyin.',
    'auth/invalid-verification-code': 'Doğrulama kodu hatalı.',
    'auth/code-expired': 'Kodun süresi doldu. Yeni kod isteyin.',
    'auth/credential-already-in-use': 'Bu numara başka bir hesaba bağlı.',
    'auth/phone-auth-unavailable':
      'Telefon doğrulama şu an kullanılamıyor. Emulator çalıştır veya şimdilik atla.',
    'auth/provider-already-linked': 'Telefon numaran zaten doğrulanmış.',
    'invalid-phone': 'Geçerli bir Türkiye cep numarası gir (+90 5XX).',
    'not-authenticated': 'Oturum bulunamadı. Tekrar giriş yap.',
    'no-pending-verification': 'Önce doğrulama kodu gönder.',
  };
  return map[code] ?? `Telefon doğrulama hatası (${code})`;
}

export async function sendPhoneVerificationCode(phoneInput: string): Promise<string> {
  if (!validateTurkishPhone(phoneInput)) {
    throw Object.assign(new Error('invalid-phone'), { code: 'invalid-phone' });
  }

  const user = auth.currentUser;
  if (!user) {
    throw Object.assign(new Error('not-authenticated'), { code: 'not-authenticated' });
  }

  const phoneNumber = formatTurkishPhone(phoneInput);
  const confirmation = await signInWithPhoneNumber(auth, phoneNumber, getAppVerifier());
  pendingConfirmation = confirmation;
  return phoneNumber;
}

export async function verifyPhoneCode(code: string, phoneInput: string): Promise<void> {
  if (!pendingConfirmation) {
    throw Object.assign(new Error('no-pending-verification'), {
      code: 'no-pending-verification',
    });
  }

  const user = auth.currentUser;
  if (!user) {
    throw Object.assign(new Error('not-authenticated'), { code: 'not-authenticated' });
  }

  const credential = PhoneAuthProvider.credential(pendingConfirmation.verificationId, code);
  await linkWithCredential(user, credential);
  pendingConfirmation = null;

  const phone = formatTurkishPhone(phoneInput);
  await setDevProfile(user.uid, { phone, phoneVerified: true });

  if (!shouldUseDemoData()) {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        phone,
        phoneVerified: true,
      });
    } catch {
      // Emulator / izin hatasında yerel profil yeterli
    }
  }
}

export function clearPendingPhoneVerification() {
  pendingConfirmation = null;
}

export function isPhoneAuthSupported(): boolean {
  return isAuthEmulatorActive() || Platform.OS === 'web';
}
