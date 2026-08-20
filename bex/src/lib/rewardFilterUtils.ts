/** Ödül filtreleme — backend RewardType + arama terimleri */
export type RewardFilterPreset = 'gym' | 'coffee' | 'haircut' | 'discount' | 'product';

export const REWARD_PRESET_TYPES: Record<RewardFilterPreset, string> = {
  gym: 'GYM_MEMBERSHIP',
  coffee: 'COFFEE',
  haircut: 'CUSTOM',
  discount: 'DISCOUNT',
  product: 'PRODUCT',
};

export const REWARD_PRESET_QUERIES: Record<RewardFilterPreset, string> = {
  gym: 'spor salonu',
  coffee: 'kahve',
  haircut: 'saç',
  discount: 'indirim',
  product: 'ürün',
};

export function resolveRewardFilter(preset: RewardFilterPreset | null, customQuery: string): {
  q?: string;
  rewardType?: string;
} {
  if (preset) {
    const type = REWARD_PRESET_TYPES[preset];
    const q = REWARD_PRESET_QUERIES[preset];
    return preset === 'haircut'
      ? { q, rewardType: undefined }
      : { q: undefined, rewardType: type };
  }
  const trimmed = customQuery.trim();
  if (!trimmed) return {};
  return { q: trimmed };
}
