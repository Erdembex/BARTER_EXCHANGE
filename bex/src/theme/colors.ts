export const Colors = {
  // Marka paleti
  primary: '#7C3AED',
  primaryLight: '#EDE9FE',
  primaryDark: '#6D28D9',
  secondary: '#10B981',
  accent: '#10B981',
  accentLight: '#D1FAE5',

  // Arka planlar
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceSecondary: '#F1F5F9',
  card: '#F8FAFC',

  // Metin
  text: '#0F172A',
  textPrimary: '#0F172A',
  textMuted: '#64748B',
  textSecondary: '#64748B',
  textTertiary: '#64748B',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Sınır
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#7C3AED',

  // Durum renkleri
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#7C3AED',
  infoLight: '#EDE9FE',

  // Zorluk seviyeleri
  difficultyEasy: '#10B981',
  difficultyMedium: '#F59E0B',
  difficultyHard: '#EF4444',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(124, 58, 237, 0.06)',

  transparent: 'transparent',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;
