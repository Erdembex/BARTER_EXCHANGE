/** Türkiye il merkezleri — yaklaşık koordinatlar (harita pini için) */
export const TURKEY_CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  Adana: { latitude: 37.0, longitude: 35.3213 },
  Ankara: { latitude: 39.9334, longitude: 32.8597 },
  Antalya: { latitude: 36.8969, longitude: 30.7133 },
  Bursa: { latitude: 40.1885, longitude: 29.061 },
  Eskişehir: { latitude: 39.7767, longitude: 30.5206 },
  Gaziantep: { latitude: 37.0662, longitude: 37.3833 },
  İstanbul: { latitude: 41.0082, longitude: 28.9784 },
  Istanbul: { latitude: 41.0082, longitude: 28.9784 },
  İzmir: { latitude: 38.4192, longitude: 27.1287 },
  Izmir: { latitude: 38.4192, longitude: 27.1287 },
  Kayseri: { latitude: 38.7312, longitude: 35.4787 },
  Kocaeli: { latitude: 40.8533, longitude: 29.8815 },
  Konya: { latitude: 37.8746, longitude: 32.4932 },
  Mersin: { latitude: 36.8121, longitude: 34.6415 },
  Samsun: { latitude: 41.2867, longitude: 36.33 },
  Trabzon: { latitude: 41.0027, longitude: 39.7168 },
};

export function coordsForCity(city?: string | null): { latitude: number; longitude: number } | null {
  if (!city?.trim()) return null;
  const key = city.trim();
  if (TURKEY_CITY_COORDS[key]) return TURKEY_CITY_COORDS[key];
  const normalized = Object.keys(TURKEY_CITY_COORDS).find(
    (k) => k.toLowerCase() === key.toLowerCase()
  );
  return normalized ? TURKEY_CITY_COORDS[normalized] : null;
}

export const TURKEY_DEFAULT_REGION = {
  latitude: 39.0,
  longitude: 35.0,
  latitudeDelta: 12,
  longitudeDelta: 12,
};
