import { Colors } from '@/theme';

export type CouponVisual = {
  emoji: string;
  label: string;
  accent: string;
  stripe: string;
};

const DEFAULT: CouponVisual = {
  emoji: '🎟',
  label: 'Kupon',
  accent: Colors.primary,
  stripe: Colors.accent,
};

const KEYWORDS: { match: RegExp; visual: CouponVisual }[] = [
  {
    match: /saç|tıraş|kuaf|berber|hair|cut/i,
    visual: { emoji: '✂', label: 'Kuaför', accent: Colors.primary, stripe: Colors.accent },
  },
  {
    match: /kahve|coffee|latte|espresso/i,
    visual: { emoji: '☕', label: 'Kahve', accent: Colors.primary, stripe: Colors.accent },
  },
  {
    match: /spor|gym|fitness|salon|yoga/i,
    visual: { emoji: '◆', label: 'Spor', accent: Colors.primary, stripe: Colors.accent },
  },
  {
    match: /yemek|restoran|food|pizza|burger/i,
    visual: { emoji: '◈', label: 'Yemek', accent: Colors.primary, stripe: Colors.accent },
  },
  {
    match: /web|yazılım|design|tasarım|site/i,
    visual: { emoji: '◇', label: 'Dijital', accent: Colors.primary, stripe: Colors.accent },
  },
  {
    match: /etkinlik|bilet|konser|sinema/i,
    visual: { emoji: '▣', label: 'Etkinlik', accent: Colors.primary, stripe: Colors.accent },
  },
];

export function getCouponVisual(rewardDescription: string): CouponVisual {
  const text = rewardDescription.trim();
  for (const entry of KEYWORDS) {
    if (entry.match.test(text)) return entry.visual;
  }
  return DEFAULT;
}
