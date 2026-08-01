import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLocale = 'tr' | 'en';

const STORAGE_KEY = '@bex/locale';

interface LocaleState {
  locale: AppLocale;
  isHydrated: boolean;
  setLocale: (locale: AppLocale) => void;
  hydrate: () => Promise<void>;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'tr',
  isHydrated: false,

  setLocale: (locale) => {
    set({ locale });
    AsyncStorage.setItem(STORAGE_KEY, locale).catch(() => {
      // sessiz — bir sonraki açılışta varsayılana döner
    });
  },

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'tr' || saved === 'en') {
        set({ locale: saved });
      }
    } catch {
      // sessiz — varsayılan Türkçe kalır
    } finally {
      set({ isHydrated: true });
    }
  },
}));
