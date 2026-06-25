import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { DEMO_BUSINESSES, DEMO_TASKS } from '@/lib/demoData';
import { db } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { COLLECTIONS, Business, Task, Application } from '@/types';
import { enrichTasksWithBusiness, getDemoBusinessName } from '@/lib/demoData';
import type { EnrichedTask } from '@/features/data/businessesRepository';
import { notifyUser } from '@/features/notifications/notificationsRepository';

async function notifyBusinessOwner(
  businessId: string,
  title: string,
  body: string,
  type: 'task_approved' | 'kyc_result' | 'general',
  data?: Record<string, string>
) {
  const business = shouldUseDemoData()
    ? demoStore.getBusinesses().find((b) => b.id === businessId)
    : (await getDoc(doc(db, COLLECTIONS.BUSINESSES, businessId))).data() as
        | Business
        | undefined;

  if (!business?.ownerUid) return;

  await notifyUser({
    userId: business.ownerUid,
    title,
    body,
    type,
    data,
    showLocalForUserId: business.ownerUid,
  });
}

export type EnrichedSubmission = Application & {
  taskTitle: string;
  businessName: string;
};

function enrichSubmissions(apps: Application[]): EnrichedSubmission[] {
  if (shouldUseDemoData()) {
    const tasks = demoStore.getTasks();
    const businesses = demoStore.getBusinesses();
    return apps.map((app) => ({
      ...app,
      taskTitle: tasks.find((t) => t.id === app.taskId)?.title ?? 'Görev',
      businessName: businesses.find((b) => b.id === app.businessId)?.name ?? 'İşletme',
    }));
  }
  return apps.map((app) => ({
    ...app,
    taskTitle: 'Görev',
    businessName: getDemoBusinessName(app.businessId),
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
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('status', '==', 'active'),
        where('approvedByAdmin', '==', false),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
      return list.map((t) => ({
        ...t,
        businessName: getDemoBusinessName(t.businessId),
      }));
    } catch {
      return enrichTasksWithBusiness(
        demoStore.getPendingAdminTasks(),
        demoStore.getBusinesses()
      );
    }
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
    await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), {
      approvedByAdmin: true,
    });
  },

  async rejectTask(taskId: string): Promise<void> {
    if (shouldUseDemoData()) {
      demoStore.setTaskAdminApproval(taskId, false);
      return;
    }
    await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), {
      status: 'paused',
      approvedByAdmin: false,
    });
  },

  async getPendingVerifications(): Promise<Business[]> {
    if (shouldUseDemoData()) {
      return demoStore.getPendingVerifications();
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.BUSINESSES),
        where('verificationStatus', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        verificationStatus: (d.data() as Business).verificationStatus ?? 'none',
      })) as Business[];
    } catch {
      return demoStore.getPendingVerifications();
    }
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
    await updateDoc(doc(db, COLLECTIONS.BUSINESSES, businessId), {
      verificationStatus: 'verified',
      isVerified: true,
    });
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
    await updateDoc(doc(db, COLLECTIONS.BUSINESSES, businessId), {
      verificationStatus: 'rejected',
      isVerified: false,
    });
  },

  async getPendingSubmissions(): Promise<EnrichedSubmission[]> {
    if (shouldUseDemoData()) {
      return enrichSubmissions(demoStore.getPendingSubmissions());
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.APPLICATIONS),
        where('status', '==', 'submitted'),
        orderBy('submittedAt', 'desc')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Application);
      return enrichSubmissions(list);
    } catch {
      return enrichSubmissions(demoStore.getPendingSubmissions());
    }
  },

  async approveSubmission(applicationId: string, reviewNote?: string): Promise<void> {
    let app: Application | null = null;

    if (shouldUseDemoData()) {
      app = demoStore.getApplications().find((a) => a.id === applicationId) ?? null;
    } else {
      const snap = await getDoc(doc(db, COLLECTIONS.APPLICATIONS, applicationId));
      app = snap.exists() ? ({ id: snap.id, ...snap.data() } as Application) : null;
    }

    if (!app || app.status !== 'submitted') return;

    if (shouldUseDemoData()) {
      demoStore.updateApplication(applicationId, {
        status: 'submission_approved',
        reviewNote: reviewNote ?? '',
        reviewedAt: Timestamp.now(),
      });
    } else {
      await updateDoc(doc(db, COLLECTIONS.APPLICATIONS, applicationId), {
        status: 'submission_approved',
        reviewNote: reviewNote ?? '',
        reviewedAt: serverTimestamp(),
      });
    }

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
      body: 'Admin içeriği onayladı. İşletme kuponunu oluşturduğunda bildirim alacaksın.',
      type: 'general',
      data: { applicationId },
      showLocalForUserId: app.userId,
    });
  },

  async rejectSubmission(applicationId: string, reviewNote: string): Promise<void> {
    const note = reviewNote.trim() || 'İçerik uygunsuz. Lütfen düzeltip tekrar teslim et.';

    let app: Application | null = null;

    if (shouldUseDemoData()) {
      app = demoStore.getApplications().find((a) => a.id === applicationId) ?? null;
    } else {
      const snap = await getDoc(doc(db, COLLECTIONS.APPLICATIONS, applicationId));
      app = snap.exists() ? ({ id: snap.id, ...snap.data() } as Application) : null;
    }

    if (!app || app.status !== 'submitted') return;

    if (shouldUseDemoData()) {
      demoStore.updateApplication(applicationId, {
        status: 'approved',
        reviewNote: note,
        reviewedAt: Timestamp.now(),
      });
    } else {
      await updateDoc(doc(db, COLLECTIONS.APPLICATIONS, applicationId), {
        status: 'approved',
        reviewNote: note,
        reviewedAt: serverTimestamp(),
      });
    }

    await notifyUser({
      userId: app.userId,
      title: 'Teslimin reddedildi',
      body: note,
      type: 'general',
      data: { applicationId },
      showLocalForUserId: app.userId,
    });
  },

  /** Canlı Firestore boşsa demo işletme + görev yükler (admin). */
  async seedLiveCatalog(): Promise<{ businesses: number; tasks: number }> {
    if (shouldUseDemoData()) {
      throw new Error('demo-mode');
    }

    const existing = await getDocs(
      query(collection(db, COLLECTIONS.TASKS), limit(1))
    );
    if (!existing.empty) {
      throw new Error('already-seeded');
    }

    const batch = writeBatch(db);

    for (const business of DEMO_BUSINESSES) {
      const { id, ...data } = business;
      batch.set(doc(db, COLLECTIONS.BUSINESSES, id), data);
    }

    for (const task of DEMO_TASKS) {
      const { id, ...data } = task;
      batch.set(doc(db, COLLECTIONS.TASKS, id), data);
    }

    await batch.commit();
    return { businesses: DEMO_BUSINESSES.length, tasks: DEMO_TASKS.length };
  },
};
