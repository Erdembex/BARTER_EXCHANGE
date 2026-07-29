import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@bex/tasks_location_filter';

export type SavedLocationFilter = {
  city: string | null;
  district: string | null;
};

export async function loadLocationFilter(): Promise<SavedLocationFilter | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedLocationFilter;
    if (parsed && ('city' in parsed || 'district' in parsed)) {
      return {
        city: parsed.city ?? null,
        district: parsed.district ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveLocationFilter(filter: SavedLocationFilter): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
  } catch {
    // sessiz — filtre yine ekranda çalışır
  }
}
