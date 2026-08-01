import axios from 'axios';
import { useMemo } from 'react';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { useTranslation } from '@/i18n';

export type ComplaintReason =
  | 'POOR_SERVICE'
  | 'FRAUD'
  | 'HARASSMENT'
  | 'COUPON_ISSUE'
  | 'OTHER';

export type ComplaintStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ComplaintTargetType = 'BUSINESS' | 'INDIVIDUAL';

export type ComplaintDto = {
  id: string;
  businessProfileId: string;
  businessName: string;
  reason: ComplaintReason;
  description: string;
  status: ComplaintStatus;
  adminNote?: string | null;
  createdAt?: string;
  reviewedAt?: string | null;
};

export type IndividualComplaintDto = {
  id: string;
  individualProfileId: string;
  individualDisplayName: string;
  reason: ComplaintReason;
  description: string;
  status: ComplaintStatus;
  adminNote?: string | null;
  createdAt?: string;
  reviewedAt?: string | null;
};

export type ComplaintModerationDto = {
  id: string;
  targetType: ComplaintTargetType;
  targetProfileId: string;
  targetName: string;
  reason: ComplaintReason;
  description: string;
  status: ComplaintStatus;
  adminNote?: string | null;
  createdAt?: string;
  reviewedAt?: string | null;
};

export type PublicComplaintDto = {
  id: string;
  businessProfileId: string;
  businessName: string;
  businessCategory: string;
  reason: ComplaintReason;
  description: string;
  approvedAt?: string;
};

/** @deprecated Yerine useComplaintReasonLabels kullan */
export const COMPLAINT_REASON_LABELS: Record<ComplaintReason, string> = {
  POOR_SERVICE: 'Kötü hizmet',
  FRAUD: 'Dolandırıcılık / sahtekârlık',
  HARASSMENT: 'Taciz / uygunsuz davranış',
  COUPON_ISSUE: 'Kupon sorunu',
  OTHER: 'Diğer',
};

/** @deprecated Yerine useComplaintTargetLabels kullan */
export const COMPLAINT_TARGET_LABELS: Record<ComplaintTargetType, string> = {
  BUSINESS: 'İşletme şikayeti',
  INDIVIDUAL: 'Kullanıcı şikayeti',
};

export function useComplaintReasonLabels(): Record<ComplaintReason, string> {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      POOR_SERVICE: t('complaint.reason.poorService'),
      FRAUD: t('complaint.reason.fraud'),
      HARASSMENT: t('complaint.reason.harassment'),
      COUPON_ISSUE: t('complaint.reason.couponIssue'),
      OTHER: t('complaint.reason.other'),
    }),
    [t]
  );
}

export function useComplaintTargetLabels(): Record<ComplaintTargetType, string> {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      BUSINESS: t('complaint.target.business'),
      INDIVIDUAL: t('complaint.target.individual'),
    }),
    [t]
  );
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

export type ComplaintEligibleApplicationDto = {
  applicationId: string;
  listingId: string;
  listingTitle: string;
  businessProfileId: string;
  businessName: string;
  individualProfileId: string;
  individualDisplayName: string;
  status: string;
  appliedAt?: string;
};

export async function fetchEligibleComplaintApplications(
  businessProfileId?: string
): Promise<ComplaintEligibleApplicationDto[]> {
  const { data } = await apiClient.get<ComplaintEligibleApplicationDto[]>(
    '/api/individual/complaints/eligible-applications',
    { params: businessProfileId ? { businessProfileId } : undefined }
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchEligibleComplaintApplicationsBusiness(): Promise<
  ComplaintEligibleApplicationDto[]
> {
  const { data } = await apiClient.get<ComplaintEligibleApplicationDto[]>(
    '/api/business/complaints/eligible-applications'
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchPublicComplaints(): Promise<PublicComplaintDto[]> {
  const { data } = await apiClient.get<PublicComplaintDto[]>('/api/complaints/public');
  return Array.isArray(data) ? data : [];
}

export async function fetchMyComplaints(): Promise<ComplaintDto[]> {
  const { data } = await apiClient.get<ComplaintDto[]>('/api/individual/complaints/mine');
  return Array.isArray(data) ? data : [];
}

export async function fetchMyIndividualComplaintsBusiness(): Promise<IndividualComplaintDto[]> {
  const { data } = await apiClient.get<IndividualComplaintDto[]>('/api/business/complaints/mine');
  return Array.isArray(data) ? data : [];
}

export async function submitComplaint(payload: {
  applicationId: string;
  reason: ComplaintReason;
  description: string;
}): Promise<ComplaintDto> {
  try {
    const { data } = await apiClient.post<ComplaintDto>('/api/individual/complaints', payload);
    return data;
  } catch (error) {
    throw mapError(error, 'Şikayet gönderilemedi.');
  }
}

export async function submitIndividualComplaint(payload: {
  applicationId: string;
  reason: ComplaintReason;
  description: string;
}): Promise<IndividualComplaintDto> {
  try {
    const { data } = await apiClient.post<IndividualComplaintDto>(
      '/api/business/complaints',
      payload
    );
    return data;
  } catch (error) {
    throw mapError(error, 'Şikayet gönderilemedi.');
  }
}

export async function fetchPendingComplaintsAdmin(): Promise<ComplaintModerationDto[]> {
  const { data } = await apiClient.get<ComplaintModerationDto[]>('/api/admin/complaints/pending');
  return Array.isArray(data) ? data : [];
}

export async function approveComplaintAdmin(
  id: string,
  target: ComplaintTargetType,
  note?: string
): Promise<ComplaintModerationDto> {
  const { data } = await apiClient.patch<ComplaintModerationDto>(
    `/api/admin/complaints/${id}/approve`,
    null,
    { params: { target, ...(note ? { note } : {}) } }
  );
  return data;
}

export async function rejectComplaintAdmin(
  id: string,
  target: ComplaintTargetType,
  note?: string
): Promise<void> {
  await apiClient.patch(`/api/admin/complaints/${id}/reject`, null, {
    params: { target, ...(note ? { note } : {}) },
  });
}
