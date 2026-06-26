import { Href } from 'expo-router';
import { BexNotification, UserRole } from '@/types';

export function getNotificationTarget(
  item: BexNotification,
  role?: UserRole
): Href | null {
  if (item.data?.businessId && role === 'admin') {
    return '/(admin)/verifications' as Href;
  }

  const applicationId = item.data?.applicationId;

  if (applicationId) {
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
    default:
      return null;
  }
}
