import { useMemo } from 'react';
import { TaskCategory, TaskDifficulty, ApplicationStatus } from '../types';
import { useTranslation } from '@/i18n';

/** @deprecated Yerine useCategoryLabels kullan */
export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  design: 'Tasarım',
  development: 'Yazılım',
  marketing: 'Pazarlama',
  content: 'İçerik',
  photography: 'Fotoğraf',
  video: 'Video',
  translation: 'Çeviri',
  consulting: 'Danışmanlık',
  other: 'Diğer',
};

export const CATEGORY_ICONS: Record<TaskCategory, string> = {
  design: '🎨',
  development: '💻',
  marketing: '📣',
  content: '✍️',
  photography: '📷',
  video: '🎬',
  translation: '🌐',
  consulting: '💡',
  other: '📌',
};

/** @deprecated Yerine useDifficultyLabels kullan */
export const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

/** @deprecated Yerine useApplicationStatusLabels kullan */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Beklemede',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  submitted: 'Teslim Edildi',
  submission_approved: 'Admin Onayladı',
  rewarded: 'Ödül Kazanıldı',
  cancelled: 'İptal Edildi',
};

export const ALL_CATEGORIES: TaskCategory[] = [
  'design',
  'development',
  'marketing',
  'content',
  'photography',
  'video',
  'translation',
  'consulting',
  'other',
];

export function useCategoryLabels(): Record<TaskCategory, string> {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      design: t('task.category.design'),
      development: t('task.category.development'),
      marketing: t('task.category.marketing'),
      content: t('task.category.content'),
      photography: t('task.category.photography'),
      video: t('task.category.video'),
      translation: t('task.category.translation'),
      consulting: t('task.category.consulting'),
      other: t('task.category.other'),
    }),
    [t]
  );
}

export function useDifficultyLabels(): Record<TaskDifficulty, string> {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      easy: t('task.difficulty.easy'),
      medium: t('task.difficulty.medium'),
      hard: t('task.difficulty.hard'),
    }),
    [t]
  );
}

export function useApplicationStatusLabels(): Record<ApplicationStatus, string> {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      pending: t('task.applicationStatus.pending'),
      approved: t('task.applicationStatus.approved'),
      rejected: t('task.applicationStatus.rejected'),
      submitted: t('task.applicationStatus.submitted'),
      submission_approved: t('task.applicationStatus.submission_approved'),
      rewarded: t('task.applicationStatus.rewarded'),
      cancelled: t('task.applicationStatus.cancelled'),
    }),
    [t]
  );
}
