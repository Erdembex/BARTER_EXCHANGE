import { Timestamp } from 'firebase/firestore';
import { DEMO_BUSINESSES, DEMO_TASKS } from '@/lib/demoData';
import { resolveEffectiveRole, shouldUseDemoData, buildDevUser } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { COLLECTIONS, Business, Task, Application, BexUser } from '@/types';
import { enrichTasksWithBusiness, getDemoBusinessName } from '@/lib/demoData';
import type { EnrichedTask } from '@/features/data/businessesRepository';
import { tasksRepository, businessesRepository } from '@/features/data/businessesRepository';
import { applicationsRepository } from '@/features/data/applicationsRepository';
import { usersRepository } from '@/features/data/usersRepository';
import { appendApprovedWorkToPortfolio } from '@/features/portfolio';
import { notifyUser, notifyAdmins } from '@/features/notifications/notificationsRepository';
import { getAllDevProfiles, loadDevProfiles, setDevProfile } from '@/lib/devProfileStore';
import { usesRestBackend } from '@/lib/restBackend';

async function notifyBusinessOwner(
  businessId: string,
  title: string,
  body: string,
  type: 'task_approved' | 'kyc_result' | 'general',
  data?: Record<string, string>
) {
  if (shouldUseDemoData()) {
    const business = demoStore.getBusinesses().find((b) => b.id === businessId);
    if (!business?.ownerUid) return;
    await notifyUser({
      userId: business.ownerUid,
      title,
      body,
      type,
      data,
      showLocalForUserId: business.ownerUid,
    });
    return;
  }
  // REST modunda bildirimler backend tarafından oluşturulur
}

export type EnrichedSubmission = Application & {
  taskTitle: string;
  businessName: string;
  applicantName: string;
};

function enrichSubmissionsSync(apps: Application[]): EnrichedSubmission[] {
  if (shouldUseDemoData()) {
    const tasks = demoStore.getTasks();
    const businesses = demoStore.getBusinesses();
    return apps.map((app) => ({
      ...app,
      taskTitle: tasks.find((t) => t.id === app.taskId)?.title ?? 'Görev',
      businessName: businesses.find((b) => b.id === app.businessId)?.name ?? 'İşletme',
      applicantName: `Kullanıcı ${app.userId.slice(-4)}`,
    }));
  }
  return apps.map((app) => ({
    ...app,
    taskTitle: 'Görev',
    businessName: getDemoBusinessName(app.businessId),
    applicantName: `Kullanıcı ${app.userId.slice(-4)}`,
  }));
}

async function enrichSubmissions(apps: Application[]): Promise<EnrichedSubmission[]> {
  if (shouldUseDemoData()) {
    const base = enrichSubmissionsSync(apps);
    const names = await usersRepository.getDisplayNames(apps.map((a) => a.userId));
    return base.map((app) => ({
      ...app,
      applicantName: names[app.userId] ?? app.applicantName,
    }));
  }

  const taskCache = new Map<string, string>();
  const bizCache = new Map<string, string>();
  const result: EnrichedSubmission[] = [];

  for (const app of apps) {
    if (!taskCache.has(app.taskId)) {
      const task = await tasksRepository.getById(app.taskId);
      taskCache.set(app.taskId, task?.title ?? 'Görev');
    }
    if (!bizCache.has(app.businessId)) {
      const biz = await businessesRepository.getById(app.businessId);
      bizCache.set(app.businessId, biz?.name ?? 'İşletme');
    }
    result.push({
      ...app,
      taskTitle: taskCache.get(app.taskId)!,
      businessName: bizCache.get(app.businessId)!,
      applicantName: `Kullanıcı ${app.userId.slice(-4)}`,
    });
  }

  const names = await usersRepository.getDisplayNames(apps.map((a) => a.userId));
  return result.map((app) => ({
    ...app,
    applicantName: names[app.userId] ?? app.applicantName,
  }));
}

