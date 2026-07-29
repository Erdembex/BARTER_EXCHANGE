import { formatLocationLabel } from '@/constants/turkeyLocations';

/** Konum filtresinde “tümü” seçeneği */
export const LOCATION_ALL = 'Hepsi';

export function isLocationAll(value: string | null | undefined): boolean {
  return value === LOCATION_ALL;
}

export function toApiCityFilter(city: string | null | undefined): string | undefined {
  if (!city || isLocationAll(city)) return undefined;
  const trimmed = city.trim();
  return trimmed || undefined;
}

export function toApiDistrictFilter(
  city: string | null | undefined,
  district: string | null | undefined
): string | undefined {
  if (!district || isLocationAll(district) || isLocationAll(city)) return undefined;
  const trimmed = district.trim();
  return trimmed || undefined;
}

export function formatFilterLocationLabel(
  city: string | null | undefined,
  district: string | null | undefined
): string {
  if (isLocationAll(city) || (!city && !district)) {
    return 'Tüm Türkiye';
  }
  if (city && (isLocationAll(district) || !district)) {
    return `${city} · Tüm ilçeler`;
  }
  return formatLocationLabel(city, district);
}

export function hasActiveLocationFilter(
  city: string | null | undefined,
  district: string | null | undefined
): boolean {
  return !!(toApiCityFilter(city) || toApiDistrictFilter(city, district));
}
