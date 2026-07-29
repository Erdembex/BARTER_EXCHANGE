import * as Location from 'expo-location';
import {
  findNearestCity,
  matchCity,
  matchDistrict,
} from '@/constants/turkeyLocations';

export type DeviceLocationResult = {
  city: string;
  district: string | null;
};

/** Konum izni alır, GPS + reverse geocode ile il/ilçe çözer */
export async function resolveLocationFromDevice(): Promise<DeviceLocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Konum izni verilmedi. Ayarlardan izin ver veya il/ilçeyi elle seç.');
  }

  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    throw new Error('Konum servisleri kapalı. Ayarlardan aç veya il/ilçeyi elle seç.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;
  let city: string | null = null;
  let district: string | null = null;

  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0];
    if (place) {
      city =
        matchCity(place.region) ??
        matchCity(place.city) ??
        matchCity(place.subregion) ??
        null;
      if (city) {
        district =
          matchDistrict(city, place.district) ??
          matchDistrict(city, place.subregion) ??
          matchDistrict(city, place.city) ??
          null;
      }
    }
  } catch {
    // Reverse geocode bazen web/emülatörde başarısız olur; en yakın ile devam et
  }

  if (!city) {
    city = findNearestCity(latitude, longitude);
  }

  return { city, district };
}
