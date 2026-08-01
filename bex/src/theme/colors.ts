export const Colors = {
  // Marka — altın & para yeşili
  primary: '#EAB308',
  primaryLight: 'rgba(234, 179, 8, 0.14)',
  primaryDark: '#C8940A',
  secondary: '#052E16',
  accent: '#FFD700',
  accentLight: 'rgba(255, 215, 0, 0.14)',
  accentDark: '#D4AF37',

  moneyGreen: '#22C55E',
  moneyGreenDark: '#15803D',
  moneyGreenLight: 'rgba(34, 197, 94, 0.16)',

  // İşletme tarafı — kurumsal ikincil kimlik rengi (derin zümrüt-teal)
  business: '#0F766E',
  businessLight: 'rgba(15, 118, 110, 0.16)',
  businessDark: '#0B5C56',

  // Koyu zengin arka plan — daha net yüzey hiyerarşisi
  background: '#0A0F0C',
  surface: '#131A16',
  surfaceSecondary: '#1A2420',
  card: '#1E2A24',

  // Sıcak krem tonları — koyu zeminde yüksek okunabilirlik
  text: '#F5F0E1',
  textPrimary: '#F5F0E1',
  textMuted: '#7E9481',
  textSecondary: '#B7C4B4',
  textTertiary: '#6B806E',
  textInverse: '#FFFFFF',
  textOnPrimary: '#1B1608',
  textOnGold: '#1B1608',

  // Sınır — daha görünür ayraç
  border: '#2A3B32',
  borderLight: '#1F2C26',
  borderFocus: '#EAB308',
  borderGold: 'rgba(234, 179, 8, 0.45)',

  // Durum — info artık primary'den ayrı (bildirim ödül gibi görünmesin)
  success: '#22C55E',
  successLight: 'rgba(34, 197, 94, 0.16)',
  error: '#F87171',
  errorLight: 'rgba(248, 113, 113, 0.14)',
  warning: '#F5A524',
  warningLight: 'rgba(245, 165, 36, 0.14)',
  info: '#38BDF8',
  infoLight: 'rgba(56, 189, 248, 0.14)',

  // Zorluk seviyeleri
  difficultyEasy: '#22C55E',
  difficultyMedium: '#EAB308',
  difficultyHard: '#F87171',

  // Overlay
  overlay: 'rgba(10, 15, 12, 0.78)',
  overlayLight: 'rgba(234, 179, 8, 0.08)',

  transparent: 'transparent',
  white: '#FFFFFF',

  // Hero gradyanları
  gradientBlue: '#052E16',
  gradientGold: '#EAB308',
  gradientMid: '#131A16',
} as const;

export type ColorKey = keyof typeof Colors;
