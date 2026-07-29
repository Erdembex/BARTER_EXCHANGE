export const Colors = {
  // Marka — siyah & sarı
  primary: '#FACC15',
  primaryLight: 'rgba(250, 204, 21, 0.12)',
  primaryDark: '#EAB308',
  secondary: '#0A0A0A',
  accent: '#FFD700',
  accentLight: 'rgba(255, 215, 0, 0.12)',
  accentDark: '#CA8A04',

  // Dark arka planlar
  background: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#141414',
  card: '#141414',

  // Metin (dark)
  text: '#FAFAFA',
  textPrimary: '#FAFAFA',
  textMuted: '#737373',
  textSecondary: '#A3A3A3',
  textTertiary: '#525252',
  textInverse: '#FFFFFF',
  textOnPrimary: '#0A0A0A',

  // Sınır
  border: '#262626',
  borderLight: '#1A1A1A',
  borderFocus: '#FACC15',

  // Durum
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.12)',
  error: '#F87171',
  errorLight: 'rgba(248, 113, 113, 0.12)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.12)',
  info: '#FACC15',
  infoLight: 'rgba(250, 204, 21, 0.1)',

  // Zorluk seviyeleri
  difficultyEasy: '#34D399',
  difficultyMedium: '#FBBF24',
  difficultyHard: '#F87171',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.72)',
  overlayLight: 'rgba(250, 204, 21, 0.08)',

  transparent: 'transparent',
  white: '#FFFFFF',

  // Hero gradyanları
  gradientBlue: '#0A0A0A',
  gradientGold: '#FACC15',
  gradientMid: '#141414',
} as const;

export type ColorKey = keyof typeof Colors;
