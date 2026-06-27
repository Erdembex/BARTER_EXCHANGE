import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();

export const COLLECTIONS = {
  USERS: 'users',
  APPLICATIONS: 'applications',
  BUSINESSES: 'businesses',
  TASKS: 'tasks',
  COUPONS: 'coupons',
  TRADE_LISTINGS: 'trade_listings',
  TRADE_OFFERS: 'trade_offers',
  NOTIFICATIONS: 'notifications',
} as const;
