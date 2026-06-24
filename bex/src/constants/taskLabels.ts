import { TaskCategory, TaskDifficulty, ApplicationStatus } from '../types';

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

export const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Beklemede',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  submitted: 'Teslim Edildi',
  rewarded: 'Ödül Kazanıldı',
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
