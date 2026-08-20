export const Colors = {
  // Passla — yumuşak mor & altın (parlak değil)
  primary: '#D4B86A',
  primaryLight: 'rgba(212, 184, 106, 0.14)',
  primaryDark: '#B89A52',
  secondary: '#9B7EC8',
  accent: '#B794F6',
  accentLight: 'rgba(183, 148, 246, 0.14)',
  accentDark: '#8B6CB8',

  moneyGreen: '#6BBF8A',
  moneyGreenDark: '#4A9968',
  moneyGreenLight: 'rgba(107, 191, 138, 0.14)',

  business: '#9B7EC8',
  businessLight: 'rgba(155, 126, 200, 0.16)',
  businessDark: '#7A5FA8',

  background: '#18122B',
  surface: '#211835',
  surfaceSecondary: '#2A2040',
  card: '#322848',

  text: '#F3EEF8',
  textPrimary: '#F3EEF8',
  textMuted: '#A898C0',
  textSecondary: '#C9BBDA',
  textTertiary: '#8A7A9E',
  textInverse: '#FFFFFF',
  textOnPrimary: '#2A2438',
  textOnGold: '#2A2438',

  border: '#463A5C',
  borderLight: '#352A4A',
  borderFocus: '#D4B86A',
  borderGold: 'rgba(212, 184, 106, 0.4)',

  success: '#6BBF8A',
  successLight: 'rgba(107, 191, 138, 0.14)',
  error: '#E8929A',
  errorLight: 'rgba(232, 146, 154, 0.14)',
  warning: '#D4A574',
  warningLight: 'rgba(212, 165, 116, 0.14)',
  info: '#B794F6',
  infoLight: 'rgba(183, 148, 246, 0.14)',

  difficultyEasy: '#6BBF8A',
  difficultyMedium: '#D4B86A',
  difficultyHard: '#E8929A',

  overlay: 'rgba(24, 18, 43, 0.78)',
  overlayLight: 'rgba(183, 148, 246, 0.08)',

  transparent: 'transparent',
  white: '#FFFFFF',

  gradientBlue: '#5B4A8A',
  gradientGold: '#D4B86A',
  gradientMid: '#2A2040',
} as const;

export type ColorKey = keyof typeof Colors;
