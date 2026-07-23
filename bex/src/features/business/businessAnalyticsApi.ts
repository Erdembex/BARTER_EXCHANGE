import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { BusinessAnalytics } from '@/features/business/businessAnalyticsService';
import { TaskCategory } from '@/types';

type AnalyticsDto = {
  publishedTasks?: number;
  activeTasks?: number;
  pendingApproval?: number;
  totalApplications?: number;
  pendingApplications?: number;
  submittedApplications?: number;
  completedTasks?: number;
  couponsDistributed?: number;
  couponsUsed?: number;
  couponUseRatePercent?: number;
};

export async function fetchBusinessAnalyticsRest(): Promise<BusinessAnalytics> {
  try {
    const { data } = await apiClient.get<AnalyticsDto>('/api/business/analytics');
    return {
      publishedTasks: data.publishedTasks ?? 0,
      activeTasks: data.activeTasks ?? 0,
      pendingApproval: data.pendingApproval ?? 0,
      totalApplications: data.totalApplications ?? 0,
      pendingApplications: data.pendingApplications ?? 0,
      submittedApplications: data.submittedApplications ?? 0,
      completedTasks: data.completedTasks ?? 0,
      couponsDistributed: data.couponsDistributed ?? 0,
      couponsUsed: data.couponsUsed ?? 0,
      couponUseRate: data.couponUseRatePercent ?? 0,
      topCategory: null,
      topCategoryCount: 0,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(getApiErrorMessage(error, 'Analitik yüklenemedi.'));
    }
    throw error instanceof Error ? error : new Error('Analitik yüklenemedi.');
  }
}

export type { BusinessAnalytics, TaskCategory };
