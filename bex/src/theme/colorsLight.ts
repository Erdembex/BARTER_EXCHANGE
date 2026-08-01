import type { ColorKey } from './colors';

/**
 * Açık mod paleti. Anahtarlar `colors.ts` (koyu mod) ile birebir aynı olmalı —
 * `Record<ColorKey, string>` bunu derleme zamanında garanti eder.
 */
export const LightColors: Record<ColorKey, string> = {
  // Marka — altın & para yeşili (marka kimliği her iki modda da sabit kalır)
  primary: '#EAB308',
  primaryLight: 'rgba(234, 179, 8, 0.14)',
  primaryDark: '#C8940A',
  secondary: '#052E16',
  accent: '#B8860B',
  accentLight: 'rgba(184, 134, 11, 0.12)',
  accentDark: '#8A6508',

  moneyGreen: '#16A34A',
  moneyGreenDark: '#15803D',
  moneyGreenLight: 'rgba(22, 163, 74, 0.14)',

  // İşletme tarafı — kurumsal ikincil kimlik rengi
  business: '#0F766E',
  businessLight: 'rgba(15, 118, 110, 0.12)',
  businessDark: '#0B5C56',

  // Açık, sıcak zemin — net yüzey hiyerarşisi
  background: '#F7F7F2',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF0E7',
  card: '#FFFFFF',

  // Koyu yeşilimsi metin — açık zeminde yüksek okunabilirlik
  text: '#142016',
  textPrimary: '#142016',
  textMuted: '#6B7A6D',
  textSecondary: '#3F4C41',
  textTertiary: '#8B978C',
  textInverse: '#FFFFFF',
  textOnPrimary: '#1B1608',
  textOnGold: '#1B1608',

  // Sınır
  border: '#E1E4DA',
  borderLight: '#ECEFE5',
  borderFocus: '#EAB308',
  borderGold: 'rgba(234, 179, 8, 0.45)',

  // Durum
  success: '#16A34A',
  successLight: 'rgba(22, 163, 74, 0.12)',
  error: '#DC2626',
  errorLight: 'rgba(220, 38, 38, 0.10)',
  warning: '#D97706',
  warningLight: 'rgba(217, 119, 6, 0.12)',
  info: '#0284C7',
  infoLight: 'rgba(2, 132, 199, 0.10)',

  // Zorluk seviyeleri
  difficultyEasy: '#16A34A',
  difficultyMedium: '#D97706',
  difficultyHard: '#DC2626',

  // Overlay
  overlay: 'rgba(20, 32, 22, 0.55)',
  overlayLight: 'rgba(234, 179, 8, 0.08)',

  transparent: 'transparent',
  white: '#FFFFFF',

  // Hero gradyanları — koyu yeşilden açık zemine yumuşak geçiş
  gradientBlue: '#14532D',
  gradientGold: '#EAB308',
  gradientMid: '#3F5B45',
};
