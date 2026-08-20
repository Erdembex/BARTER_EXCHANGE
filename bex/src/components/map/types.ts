import type { EnrichedTask } from '@/features/data/businessesRepository';

export type MapPin = {
  id: string;
  task: EnrichedTask;
  latitude: number;
  longitude: number;
};
