import { useMemo } from 'react';
import { BusinessCategory } from '../types';
import { useTranslation } from '@/i18n';

/** @deprecated Yerine useBusinessCategoryLabels kullan */
export const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  food: 'Yeme-İçme',
  beauty: 'Güzellik',
  fitness: 'Spor & Fitness',
  education: 'Eğitim',
  retail: 'Perakende',
  services: 'Hizmet',
  entertainment: 'Eğlence',
  other: 'Diğer',
};

export const BUSINESS_CATEGORY_ICONS: Record<BusinessCategory, string> = {
  food: '☕',
  beauty: '💇',
  fitness: '🏋️',
  education: '📚',
  retail: '🛍️',
  services: '🔧',
  entertainment: '🎭',
  other: '📌',
};

export const ALL_BUSINESS_CATEGORIES: BusinessCategory[] = [
  'food',
  'beauty',
  'fitness',
  'education',
  'retail',
  'services',
  'entertainment',
  'other',
];

/** @deprecated Yerine useVerificationStatusLabels kullan */
export const VERIFICATION_STATUS_LABELS = {
  none: 'Doğrulanmadı',
  pending: 'İncelemede',
  verified: 'Doğrulandı',
  rejected: 'Reddedildi',
} as const;

export function useBusinessCategoryLabels(): Record<BusinessCategory, string> {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      food: t('businessCategory.food'),
      beauty: t('businessCategory.beauty'),
      fitness: t('businessCategory.fitness'),
      education: t('businessCategory.education'),
      retail: t('businessCategory.retail'),
      services: t('businessCategory.services'),
      entertainment: t('businessCategory.entertainment'),
      other: t('businessCategory.other'),
    }),
    [t]
  );
}

export function useVerificationStatusLabels() {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      none: t('verificationStatus.none'),
      pending: t('verificationStatus.pending'),
      verified: t('verificationStatus.verified'),
      rejected: t('verificationStatus.rejected'),
    }),
    [t]
  );
}
