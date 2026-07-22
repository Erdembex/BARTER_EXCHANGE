import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { isBackendId } from '@/lib/api/backendId';
import {
  getSessionClaims,
  hasRestAuthSession,
} from '@/lib/auth/sessionClaims';
import { fetchBusinessListings, fetchListingDetail } from '@/features/listing/listingsApi';
import { Application, ApplicationStatus, CreateApplication } from '@/types';

type BackendApplicationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'SUBMITTED'
  | 'SUBMISSION_APPROVED'
  | 'REWARDED'
  | string;

type ApplicationDto = {
  applicationId?: string;
  listingId?: string;
  listingTitle?: string | null;
  businessName?: string | null;
  businessLogoUrl?: string | null;
  status?: BackendApplicationStatus;
  appliedAt?: string;
};

type ApplicationDetailDto = {
  applicationId?: string;
  individualId?: string;
  fullName?: string;
  avatarUrl?: string | null;
  city?: string | null;
  district?: string | null;
  skills?: string[];
  bio?: string | null;
  coverLetter?: string;
  status?: BackendApplicationStatus;
  appliedAt?: string;
  submissionText?: string | null;
  submissionImageUrls?: string[];
  submittedAt?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  listingId?: string;
  businessId?: string;
};

type ApplicantDto = {
  applicationId?: string;
  individualId?: string;
  fullName?: string;
  avatarUrl?: string | null;
  skills?: string[];
  coverLetterExcerpt?: string;
  status?: BackendApplicationStatus;
  appliedAt?: string;
};

const STATUS_MAP: Record<string, ApplicationStatus> = {
  PENDING: 'pending',
  UNDER_REVIEW: 'pending',
  ACCEPTED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'cancelled',
  SUBMITTED: 'submitted',
  SUBMISSION_APPROVED: 'submission_approved',
  REWARDED: 'rewarded',
};

function mapDetailFields(dto: ApplicationDetailDto): Pick<
  Application,
  'submissionText' | 'submissionFiles' | 'submittedAt' | 'reviewedAt' | 'reviewNote'
> {
  return {
    submissionText: dto.submissionText?.trim() ?? '',
    submissionFiles: Array.isArray(dto.submissionImageUrls) ? dto.submissionImageUrls : [],
    submittedAt: dto.submittedAt ? toTimestamp(dto.submittedAt) : undefined,
    reviewedAt: dto.reviewedAt ? toTimestamp(dto.reviewedAt) : undefined,
    reviewNote: dto.reviewNote?.trim() ?? undefined,
  };
}

function mapBackendStatus(status?: BackendApplicationStatus): ApplicationStatus {
  return STATUS_MAP[status?.toUpperCase() ?? ''] ?? 'pending';
}

function toTimestamp(value?: string): Timestamp {
  if (!value) return Timestamp.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
}

async function resolveListingMeta(listingId: string): Promise<{
  businessId: string;
  title: string;
}> {
  const listing = await fetchListingDetail(listingId);
  return {
    businessId: listing?.businessId ?? '',
    title: listing?.title ?? 'Görev',
  };
}

async function mapApplicationDto(
  dto: ApplicationDto,
  userId: string
): Promise<Application> {
  const listingId = String(dto.listingId ?? '');
  const listingMeta = listingId ? await resolveListingMeta(listingId) : { businessId: '', title: 'Görev' };

  return {
    id: String(dto.applicationId),
    taskId: listingId,
    userId,
    businessId: listingMeta.businessId,
    status: mapBackendStatus(dto.status),
    coverLetter: '',
    submissionText: '',
    submissionFiles: [],
    createdAt: toTimestamp(dto.appliedAt),
  };
}

/** Başvuru sahibi mi? REST modunda userId bazen profil UUID'si olabilir. */
export async function isCurrentApplicationOwner(
  applicationUserId: string,
  authUserId: string
): Promise<boolean> {
  if (applicationUserId === authUserId) return true;
  const claims = await getSessionClaims();
  const profileId = claims?.profileId;
  return profileId != null && applicationUserId === profileId;
}

