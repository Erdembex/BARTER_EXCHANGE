import { useCallback, useMemo } from 'react';
import { useLocaleStore, type AppLocale } from '@/store/localeStore';
import { tr, type TranslationSchema } from './tr';
import { en } from './en';

export type { AppLocale };

const dictionaries: Record<AppLocale, TranslationSchema> = {
  tr,
  en,
};

export type TranslationParams = Record<string, string | number>;

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);

  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    template
  );
}

export function translate(
  locale: AppLocale,
  key: string,
  params?: TranslationParams
): string {
  const dict = dictionaries[locale] as unknown as Record<string, unknown>;
  const value = getNestedValue(dict, key);
  if (value === undefined) {
    return key;
  }
  return interpolate(value, params);
}

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: string, params?: TranslationParams) => translate(locale, key, params),
    [locale]
  );

  return useMemo(() => ({ t, locale }), [t, locale]);
}

export function useAppLocale(): AppLocale {
  return useLocaleStore((s) => s.locale);
}

/**
 * Translate outside of React components (repositories, services, notification builders).
 * Reads the current locale directly from the store snapshot.
 */
export function t(key: string, params?: TranslationParams): string {
  const locale = useLocaleStore.getState().locale;
  return translate(locale, key, params);
}

/** Current locale outside of React components, e.g. for Date/Intl formatting. */
export function getLocale(): AppLocale {
  return useLocaleStore.getState().locale;
}

export { tr, en };