export const adminRepository = {
  async getPendingTasks(): Promise<EnrichedTask[]> {
    if (shouldUseDemoData()) {
      return enrichTasksWithBusiness(
        demoStore.getPendingAdminTasks(),
        demoStore.getBusinesses()
      );
    }
    if (await usesRestBackend()) {
      try {
        const { fetchPendingAdminListings } = await import('../listing/listingsApi');
        return fetchPendingAdminListings();
      } catch {
        return [];
      }
    }
    return [];
  },

  async approveTask(taskId: string): Promise<void> {
    if (shouldUseDemoData()) {
      const task = demoStore.getTasks().find((t) => t.id === taskId);
      demoStore.setTaskAdminApproval(taskId, true);
      if (task) {
        await notifyBusinessOwner(
          task.businessId,
          'Görevin onaylandı',
          `"${task.title}" artık kullanıcılara görünür.`,
          'task_approved',
          { taskId }
        );
      }
      return;
    }
    if (await usesRestBackend()) {
      const { approveListingAsAdmin } = await import('../listing/listingsApi');
      const task = await tasksRepository.getById(taskId);
      await approveListingAsAdmin(taskId);
      if (task) {
        await notifyBusinessOwner(
          task.businessId,
          'Görevin onaylandı',
          `"${task.title}" artık kullanıcılara görünür.`,
          'task_approved',
          { taskId }
        );
      }
      return;
    }
  },

  async rejectTask(taskId: string): Promise<void> {
    if (shouldUseDemoData()) {
      demoStore.setTaskAdminApproval(taskId, false);
      return;
    }
    if (await usesRestBackend()) {
      const { rejectListingAsAdmin } = await import('../listing/listingsApi');
      await rejectListingAsAdmin(taskId);
      return;
    }
  },

  async getPendingVerifications(): Promise<Business[]> {
    if (shouldUseDemoData()) {
      return demoStore.getPendingVerifications();
    }
    return [];
  },

  async approveBusinessVerification(businessId: string): Promise<void> {
    if (shouldUseDemoData()) {
      const biz = demoStore.setBusinessVerification(businessId, 'verified');
      if (biz) {
        await notifyUser({
          userId: biz.ownerUid,
          title: 'KYC onaylandı',
          body: `${biz.name} doğrulandı. Güven rozetin aktif.`,
          type: 'kyc_result',
          data: { businessId, status: 'verified' },
          showLocalForUserId: biz.ownerUid,
        });
      }
      return;
    }
    throw new Error('KYC moderasyonu REST backend\'de henüz desteklenmiyor.');
  },

  async rejectBusinessVerification(businessId: string): Promise<void> {
    if (shouldUseDemoData()) {
      const biz = demoStore.setBusinessVerification(businessId, 'rejected');
      if (biz) {
        await notifyUser({
          userId: biz.ownerUid,
          title: 'KYC reddedildi',
          body: `${biz.name} evrak incelemesi olumsuz. Yeni evrak yükleyebilirsin.`,
          type: 'kyc_result',
          data: { businessId, status: 'rejected' },
          showLocalForUserId: biz.ownerUid,
        });
      }
      return;
    }
    throw new Error('KYC moderasyonu REST backend\'de henüz desteklenmiyor.');
  },

  async getPendingSubmissions(): Promise<EnrichedSubmission[]> {
    if (shouldUseDemoData()) {
      return enrichSubmissionsSync(demoStore.getPendingSubmissions());
    }
    if (await usesRestBackend()) {
      try {
        const { fetchPendingAdminSubmissions } = await import('../application/applicationsApi');
        const apps = await fetchPendingAdminSubmissions();
        return await enrichSubmissions(apps);
      } catch {
        return [];
      }
    }
    return [];
  },

  async approveSubmission(applicationId: string, reviewNote?: string): Promise<void> {
    if (await usesRestBackend()) {
      const { approveAdminSubmission } = await import('../application/applicationsApi');
      await approveAdminSubmission(applicationId, reviewNote);
      const app = await applicationsRepository.getById(applicationId);
      if (app) {
        await notifyBusinessOwner(
          app.businessId,
          'Teslim admin onayladı',
          'Kullanıcı teslimi uygun bulundu. Başvurularından kupon verebilirsin.',
          'general',
          { applicationId }
        );
        await notifyUser({
          userId: app.userId,
          title: 'Teslimin onaylandı',
          body: 'Admin içeriği onayladı. Görsellerin portföyünde görünür.',
          type: 'general',
          data: { applicationId },
          showLocalForUserId: app.userId,
        });
        const task = await tasksRepository.getById(app.taskId);
        await appendApprovedWorkToPortfolio(
          app.userId,
          { ...app, status: 'submission_approved', reviewNote: reviewNote ?? '' },
          task?.title ?? 'Görev'
        );
      }
      return;
    }

    if (!shouldUseDemoData()) {
      throw new Error('Teslim moderasyonu REST backend\'de henüz desteklenmiyor.');
    }

    let app: Application | null = demoStore.getApplications().find((a) => a.id === applicationId) ?? null;

    if (!app || app.status !== 'submitted') return;

    demoStore.updateApplication(applicationId, {
      status: 'submission_approved',
      reviewNote: reviewNote ?? '',
      reviewedAt: Timestamp.now(),
    });

    await notifyBusinessOwner(
      app.businessId,
      'Teslim admin onayladı',
      'Kullanıcı teslimi uygun bulundu. Başvurularından kupon verebilirsin.',
      'general',
      { applicationId }
    );
    await notifyUser({
      userId: app.userId,
      title: 'Teslimin onaylandı',
      body: 'Admin içeriği onayladı. Görsellerin portföyünde görünür; işletmeler başvuru öncesi inceleyebilir.',
      type: 'general',
      data: { applicationId },
      showLocalForUserId: app.userId,
    });

    const task = await tasksRepository.getById(app.taskId);
    await appendApprovedWorkToPortfolio(
      app.userId,
      {
        ...app,
        status: 'submission_approved',
        reviewNote: reviewNote ?? '',
        reviewedAt: Timestamp.now(),
      },
      task?.title ?? 'Görev'
    );
  },

  async rejectSubmission(applicationId: string, reviewNote: string): Promise<void> {
    if (await usesRestBackend()) {
      const { rejectAdminSubmission } = await import('../application/applicationsApi');
      const note = reviewNote.trim() || 'İçerik uygunsuz. Lütfen düzeltip tekrar teslim et.';
      await rejectAdminSubmission(applicationId, note);
      const app = await applicationsRepository.getById(applicationId);
      if (app) {
        await notifyUser({
          userId: app.userId,
          title: 'Teslimin reddedildi',
          body: note,
          type: 'general',
          data: { applicationId },
          showLocalForUserId: app.userId,
        });
      }
      return;
    }

    if (!shouldUseDemoData()) {
      throw new Error('Teslim moderasyonu REST backend\'de henüz desteklenmiyor.');
    }

    const note = reviewNote.trim() || 'İçerik uygunsuz. Lütfen düzeltip tekrar teslim et.';
    const app = demoStore.getApplications().find((a) => a.id === applicationId) ?? null;

    if (!app || app.status !== 'submitted') return;

    demoStore.updateApplication(applicationId, {
      status: 'approved',
      reviewNote: note,
      reviewedAt: Timestamp.now(),
    });

    await notifyUser({
      userId: app.userId,
      title: 'Teslimin reddedildi',
      body: note,
      type: 'general',
      data: { applicationId },
      showLocalForUserId: app.userId,
    });
  },

  async seedLiveCatalog(): Promise<{ businesses: number; tasks: number }> {
    throw new Error('REST modunda tohum veri desteklenmiyor.');
  },

  async searchUsers(search: string, max = 40): Promise<BexUser[]> {
    const q = search.trim().toLowerCase();

    if (shouldUseDemoData()) {
      await loadDevProfiles();
      const list = getAllDevProfiles()
        .map(({ uid, profile }) => buildDevUser(uid, profile.email, profile.displayName))
        .filter((u) => {
          if (!q) return true;
          return (
            u.displayName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.uid.toLowerCase().includes(q)
          );
        })
        .slice(0, max);
      return list;
    }

    return [];
  },

  async setUserBanned(uid: string, banned: boolean): Promise<void> {
    await loadDevProfiles();
    await setDevProfile(uid, { isBanned: banned });
  },
};
