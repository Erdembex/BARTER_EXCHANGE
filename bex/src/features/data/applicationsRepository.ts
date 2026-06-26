import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { shouldUseDemoData } from '../../lib/devMode';
import { demoStore } from '../../lib/demoStore';
import {
  COLLECTIONS,
  Application,
  ApplicationStatus,
  CreateApplication,
  Coupon,
  Task,
} from '../../types';
import { tasksRepository } from './businessesRepository';
import { usersRepository } from './usersRepository';
import { notifyUser, notifyAdmins } from '../notifications/notificationsRepository';

export const applicationsRepository = {
  async getById(id: string): Promise<Application | null> {
    if (shouldUseDemoData()) {
      return demoStore.getApplications().find((a) => a.id === id) ?? null;
    }
    const snap = await getDoc(doc(db, COLLECTIONS.APPLICATIONS, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Application) : null;
  },

  async getByUser(userId: string, status?: ApplicationStatus): Promise<Application[]> {
    if (shouldUseDemoData()) {
      let apps = demoStore.getApplications().filter((a) => a.userId === userId);
      if (status) apps = apps.filter((a) => a.status === status);
      return apps.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    }
    let q = query(
      collection(db, COLLECTIONS.APPLICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    if (status) {
      q = query(
        collection(db, COLLECTIONS.APPLICATIONS),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Application);
  },

  async getActiveByUser(userId: string): Promise<Application[]> {
    if (shouldUseDemoData()) {
      return demoStore
        .getApplications()
        .filter(
          (a) =>
            a.userId === userId &&
            ['pending', 'approved', 'submitted', 'submission_approved'].includes(a.status)
        );
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.APPLICATIONS),
        where('userId', '==', userId),
        where('status', 'in', ['pending', 'approved', 'submitted', 'submission_approved']),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Application);
    } catch {
      return [];
    }
  },

  async getByUserAndTask(userId: string, taskId: string): Promise<Application | null> {
    const inactive: ApplicationStatus[] = ['rejected', 'cancelled'];
    if (shouldUseDemoData()) {
      return (
        demoStore
          .getApplications()
          .find(
            (a) =>
              a.userId === userId &&
              a.taskId === taskId &&
              !inactive.includes(a.status)
          ) ?? null
      );
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.APPLICATIONS),
        where('userId', '==', userId),
        where('taskId', '==', taskId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      const app = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Application)
        .find((a) => !inactive.includes(a.status));
      return app ?? null;
    } catch {
      return null;
    }
  },

  async getByBusiness(businessId: string): Promise<Application[]> {
    if (shouldUseDemoData()) {
      return demoStore.getApplicationsByBusiness(businessId);
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.APPLICATIONS),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Application);
    } catch {
      return demoStore.getApplicationsByBusiness(businessId);
    }
  },

  async create(userId: string, data: CreateApplication): Promise<string> {
    const existing = await this.getByUserAndTask(userId, data.taskId);
    if (existing) {
      throw Object.assign(new Error('Bu göreve zaten başvurdun.'), { code: 'already-applied' });
    }

    if (shouldUseDemoData()) {
      const id = `demo-a${Date.now()}`;
      const app: Application = {
        id,
        ...data,
        userId,
        status: 'pending',
        submissionText: '',
        submissionFiles: [],
        createdAt: Timestamp.now(),
      };
      demoStore.addApplication(app);
      demoStore.incrementTaskApplicantCount(data.taskId);

      const business = demoStore.getBusinessById(data.businessId);
      if (business?.ownerUid) {
        await notifyUser({
          userId: business.ownerUid,
          title: 'Yeni başvuru',
          body: 'Görevine yeni bir başvuru geldi. İncelemen bekleniyor.',
          type: 'general',
          data: { applicationId: id, taskId: data.taskId },
          showLocalForUserId: business.ownerUid,
        });
      }

      return id;
    }
    const ref = await addDoc(collection(db, COLLECTIONS.APPLICATIONS), {
      ...data,
      userId,
      status: 'pending' as ApplicationStatus,
      submissionText: '',
      submissionFiles: [],
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async submit(id: string, submissionText: string, submissionFiles: string[]) {
    if (shouldUseDemoData()) {
      demoStore.updateApplication(id, {
        status: 'submitted',
        submissionText,
        submissionFiles,
        submittedAt: Timestamp.now(),
      });
      const app = demoStore.getApplications().find((a) => a.id === id);
      if (app) {
        await notifyUser({
          userId: app.userId,
          title: 'Teslimin alındı',
          body: 'Admin ekibimiz içeriği inceliyor. Uygunsuz içerik kontrolünden sonra süreç devam eder.',
          type: 'general',
          data: { applicationId: id },
          showLocalForUserId: app.userId,
        });
        await notifyAdmins({
          title: 'Yeni teslim incelemesi',
          body: 'Kullanıcı görev teslimi yükledi. Moderasyon bekliyor.',
          type: 'general',
          data: { applicationId: id },
        });
      }
      return;
    }
    await updateDoc(doc(db, COLLECTIONS.APPLICATIONS, id), {
      status: 'submitted',
      submissionText,
      submissionFiles,
      submittedAt: serverTimestamp(),
    });
  },

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    reviewNote?: string
  ) {
    if (shouldUseDemoData()) {
      demoStore.updateApplication(id, {
        status,
        reviewNote: reviewNote ?? '',
        reviewedAt: Timestamp.now(),
      });
      return;
    }
    await updateDoc(doc(db, COLLECTIONS.APPLICATIONS, id), {
      status,
      reviewNote: reviewNote ?? '',
      reviewedAt: serverTimestamp(),
    });
  },

  async cancel(id: string, userId: string): Promise<boolean> {
    const application = await this.getById(id);
    if (!application) return false;
    if (application.userId !== userId) return false;
    if (!['pending', 'approved'].includes(application.status)) return false;

    await this.updateStatus(id, 'cancelled');
    return true;
  },
};

function generateCouponCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BEX-${part()}-${part()}`;
}

export const couponsRepository = {
  async getById(id: string): Promise<Coupon | null> {
    if (shouldUseDemoData()) {
      return demoStore.getCoupons().find((c) => c.id === id) ?? null;
    }
    const snap = await getDoc(doc(db, COLLECTIONS.COUPONS, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Coupon) : null;
  },

  async getByApplicationId(applicationId: string): Promise<Coupon | null> {
    if (shouldUseDemoData()) {
      return demoStore.getCoupons().find((c) => c.applicationId === applicationId) ?? null;
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.COUPONS),
        where('applicationId', '==', applicationId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Coupon;
    } catch {
      return demoStore.getCoupons().find((c) => c.applicationId === applicationId) ?? null;
    }
  },

  async getByCode(code: string): Promise<Coupon | null> {
    const normalized = code.trim().toUpperCase();
    if (shouldUseDemoData()) {
      return demoStore.getCouponByCode(normalized);
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.COUPONS),
        where('couponCode', '==', normalized),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Coupon;
    } catch {
      return demoStore.getCouponByCode(normalized);
    }
  },

  async getByUser(userId: string, status?: Coupon['status']): Promise<Coupon[]> {
    if (shouldUseDemoData()) {
      let list = demoStore.getCoupons().filter((c) => c.userId === userId);
      if (status) list = list.filter((c) => c.status === status);
      return list;
    }
    let q = query(
      collection(db, COLLECTIONS.COUPONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    if (status) {
      q = query(
        collection(db, COLLECTIONS.COUPONS),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Coupon);
  },

  async getActiveByUser(userId: string): Promise<Coupon[]> {
    return this.getByUser(userId, 'active');
  },

  async getByBusiness(businessId: string): Promise<Coupon[]> {
    if (shouldUseDemoData()) {
      return demoStore.getCouponsByBusiness(businessId);
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.COUPONS),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Coupon);
    } catch {
      return demoStore.getCouponsByBusiness(businessId);
    }
  },

  async createFromApplication(
    application: Application,
    task: Task,
    _verifiedBy: string
  ): Promise<Coupon> {
    const couponData: Omit<Coupon, 'id'> = {
      userId: application.userId,
      businessId: application.businessId,
      taskId: application.taskId,
      applicationId: application.id,
      rewardDescription: task.rewardDescription,
      totalUses: task.rewardQuantity,
      usedCount: 0,
      qrCode: `qr-${Date.now()}`,
      couponCode: generateCouponCode(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 90 * 86400000)),
      usageHistory: [],
      status: 'active',
      createdAt: Timestamp.now(),
    };

    if (shouldUseDemoData()) {
      const coupon: Coupon = { id: `demo-c${Date.now()}`, ...couponData };
      demoStore.addCoupon(coupon);
      await applicationsRepository.updateStatus(application.id, 'rewarded');
      await usersRepository.incrementCompletedTasks(application.userId);
      return coupon;
    }

    throw new Error('Kupon yalnızca Cloud Functions ile oluşturulabilir.');
  },

  async redeem(couponId: string, scannedBy: string): Promise<Coupon | null> {
    if (shouldUseDemoData()) {
      return demoStore.redeemCoupon(couponId, scannedBy);
    }

    const { cloudFunctions } = await import('../functions/cloudFunctions');
    try {
      return await cloudFunctions.redeemCoupon(couponId);
    } catch {
      return null;
    }
  },
};

/** pending → approved (kupon yok, kullanıcı teslim edecek) */
export async function approveApplication(
  applicationId: string,
  reviewNote?: string
): Promise<boolean> {
  const application = await applicationsRepository.getById(applicationId);
  if (!application || application.status !== 'pending') return false;

  await applicationsRepository.updateStatus(applicationId, 'approved', reviewNote);

  await notifyUser({
    userId: application.userId,
    title: 'Başvurun onaylandı',
    body: 'Görevi tamamlayıp teslim edebilirsin. Başvurularım sekmesinden devam et.',
    type: 'application_approved',
    data: { applicationId },
    showLocalForUserId: application.userId,
  });

  return true;
}

/** submission_approved → rewarded + kupon (admin + işletme onayı sonrası) */
export async function issueCouponForSubmission(
  applicationId: string,
  businessOwnerUid: string,
  reviewNote?: string
): Promise<Coupon | null> {
  const application = await applicationsRepository.getById(applicationId);
  if (!application || application.status !== 'submission_approved') return null;

  if (shouldUseDemoData()) {
    const task = await tasksRepository.getById(application.taskId);
    if (!task) return null;

    const coupon = await couponsRepository.createFromApplication(
      application,
      task,
      businessOwnerUid
    );

    await notifyUser({
      userId: application.userId,
      title: 'Tebrikler! Kuponun hazır',
      body: `Görev teslimin onaylandı. Kupon kodun: ${coupon.couponCode}`,
      type: 'coupon_issued',
      data: { applicationId, couponId: coupon.id },
      showLocalForUserId: application.userId,
    });

    return coupon;
  }

  const { cloudFunctions } = await import('../functions/cloudFunctions');
  return cloudFunctions.issueCouponForSubmission(applicationId, reviewNote);
}
