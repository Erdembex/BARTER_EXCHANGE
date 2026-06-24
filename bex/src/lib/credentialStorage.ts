import * as SecureStore from 'expo-secure-store';

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
    const remember = await SecureStore.getItemAsync(REMEMBER_KEY);
    if (remember !== 'true') return null;

    const email = await SecureStore.getItemAsync(EMAIL_KEY);
    const password = await SecureStore.getItemAsync(PASSWORD_KEY);
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
  await SecureStore.setItemAsync(REMEMBER_KEY, 'true');
  await SecureStore.setItemAsync(EMAIL_KEY, email.trim());
  await SecureStore.setItemAsync(PASSWORD_KEY, password);
}

export async function clearSavedCredentials() {
  await SecureStore.deleteItemAsync(REMEMBER_KEY);
  await SecureStore.deleteItemAsync(EMAIL_KEY);
  await SecureStore.deleteItemAsync(PASSWORD_KEY);
}
