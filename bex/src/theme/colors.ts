export const Colors = {
  // Kurumsal marka — güvenilir mavi & altın
  primary: '#1A4D8C',
  primaryLight: 'rgba(26, 77, 140, 0.08)',
  primaryDark: '#153E70',
  secondary: '#2563EB',
  accent: '#C9A227',
  accentLight: 'rgba(201, 162, 39, 0.12)',
  accentDark: '#A8841E',

  // Arka planlar
  background: '#FFFFFF',
  surface: '#F5F7FA',
  surfaceSecondary: '#EEF1F6',
  card: '#FFFFFF',

  // Metin
  text: '#0F172A',
  textPrimary: '#0F172A',
  textMuted: '#94A3B8',
  textSecondary: '#64748B',
  textTertiary: '#CBD5E1',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Sınır — net çizgiler
  border: '#E2E8F0',
  borderLight: '#EEF1F6',
  borderFocus: '#1A4D8C',

  // Durum
  success: '#059669',
  successLight: 'rgba(5, 150, 105, 0.08)',
  error: '#DC2626',
  errorLight: 'rgba(220, 38, 38, 0.08)',
  warning: '#D97706',
  warningLight: 'rgba(217, 119, 6, 0.08)',
  info: '#1A4D8C',
  infoLight: 'rgba(26, 77, 140, 0.08)',

  // Zorluk seviyeleri
  difficultyEasy: '#059669',
  difficultyMedium: '#D97706',
  difficultyHard: '#DC2626',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.45)',
  overlayLight: 'rgba(26, 77, 140, 0.04)',

  transparent: 'transparent',
  white: '#FFFFFF',

  // Vurgu gradyanları (hafif)
  gradientBlue: '#1A4D8C',
  gradientGold: '#C9A227',
  gradientMid: '#3B6FA8',
} as const;

export type ColorKey = keyof typeof Colors;
