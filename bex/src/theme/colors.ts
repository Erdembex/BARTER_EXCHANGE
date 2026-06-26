export const Colors = {
  // Monokrom marka — koyu mod, siyah & beyaz
  primary: '#FFFFFF',
  primaryLight: '#1A1A1A',
  primaryDark: '#E5E5E5',
  secondary: '#404040',
  accent: '#FFFFFF',
  accentLight: '#262626',

  // Arka planlar
  background: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#141414',
  card: '#111111',

  // Metin
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textMuted: '#737373',
  textSecondary: '#A3A3A3',
  textTertiary: '#525252',
  textInverse: '#000000',
  textOnPrimary: '#000000',

  // Sınır
  border: '#2A2A2A',
  borderLight: '#1A1A1A',
  borderFocus: '#FFFFFF',

  // Durum — gri tonları (monokrom)
  success: '#E5E5E5',
  successLight: '#1A1A1A',
  error: '#F5F5F5',
  errorLight: '#1A1A1A',
  warning: '#D4D4D4',
  warningLight: '#1A1A1A',
  info: '#FFFFFF',
  infoLight: '#1A1A1A',

  // Zorluk seviyeleri
  difficultyEasy: '#E5E5E5',
  difficultyMedium: '#A3A3A3',
  difficultyHard: '#525252',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(255, 255, 255, 0.06)',

  transparent: 'transparent',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;
