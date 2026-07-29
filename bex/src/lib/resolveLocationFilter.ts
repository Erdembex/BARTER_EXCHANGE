import { BexUser } from '@/types';
import { loadLocationFilter } from './locationFilterStorage';
import { LOCATION_ALL } from './locationFilterUtils';

export type ResolvedLocationFilter = {
  city: string | null;
  district: string | null;
  source: 'saved' | 'profile' | 'none';
};

/** Görevler sekmesi ile aynı öncelik: kayıtlı filtre → profil konumu */
export async function resolveLocationFilter(
  bexUser: BexUser | null
): Promise<ResolvedLocationFilter> {
  const saved = await loadLocationFilter();
  if (saved) {
    return {
      city: saved.city,
      district: saved.district,
      source: 'saved',
    };
  }

  if (bexUser?.city) {
    return {
      city: bexUser.city,
      district: LOCATION_ALL,
      source: 'profile',
    };
  }

  return { city: null, district: null, source: 'none' };
}
