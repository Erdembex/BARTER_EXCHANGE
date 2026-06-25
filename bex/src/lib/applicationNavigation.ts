import { Href } from 'expo-router';
import { Application } from '@/types';

export function getApplicationTarget(app: Application): Href {
  if (app.status === 'approved') {
    return `/task/submit/${app.id}` as Href;
  }
  if (app.status === 'rewarded') {
    return '/(tabs)/wallet' as Href;
  }
  return `/application/${app.id}` as Href;
}

export function getApplicationQuickAction(app: Application): {
  label: string;
  target: Href;
} | null {
  if (app.status === 'approved') {
    return { label: 'Teslim Et →', target: `/task/submit/${app.id}` as Href };
  }
  if (app.status === 'rewarded') {
    return { label: 'Kuponu Gör →', target: '/(tabs)/wallet' as Href };
  }
  if (app.status === 'submission_approved') {
    return { label: 'Durumu Gör →', target: `/application/${app.id}` as Href };
  }
  return null;
}
