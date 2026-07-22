import { TaskCategory } from '@/types';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import {
  applicationsRepository,
  couponsRepository,
  tasksRepository,
} from '@/features/data';

export interface BusinessAnalytics {
  publishedTasks: number;
  activeTasks: number;
  pendingApproval: number;
  totalApplications: number;
  pendingApplications: number;
  submittedApplications: number;
  completedTasks: number;
  couponsDistributed: number;
  couponsUsed: number;
  couponUseRate: number;
  topCategory: TaskCategory | null;
  topCategoryCount: number;
}

export async function getBusinessAnalytics(
  businessId: string
): Promise<BusinessAnalytics> {
  if (shouldUseDemoData()) {
    return demoStore.getAnalytics(businessId) as BusinessAnalytics;
  }

  const [tasks, apps, coupons] = await Promise.all([
    tasksRepository.getByBusiness(businessId),
    applicationsRepository.getByBusiness(businessId),
    couponsRepository.getByBusiness(businessId),
  ]);

  const categoryCount: Record<string, number> = {};
  for (const t of tasks) {
    categoryCount[t.category] = (categoryCount[t.category] ?? 0) + 1;
  }
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
  const distributed = coupons.length;
  const used = coupons.filter((c) => c.status === 'exhausted').length;

  return {
    publishedTasks: tasks.length,
    activeTasks: tasks.filter((t) => t.status === 'active').length,
    pendingApproval: tasks.filter((t) => !t.approvedByAdmin).length,
    totalApplications: apps.length,
    pendingApplications: apps.filter((a) => a.status === 'pending').length,
    submittedApplications: apps.filter((a) => a.status === 'submitted').length,
    completedTasks: apps.filter((a) => a.status === 'rewarded').length,
    couponsDistributed: distributed,
    couponsUsed: used,
    couponUseRate: distributed > 0 ? Math.round((used / distributed) * 100) : 0,
    topCategory: (topCategory?.[0] as TaskCategory) ?? null,
    topCategoryCount: topCategory?.[1] ?? 0,
  };
}
