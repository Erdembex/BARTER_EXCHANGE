export const Colors = {
  // Ana renkler
  primary: '#1E035B',       // BEX koyu mor — ana vurgu
  primaryLight: '#DDD6EE',  // Açık mor — arka plan vurgusu
  primaryDark: '#140246',   // Daha koyu mor — pressed state

  // Arka planlar
  background: '#D6D6D6',
  surface: '#CECECE',
  surfaceSecondary: '#C4C4C4',
  card: '#FFFFFF',

  // Metin
  textPrimary: '#1A0A3A',
  textSecondary: '#4A4458',
  textTertiary: '#7A7588',
  textInverse: '#D6D6D6',
  textOnPrimary: '#D6D6D6',

  // Sınır
  border: '#BDBDBD',
  borderLight: '#E8E8E8',
  borderFocus: '#1E035B',

  // Durum renkleri
  success: '#22C55E',
  successLight: '#DCFCE7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Zorluk seviyeleri
  difficultyEasy: '#22C55E',
  difficultyMedium: '#F59E0B',
  difficultyHard: '#EF4444',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.08)',

  // Şeffaf
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
