import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secureStorage';

const EMAIL_KEY = 'bex_saved_email';
const PASSWORD_KEY = 'bex_saved_password';
const REMEMBER_KEY = 'bex_remember_me';

export interface SavedCredentials {
  email: string;
  password: string;
  remember: boolean;
}

export async function loadSavedCredentials(): Promise<SavedCredentials | null> {
  try {
    const remember = await getSecureItem(REMEMBER_KEY);
    if (remember !== 'true') return null;

    const email = await getSecureItem(EMAIL_KEY);
    const password = await getSecureItem(PASSWORD_KEY);
    if (!email) return null;

    return {
      email,
      password: password ?? '',
      remember: true,
    };
  } catch {
    return null;
  }
}

export async function saveCredentials(email: string, password: string) {
  await setSecureItem(REMEMBER_KEY, 'true');
  await setSecureItem(EMAIL_KEY, email.trim());
  await setSecureItem(PASSWORD_KEY, password);
}

export async function clearSavedCredentials() {
  await deleteSecureItem(REMEMBER_KEY);
  await deleteSecureItem(EMAIL_KEY);
  await deleteSecureItem(PASSWORD_KEY);
}
