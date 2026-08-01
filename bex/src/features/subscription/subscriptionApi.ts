import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api';

export type BillingPeriod = 'MONTHLY' | 'SEMIANNUAL' | 'YEARLY';

export type SubscriptionPlan = {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceSemiAnnual: number;
  priceYearly: number;
  features: Record<string, string>;
};

export type BusinessSubscription = {
  id: string;
  planName: string;
  planDisplayName: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  pendingPlanName?: string;
  pendingPlanDisplayName?: string;
  pendingBillingPeriod?: BillingPeriod;
  pendingReference?: string;
  pendingRequestedAt?: string;
};

export type SubscriptionInvoice = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string | null;
  createdAt?: string;
};

export type CheckoutOutcome = {
  requiresRedirect: boolean;
  redirectUrl?: string;
  message?: string;
  reference?: string;
};

type PlanDto = {
  id: string;
  name?: string;
  displayName?: string;
  priceMonthly?: number | string;
  priceSemiAnnual?: number | string;
  priceYearly?: number | string;
  features?: Record<string, string>;
};

type SubscriptionDto = {
  id: string;
  planName?: string;
  planDisplayName?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  pendingPlanName?: string;
  pendingPlanDisplayName?: string;
  pendingBillingPeriod?: BillingPeriod;
  pendingReference?: string;
  pendingRequestedAt?: string;
};

type InvoiceDto = {
  id: string;
  amount?: number | string;
  currency?: string;
  status?: string;
  paidAt?: string | null;
  createdAt?: string;
};

type CheckoutDto = {
  requiresRedirect?: boolean;
  redirectUrl?: string;
  message?: string;
  reference?: string;
};

function mapPlan(dto: PlanDto): SubscriptionPlan {
  return {
    id: String(dto.id),
    name: dto.name ?? '',
    displayName: dto.displayName ?? dto.name ?? 'Plan',
    priceMonthly: Number(dto.priceMonthly ?? 0),
    priceSemiAnnual: Number(dto.priceSemiAnnual ?? 0),
    priceYearly: Number(dto.priceYearly ?? 0),
    features: dto.features ?? {},
  };
}

function mapSubscription(dto: SubscriptionDto): BusinessSubscription {
  return {
    id: String(dto.id),
    planName: dto.planName ?? '',
    planDisplayName: dto.planDisplayName ?? dto.planName ?? 'Plan',
    status: dto.status ?? 'ACTIVE',
    cancelAtPeriodEnd: dto.cancelAtPeriodEnd ?? false,
    currentPeriodStart: dto.currentPeriodStart,
    currentPeriodEnd: dto.currentPeriodEnd,
    pendingPlanName: dto.pendingPlanName,
    pendingPlanDisplayName: dto.pendingPlanDisplayName,
    pendingBillingPeriod: dto.pendingBillingPeriod,
    pendingReference: dto.pendingReference,
    pendingRequestedAt: dto.pendingRequestedAt,
  };
}

function mapInvoice(dto: InvoiceDto): SubscriptionInvoice {
  return {
    id: String(dto.id),
    amount: Number(dto.amount ?? 0),
    currency: dto.currency ?? 'TRY',
    status: dto.status ?? '',
    paidAt: dto.paidAt,
    createdAt: dto.createdAt,
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const { data } = await apiClient.get<PlanDto[]>('/api/plans');
    return (Array.isArray(data) ? data : []).map(mapPlan);
  } catch (error) {
    throw mapError(error, 'Planlar yüklenemedi.');
  }
}

export async function fetchBusinessSubscription(): Promise<BusinessSubscription> {
  try {
    const { data } = await apiClient.get<SubscriptionDto>('/api/business/subscription');
    return mapSubscription(data);
  } catch (error) {
    throw mapError(error, 'Abonelik bilgisi yüklenemedi.');
  }
}

export async function fetchSubscriptionInvoices(): Promise<SubscriptionInvoice[]> {
  try {
    const { data } = await apiClient.get<InvoiceDto[]>('/api/business/subscription/invoices');
    return (Array.isArray(data) ? data : []).map(mapInvoice);
  } catch (error) {
    throw mapError(error, 'Faturalar yüklenemedi.');
  }
}

export async function createSubscriptionCheckout(
  targetPlanId: string,
  billingPeriod: BillingPeriod
): Promise<CheckoutOutcome> {
  try {
    const { data } = await apiClient.post<CheckoutDto>('/api/business/subscription/checkout', {
      targetPlanId,
      billingPeriod,
    });
    return {
      requiresRedirect: data.requiresRedirect ?? false,
      redirectUrl: data.redirectUrl,
      message: data.message,
      reference: data.reference,
    };
  } catch (error) {
    throw mapError(error, 'Yükseltme talebi başlatılamadı.');
  }
}

export async function createBillingPortalSession(): Promise<string> {
  try {
    const { data } = await apiClient.post<{ portalUrl?: string }>(
      '/api/business/subscription/portal'
    );
    if (!data.portalUrl) throw new Error('Fatura portalı açılamadı.');
    return data.portalUrl;
  } catch (error) {
    throw mapError(error, 'Fatura portalı açılamadı.');
  }
}

export async function cancelSubscriptionAtPeriodEnd(): Promise<void> {
  try {
    await apiClient.post('/api/business/subscription/cancel');
  } catch (error) {
    throw mapError(error, 'Abonelik iptal edilemedi.');
  }
}
