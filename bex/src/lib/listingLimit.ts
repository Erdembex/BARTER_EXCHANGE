import { tasksRepository } from '@/features/data';
import {
  fetchBusinessSubscription,
  fetchSubscriptionPlans,
} from '@/features/subscription/subscriptionApi';

export type ListingLimitInfo = {
  max: number;
  active: number;
  canCreate: boolean;
  planLabel: string;
};

function parseMaxListings(raw?: string): number {
  if (!raw || raw === 'unlimited') return Number.POSITIVE_INFINITY;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 2;
}

export async function getListingLimitInfo(businessId: string): Promise<ListingLimitInfo> {
  const [subscription, plans, tasks] = await Promise.all([
    fetchBusinessSubscription().catch(() => null),
    fetchSubscriptionPlans().catch(() => []),
    tasksRepository.getByBusiness(businessId).catch(() => []),
  ]);

  const plan = plans.find((p) => p.name === subscription?.planName) ?? plans[0];
  const max = parseMaxListings(plan?.features?.MAX_ACTIVE_LISTINGS);
  const active = tasks.filter((t) => t.status === 'active' || t.status === 'draft').length;

  return {
    max,
    active,
    canCreate: active < max,
    planLabel: subscription?.planDisplayName ?? plan?.displayName ?? 'Ücretsiz',
  };
}