async function mapDetailToApplication(
  dto: ApplicationDetailDto,
  listingId: string,
  businessId: string,
  userId: string
): Promise<Application> {
  return {
    id: String(dto.applicationId),
    taskId: listingId,
    userId,
    businessId,
    status: mapBackendStatus(dto.status),
    coverLetter: dto.coverLetter?.trim() ?? '',
    ...mapDetailFields(dto),
    createdAt: toTimestamp(dto.appliedAt),
  };
}

function mapApplicationsError(error: unknown, fallback: string): Error & { code?: string } {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string } | undefined;
    const message = data?.message ?? getApiErrorMessage(error, fallback);
    if (message.includes('zaten başvurdun')) {
      return Object.assign(new Error(message), { code: 'already-applied' });
    }
    return Object.assign(new Error(status ? `[${status}] ${message}` : message), {
      code: status === 403 ? 'forbidden' : undefined,
    });
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

export { hasRestAuthSession, isBackendId };

/** POST /api/individual/applications */
export async function applyToListing(input: CreateApplication): Promise<string> {
  try {
    const { data } = await apiClient.post<ApplicationDto>('/api/individual/applications', {
      listingId: input.taskId,
      coverLetter: input.coverLetter,
    });
    return String(data.applicationId);
  } catch (error) {
    throw mapApplicationsError(error, 'Başvuru gönderilemedi.');
  }
}

/** GET /api/individual/applications */
export async function fetchMyApplications(userId: string): Promise<Application[]> {
  try {
    const { data } = await apiClient.get<ApplicationDto[]>('/api/individual/applications');
    const rows = Array.isArray(data) ? data : [];
    return Promise.all(rows.map((row) => mapApplicationDto(row, userId)));
  } catch (error) {
    throw mapApplicationsError(error, 'Başvurular yüklenemedi.');
  }
}

