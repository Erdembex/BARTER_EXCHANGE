import type { ColorKey } from './colors';

/** Açık mod — yüksek kontrast, okunabilir metin */
export const LightColors: Record<ColorKey, string> = {
  primary: '#A6883F',
  primaryLight: 'rgba(166, 136, 63, 0.12)',
  primaryDark: '#7A6228',
  secondary: '#6B5094',
  accent: '#7358A0',
  accentLight: 'rgba(115, 88, 160, 0.1)',
  accentDark: '#553F78',

  moneyGreen: '#2F7A4F',
  moneyGreenDark: '#1F5738',
  moneyGreenLight: 'rgba(47, 122, 79, 0.1)',

  business: '#6B5094',
  businessLight: 'rgba(107, 80, 148, 0.1)',
  businessDark: '#553F78',

  background: '#F5F0FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#EBE3F5',
  card: '#FFFFFF',

  text: '#1A1224',
  textPrimary: '#1A1224',
  textMuted: '#5C5068',
  textSecondary: '#3D3349',
  textTertiary: '#6E627E',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',
  textOnGold: '#1A1224',

  border: '#CFC3DE',
  borderLight: '#E2DAED',
  borderFocus: '#A6883F',
  borderGold: 'rgba(166, 136, 63, 0.45)',

  success: '#2F7A4F',
  successLight: 'rgba(47, 122, 79, 0.1)',
  error: '#B53A45',
  errorLight: 'rgba(181, 58, 69, 0.08)',
  warning: '#9A6B1F',
  warningLight: 'rgba(154, 107, 31, 0.1)',
  info: '#6B5094',
  infoLight: 'rgba(107, 80, 148, 0.08)',

  difficultyEasy: '#2F7A4F',
  difficultyMedium: '#9A6B1F',
  difficultyHard: '#B53A45',

  overlay: 'rgba(26, 18, 36, 0.45)',
  overlayLight: 'rgba(107, 80, 148, 0.06)',

  transparent: 'transparent',
  white: '#FFFFFF',

  gradientBlue: '#5A4678',
  gradientGold: '#A6883F',
  gradientMid: '#7358A0',
};
