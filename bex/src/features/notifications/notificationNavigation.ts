import { Href } from 'expo-router';
import { BexNotification, UserRole } from '@/types';

export function getNotificationsListHref(role?: UserRole): Href {
  if (role === 'business') return '/(business)/notifications' as Href;
  if (role === 'admin') return '/(admin)/notifications' as Href;
  return '/(tabs)/notifications/index' as Href;
}

/** Tabs içindeki bildirimler ekranı */
export const TABS_NOTIFICATIONS_DRAWER_ROUTE = 'notifications/index';

export function getNotificationTarget(
  item: BexNotification,
  role?: UserRole
): Href | null {
  if (item.data?.taskId && role === 'admin' && !item.data?.applicationId) {
    return '/(admin)/tasks' as Href;
  }

  if (item.data?.businessId && role === 'admin' && !item.data?.applicationId) {
    return '/(admin)/verifications' as Href;
  }

  const applicationId = item.data?.applicationId;

  if (item.type === 'message' && applicationId) {
    if (role === 'business') {
      return `/(business)/messages/${applicationId}` as Href;
    }
    return `/(tabs)/messages/${applicationId}` as Href;
  }

  if (applicationId) {
    if (role === 'admin') {
      return '/(admin)/submissions' as Href;
    }
    if (role === 'business') {
      return `/(business)/applications/${applicationId}` as Href;
    }
    if (item.type === 'application_approved') {
      return `/task/submit/${applicationId}` as Href;
    }
    return `/application/${applicationId}` as Href;
  }

  switch (item.type) {
    case 'coupon_issued':
      return '/(tabs)/wallet' as Href;
    case 'task_approved':
      return role === 'business' ? ('/(business)/tasks' as Href) : null;
    case 'kyc_result':
      return role === 'business' ? ('/(business)/verification' as Href) : null;
    case 'trade_offer_received':
      return '/(tabs)/trade?tab=mine' as Href;
    case 'trade_offer_accepted':
    case 'trade_offer_rejected':
      return '/(tabs)/trade?tab=offers' as Href;
    default:
      return null;
  }
}
