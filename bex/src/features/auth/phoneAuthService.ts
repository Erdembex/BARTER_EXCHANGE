import { Platform } from 'react-native';
import {
  ApplicationVerifier,
  PhoneAuthProvider,
  RecaptchaVerifier,
  linkWithCredential,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { auth, getAuthEmulatorHost } from '@/lib/firebase';
import { isAuthEmulatorActive, shouldUseDemoData } from '@/lib/devMode';
import { setDevProfile } from '@/lib/devProfileStore';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import {
  sendRestPhoneCode,
  verifyRestPhoneCode,
  clearPendingRestPhone,
  getPendingRestPhone,
} from './phoneAuthApi';
import { authService } from './authService';

const PROJECT_ID = 'bexcursor';

let pendingSessionInfo: string | null = null;
let pendingDevCode: string | null = null;
let webRecaptchaVerifier: RecaptchaVerifier | null = null;

type EmulatorVerificationEntry = {
  phoneNumber?: string;
  sessionInfo?: string;
  code?: string;
  sessionCode?: string;
};

function createDevAppVerifier(): ApplicationVerifier {
  return {
    type: 'recaptcha',
    verify: () => Promise.resolve('dev-recaptcha-token'),
  };
}

function getAppVerifier(): ApplicationVerifier {
  if (Platform.OS === 'web' && auth) {
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

function getEmulatorBaseUrl(): string {
  return `http://${getAuthEmulatorHost()}:9099`;
}

function extractErrorCode(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { code?: string; message?: string };
    if (e.code) return e.code;
    if (e.message) return e.message;
  }
  return 'unknown';
}

async function sendEmulatorVerificationCode(
  phoneNumber: string
): Promise<{ sessionInfo: string; devCode?: string }> {
  const base = getEmulatorBaseUrl();

  const sendRes = await fetch(
    `${base}/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        recaptchaToken: 'fake-recaptcha-token',
      }),
    }
  );

  if (!sendRes.ok) {
    const payload = await sendRes.json().catch(() => null);
    const message =
      payload?.error?.message ??
      `Emulator SMS isteği başarısız (${sendRes.status}). npm run emulators çalışıyor mu?`;
    throw Object.assign(new Error(message), { code: payload?.error?.message ?? 'auth/network-request-failed' });
  }

  const sendData = (await sendRes.json()) as { sessionInfo?: string };
  if (!sendData.sessionInfo) {
    throw Object.assign(new Error('Emulator sessionInfo dönmedi.'), {
      code: 'auth/emulator-session-missing',
    });
  }

  let devCode: string | undefined;
  try {
    const codesRes = await fetch(
      `${base}/emulator/v1/projects/${PROJECT_ID}/verificationCodes`
    );
    if (codesRes.ok) {
      const codesData = (await codesRes.json()) as {
        verificationCodes?: EmulatorVerificationEntry[];
      };
      const match = codesData.verificationCodes?.find(
        (entry) =>
          entry.sessionInfo === sendData.sessionInfo || entry.phoneNumber === phoneNumber
      );
      devCode = match?.code ?? match?.sessionCode;
    }
  } catch {
    // Kod alınamazsa Emulator UI'dan bakılabilir
  }

  return { sessionInfo: sendData.sessionInfo, devCode };
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
    'auth/network-request-failed':
      'Auth emulator\'a bağlanılamadı. cd bex && npm run emulators çalıştır.',
    'auth/emulator-session-missing': 'Emulator yanıt vermedi. Emulators yeniden başlat.',
    'invalid-phone': 'Geçerli bir Türkiye cep numarası gir (+90 5XX).',
    'not-authenticated': 'Oturum bulunamadı. Tekrar giriş yap.',
    'no-pending-verification': 'Önce doğrulama kodu gönder.',
    unknown: 'Beklenmeyen hata. Emulator açık mı kontrol et.',
  };
  return map[code] ?? `Telefon doğrulama hatası (${code})`;
}

export function getLastDevVerificationCode(): string | null {
  return pendingDevCode;
}

export async function sendPhoneVerificationCode(phoneInput: string): Promise<string> {
  if (!validateTurkishPhone(phoneInput)) {
    throw Object.assign(new Error('invalid-phone'), { code: 'invalid-phone' });
  }

  const phoneNumber = formatTurkishPhone(phoneInput);

  if (!shouldUseDemoData() && !isAuthEmulatorActive()) {
    if (!(await hasRestAuthSession())) {
      throw Object.assign(new Error('not-authenticated'), { code: 'not-authenticated' });
    }
    const devCode = await sendRestPhoneCode(phoneNumber);
    pendingDevCode = devCode;
    return phoneNumber;
  }

  if (!auth) {
    throw Object.assign(new Error('not-authenticated'), { code: 'not-authenticated' });
  }

  const user = auth.currentUser;
  if (!user) {
    throw Object.assign(new Error('not-authenticated'), { code: 'not-authenticated' });
  }

  pendingSessionInfo = null;
  pendingDevCode = null;

  if (isAuthEmulatorActive()) {
    const { sessionInfo, devCode } = await sendEmulatorVerificationCode(phoneNumber);
    pendingSessionInfo = sessionInfo;
    pendingDevCode = devCode ?? null;
    return phoneNumber;
  }

  const confirmation = await signInWithPhoneNumber(auth, phoneNumber, getAppVerifier());
  pendingSessionInfo = confirmation.verificationId;
  return phoneNumber;
}

export async function verifyPhoneCode(code: string, phoneInput: string): Promise<void> {
  const phone = formatTurkishPhone(phoneInput);

  if (!shouldUseDemoData() && !isAuthEmulatorActive()) {
    if (!(await hasRestAuthSession())) {
      throw Object.assign(new Error('not-authenticated'), { code: 'not-authenticated' });
    }
    if (!getPendingRestPhone()) {
      throw Object.assign(new Error('no-pending-verification'), {
        code: 'no-pending-verification',
      });
    }
    await verifyRestPhoneCode(phone, code.trim());
    await authService.refreshProfile();
    return;
  }

  if (!auth) {
    throw Object.assign(new Error('not-authenticated'), { code: 'not-authenticated' });
  }

  if (!pendingSessionInfo) {
    throw Object.assign(new Error('no-pending-verification'), {
      code: 'no-pending-verification',
    });
  }

  const user = auth.currentUser;
  if (!user) {
    throw Object.assign(new Error('not-authenticated'), { code: 'not-authenticated' });
  }

  const credential = PhoneAuthProvider.credential(pendingSessionInfo, code);
  await linkWithCredential(user, credential);
  pendingSessionInfo = null;
  pendingDevCode = null;

  await setDevProfile(user.uid, { phone, phoneVerified: true });
}

export function clearPendingPhoneVerification() {
  pendingSessionInfo = null;
  pendingDevCode = null;
  clearPendingRestPhone();
}

export async function isPhoneAuthSupported(): Promise<boolean> {
  if (shouldUseDemoData()) {
    return isAuthEmulatorActive() || Platform.OS === 'web';
  }
  return hasRestAuthSession();
}

export { extractErrorCode as getPhoneAuthErrorCode };
