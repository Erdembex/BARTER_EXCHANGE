import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { BillingPeriod } from '@/features/subscription/subscriptionApi';

export type PendingSubscriptionUpgrade = {
  businessId: string;
  businessName: string;
  currentPlanDisplayName: string;
  targetPlanName: string;
  targetPlanDisplayName: string;
  billingPeriod: BillingPeriod;
  reference: string;
  requestedAt?: string;
};

type PendingUpgradeDto = {
  businessId: string;
  businessName?: string;
  currentPlanDisplayName?: string;
  targetPlanName?: string;
  targetPlanDisplayName?: string;
  billingPeriod?: BillingPeriod;
  reference?: string;
  requestedAt?: string;
};

function mapPendingUpgrade(dto: PendingUpgradeDto): PendingSubscriptionUpgrade {
  return {
    businessId: String(dto.businessId),
    businessName: dto.businessName ?? 'İşletme',
    currentPlanDisplayName: dto.currentPlanDisplayName ?? '—',
    targetPlanName: dto.targetPlanName ?? '',
    targetPlanDisplayName: dto.targetPlanDisplayName ?? dto.targetPlanName ?? 'Plan',
    billingPeriod: dto.billingPeriod ?? 'MONTHLY',
    reference: dto.reference ?? '',
    requestedAt: dto.requestedAt,
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export async function fetchPendingSubscriptionUpgrades(): Promise<PendingSubscriptionUpgrade[]> {
  try {
    const { data } = await apiClient.get<PendingUpgradeDto[]>('/api/admin/subscriptions/pending');
    return (Array.isArray(data) ? data : []).map(mapPendingUpgrade);
  } catch (error) {
    throw mapError(error, 'Bekleyen talepler yüklenemedi.');
  }
}

export async function confirmSubscriptionPayment(businessId: string): Promise<void> {
  try {
    await apiClient.post(`/api/admin/subscriptions/${businessId}/confirm-payment`);
  } catch (error) {
    throw mapError(error, 'Ödeme onaylanamadı.');
  }
}

export async function rejectSubscriptionPayment(businessId: string): Promise<void> {
  try {
    await apiClient.post(`/api/admin/subscriptions/${businessId}/reject-payment`);
  } catch (error) {
    throw mapError(error, 'Talep reddedilemedi.');
  }
}