/** GET /api/individual/applications/{id} or business variant */
export async function fetchApplicationById(applicationId: string): Promise<Application | null> {
  if (!isBackendId(applicationId)) return null;

  const claims = await getSessionClaims();
  const userType = claims?.userType;
  const sessionUserId = claims?.sub ?? '';

  try {
    if (userType === 'BUSINESS') {
      const apps = await fetchBusinessApplications();
      const base = apps.find((app) => app.id === applicationId);
      if (!base) return null;

      const { data } = await apiClient.get<ApplicationDetailDto>(
        `/api/business/applications/${applicationId}`
      );
      return {
        ...base,
        coverLetter: data.coverLetter?.trim() ?? base.coverLetter,
        status: mapBackendStatus(data.status),
        ...mapDetailFields(data),
      };
    }

    const { data } = await apiClient.get<ApplicationDetailDto>(
      `/api/individual/applications/${applicationId}`
    );
    const mine = await apiClient.get<ApplicationDto[]>('/api/individual/applications');
    const summary = (Array.isArray(mine.data) ? mine.data : []).find(
      (item) => String(item.applicationId) === applicationId
    );
    const listingId = String(summary?.listingId ?? '');
    const listingMeta = listingId ? await resolveListingMeta(listingId) : { businessId: '', title: 'Görev' };

    return mapDetailToApplication(
      data,
      listingId,
      listingMeta.businessId,
      sessionUserId
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw mapApplicationsError(error, 'Başvuru yüklenemedi.');
  }
}

/** DELETE /api/individual/applications/{id} */
export async function withdrawApplication(applicationId: string): Promise<void> {
  await apiClient.delete(`/api/individual/applications/${applicationId}`);
}

/** GET /api/business/listings/{listingId}/applications */
export async function fetchApplicantsByListing(listingId: string): Promise<Application[]> {
  const { data } = await apiClient.get<ApplicantDto[]>(
    `/api/business/listings/${listingId}/applications`
  );
  const listingMeta = await resolveListingMeta(listingId);
  const rows = Array.isArray(data) ? data : [];

  return rows.map((row) => ({
    id: String(row.applicationId),
    taskId: listingId,
    userId: String(row.individualId ?? ''),
    businessId: listingMeta.businessId,
    status: mapBackendStatus(row.status),
    coverLetter: row.coverLetterExcerpt?.trim() ?? '',
    submissionText: '',
    submissionFiles: [],
    createdAt: toTimestamp(row.appliedAt),
  }));
}

/** Aggregate business applications across listings */
export async function fetchBusinessApplications(): Promise<Application[]> {
  const listings = await fetchBusinessListings();
  const batches = await Promise.all(
    listings.map((listing) =>
      fetchApplicantsByListing(listing.id).catch(() => [] as Application[])
    )
  );
  return batches
    .flat()
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function acceptApplication(applicationId: string): Promise<void> {
  await apiClient.patch(`/api/business/applications/${applicationId}/accept`);
}

export async function rejectApplication(applicationId: string): Promise<void> {
  await apiClient.patch(`/api/business/applications/${applicationId}/reject`);
}

export async function reviewApplication(applicationId: string): Promise<void> {
  await apiClient.patch(`/api/business/applications/${applicationId}/review`);
}

/** POST /api/individual/applications/{id}/submission */
export async function submitApplicationSubmission(
  applicationId: string,
  description: string,
  imageUrls: string[]
): Promise<void> {
  try {
    await apiClient.post(`/api/individual/applications/${applicationId}/submission`, {
      description,
      imageUrls,
    });
  } catch (error) {
    throw mapApplicationsError(error, 'Görev teslim edilemedi.');
  }
}

export async function useApplicationsRestBackend(): Promise<boolean> {
  return hasRestAuthSession();
}

export function mapRestApplicationStatus(status?: BackendApplicationStatus): ApplicationStatus {
  return mapBackendStatus(status);
}

export async function findMyApplicationForListing(
  userId: string,
  listingId: string
): Promise<Application | null> {
  const apps = await fetchMyApplications(userId);
  return apps.find((app) => app.taskId === listingId && app.status !== 'cancelled') ?? null;
}

/** GET /api/admin/applications/submissions/pending */
export async function fetchPendingAdminSubmissions(): Promise<Application[]> {
  try {
    const { data } = await apiClient.get<ApplicationDetailDto[]>(
      '/api/admin/applications/submissions/pending'
    );
    const rows = Array.isArray(data) ? data : [];
    return Promise.all(
      rows.map(async (row) => {
        const listingId = String(row.listingId ?? '');
        const businessId = row.businessId ? String(row.businessId) : '';
        const resolvedBusinessId =
          businessId ||
          (listingId ? (await resolveListingMeta(listingId)).businessId : '');
        return mapDetailToApplication(
          row,
          listingId,
          resolvedBusinessId,
          String(row.individualId ?? '')
        );
      })
    );
  } catch (error) {
    throw mapApplicationsError(error, 'Teslimler yüklenemedi.');
  }
}

export async function approveAdminSubmission(
  applicationId: string,
  reviewNote?: string
): Promise<void> {
  try {
    await apiClient.patch(
      `/api/admin/applications/${applicationId}/approve-submission`,
      null,
      { params: reviewNote ? { note: reviewNote } : undefined }
    );
  } catch (error) {
    throw mapApplicationsError(error, 'Teslim onaylanamadı.');
  }
}

export async function rejectAdminSubmission(
  applicationId: string,
  reviewNote?: string
): Promise<void> {
  try {
    await apiClient.patch(
      `/api/admin/applications/${applicationId}/reject-submission`,
      null,
      { params: reviewNote ? { note: reviewNote } : undefined }
    );
  } catch (error) {
    throw mapApplicationsError(error, 'Teslim reddedilemedi.');
  }
}
