export const Colors = {
  // Gün batımı paleti
  primary: '#B87EA8',       // Alacakaranlık mor
  primaryLight: '#F5DDE4',  // Gül pembesi — yumuşak vurgu
  primaryDark: '#443C5D',   // Gece moru — metin & pressed
  accent: '#FFB26B',        // Gün batımı turuncusu
  accentLight: '#FFE8D1',   // Sıcak şeftali

  // Arka planlar
  background: '#FFF8F4',    // Sıcak krem — gökyüzü son ışık
  surface: '#FDF0EB',
  surfaceSecondary: '#F5E6EE',
  card: '#FFFFFF',

  // Metin
  textPrimary: '#443C5D',
  textSecondary: '#6B6280',
  textTertiary: '#9A92A8',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Sınır
  border: '#E8D4DC',
  borderLight: '#F3E8EE',
  borderFocus: '#B87EA8',

  // Durum renkleri
  success: '#22C55E',
  successLight: '#DCFCE7',
  error: '#E38D9D',
  errorLight: '#FCE8ED',
  warning: '#FFB26B',
  warningLight: '#FFE8D1',
  info: '#B87EA8',
  infoLight: '#F5DDE4',

  // Zorluk seviyeleri
  difficultyEasy: '#22C55E',
  difficultyMedium: '#FFB26B',
  difficultyHard: '#E38D9D',

  // Overlay
  overlay: 'rgba(68, 60, 93, 0.5)',
  overlayLight: 'rgba(184, 126, 168, 0.08)',

  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
