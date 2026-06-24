import { BusinessCategory } from '../types';

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
