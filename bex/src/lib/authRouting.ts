import { UserRole } from '../types';
import { Href } from 'expo-router';

/** Kök index üzerinden role göre yönlendirme (en güvenilir yol) */
export const AUTH_HOME_ROUTE = '/' as Href;

export function getHomeRouteForRole(role: UserRole): Href {
  return AUTH_HOME_ROUTE;
}

export function isBusinessRole(role: UserRole | undefined): boolean {
  return role === 'business';
}
