import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { shouldUseDemoData } from '../../lib/devMode';
import { COLLECTIONS, Task, TaskCategory, TaskDifficulty, Business, CreateBusiness, CreateTask } from '../../types';
import { matchesSearch } from '../../lib/taskUtils';
import {
  DEMO_TASKS,
  DEMO_BUSINESSES,
  enrichTasksWithBusiness,
  getDemoBusinessName,
} from '../../lib/demoData';
import { demoStore } from '../../lib/demoStore';
import { notifyAdmins } from '../notifications/notificationsRepository';

export type EnrichedTask = Task & { businessName: string; businessVerified?: boolean };

async function enrichTasks(tasks: Task[]): Promise<EnrichedTask[]> {
  if (shouldUseDemoData()) {
    return enrichTasksWithBusiness(tasks, demoStore.getBusinesses());
  }

  const cache = new Map<string, { name: string; isVerified: boolean }>();
  const result: EnrichedTask[] = [];

  for (const task of tasks) {
    if (!cache.has(task.businessId)) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.BUSINESSES, task.businessId));
        if (snap.exists()) {
          const biz = snap.data() as Business;
          cache.set(task.businessId, { name: biz.name, isVerified: biz.isVerified });
        } else {
          cache.set(task.businessId, {
            name: getDemoBusinessName(task.businessId),
            isVerified: false,
          });
        }
      } catch {
        cache.set(task.businessId, {
          name: getDemoBusinessName(task.businessId),
          isVerified: false,
        });
      }
    }
    const biz = cache.get(task.businessId)!;
    result.push({
      ...task,
      businessName: biz.name,
      businessVerified: biz.isVerified,
    });
  }
  return result;
}

export const tasksRepository = {
  async getById(id: string): Promise<Task | null> {
    if (shouldUseDemoData()) {
      return demoStore.getTaskById(id) ?? DEMO_TASKS.find((t) => t.id === id) ?? null;
    }
    if (id.startsWith('demo-')) {
      return demoStore.getTaskById(id) ?? DEMO_TASKS.find((t) => t.id === id) ?? null;
    }
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.TASKS, id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as Task) : null;
    } catch {
      return demoStore.getTaskById(id) ?? DEMO_TASKS.find((t) => t.id === id) ?? null;
    }
  },

  async getFeatured(limitCount = 5): Promise<EnrichedTask[]> {
    if (shouldUseDemoData()) {
      return enrichTasksWithBusiness(
        demoStore.getFeaturedTasks(limitCount),
        demoStore.getBusinesses()
      );
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('status', '==', 'active'),
        where('approvedByAdmin', '==', true),
        where('featured', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('empty');
      const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
      return enrichTasks(tasks);
    } catch {
      return enrichTasksWithBusiness(
        demoStore.getFeaturedTasks(limitCount),
        demoStore.getBusinesses()
      );
    }
  },

  async getActive(
    pageSize = 10,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ tasks: EnrichedTask[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    if (shouldUseDemoData()) {
      const visible = demoStore.getVisibleTasks();
      return {
        tasks: enrichTasksWithBusiness(visible, demoStore.getBusinesses()),
        lastDoc: null,
      };
    }
    try {
      let q = query(
        collection(db, COLLECTIONS.TASKS),
        where('status', '==', 'active'),
        where('approvedByAdmin', '==', true),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
      if (lastDoc) {
        q = query(
          collection(db, COLLECTIONS.TASKS),
          where('status', '==', 'active'),
          where('approvedByAdmin', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }
      const snap = await getDocs(q);
      if (snap.empty && !lastDoc) throw new Error('empty');
      const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
      const enriched = await enrichTasks(tasks);
      const newLast = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      return { tasks: enriched, lastDoc: newLast };
    } catch {
      const visible = demoStore.getVisibleTasks();
      return {
        tasks: enrichTasksWithBusiness(visible, demoStore.getBusinesses()),
        lastDoc: null,
      };
    }
  },

  async search(
    searchTerm: string,
    category: TaskCategory | null,
    difficulty: TaskDifficulty | null
  ): Promise<EnrichedTask[]> {
    const { tasks } = await this.getActive(50);
    return tasks.filter((t) => {
      if (category && t.category !== category) return false;
      if (difficulty && t.difficulty !== difficulty) return false;
      if (!matchesSearch(t.title, t.description, searchTerm)) return false;
      return true;
    });
  },

  async getEnrichedById(id: string): Promise<EnrichedTask | null> {
    const task = await this.getById(id);
    if (!task) return null;
    if (shouldUseDemoData() || id.startsWith('demo-')) {
      return enrichTasksWithBusiness([task], demoStore.getBusinesses())[0] ?? null;
    }
    const enriched = await enrichTasks([task]);
    return enriched[0] ?? null;
  },

  async getSimilar(task: Task, limitCount = 3): Promise<EnrichedTask[]> {
    const { tasks } = await this.getActive(20);
    return tasks
      .filter((t) => t.id !== task.id && t.category === task.category)
      .slice(0, limitCount);
  },

  async getByBusiness(businessId: string): Promise<Task[]> {
    if (shouldUseDemoData()) {
      return demoStore.getTasksByBusiness(businessId);
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
    } catch {
      return demoStore.getTasksByBusiness(businessId);
    }
  },

  async getPublicActiveByBusiness(businessId: string): Promise<EnrichedTask[]> {
    const tasks = await this.getByBusiness(businessId);
    const publicTasks = tasks.filter(
      (t) => t.status === 'active' && t.approvedByAdmin
    );
    return enrichTasks(publicTasks);
  },

  async create(businessId: string, data: CreateTask): Promise<string> {
    if (shouldUseDemoData()) {
      const task = demoStore.createTask(businessId, data);
      await notifyAdmins({
        title: 'Yeni görev onayı bekliyor',
        body: `"${data.title}" admin moderasyonuna düştü.`,
        type: 'general',
        data: { taskId: task.id },
      });
      return task.id;
    }
    const ref = await addDoc(collection(db, COLLECTIONS.TASKS), {
      ...data,
      businessId,
      currentApplicantCount: 0,
      approvedByAdmin: false,
      createdAt: serverTimestamp(),
    });
    await notifyAdmins({
      title: 'Yeni görev onayı bekliyor',
      body: `"${data.title}" admin moderasyonuna düştü.`,
      type: 'general',
      data: { taskId: ref.id },
    });
    return ref.id;
  },

  async update(
    taskId: string,
    businessId: string,
    data: Partial<Omit<Task, 'id' | 'businessId' | 'createdAt' | 'currentApplicantCount'>>
  ): Promise<void> {
    if (shouldUseDemoData()) {
      const task = demoStore.getTaskById(taskId);
      if (!task || task.businessId !== businessId) {
        throw new Error('Görev bulunamadı');
      }
      if (task.approvedByAdmin) {
        throw new Error('Onaylanmış görev düzenlenemez');
      }
      demoStore.updateTask(taskId, data);
      return;
    }
    const task = await this.getById(taskId);
    if (!task || task.businessId !== businessId) {
      throw new Error('Görev bulunamadı');
    }
    if (task.approvedByAdmin) {
      throw new Error('Onaylanmış görev düzenlenemez');
    }
    await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), data);
  },

  async setStatus(
    taskId: string,
    businessId: string,
    status: Task['status']
  ): Promise<void> {
    if (shouldUseDemoData()) {
      const task = demoStore.getTaskById(taskId);
      if (!task || task.businessId !== businessId) {
        throw new Error('Görev bulunamadı');
      }
      if (!task.approvedByAdmin && status !== 'active') {
        throw new Error('Onay bekleyen görev duraklatılamaz');
      }
      demoStore.updateTask(taskId, { status });
      return;
    }
    const task = await this.getById(taskId);
    if (!task || task.businessId !== businessId) {
      throw new Error('Görev bulunamadı');
    }
    if (!task.approvedByAdmin && status !== 'active') {
      throw new Error('Onay bekleyen görev duraklatılamaz');
    }
    await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), { status });
  },
};

export const businessesRepository = {
  async getById(id: string): Promise<Business | null> {
    if (shouldUseDemoData()) {
      return (
        demoStore.getBusinessById(id) ??
        DEMO_BUSINESSES.find((b) => b.id === id) ??
        null
      );
    }
    if (id.startsWith('demo-')) {
      return (
        demoStore.getBusinessById(id) ??
        DEMO_BUSINESSES.find((b) => b.id === id) ??
        null
      );
    }
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.BUSINESSES, id));
      if (!snap.exists()) return null;
      const data = snap.data() as Omit<Business, 'id'>;
      return {
        id: snap.id,
        ...data,
        verificationStatus: data.verificationStatus ?? 'none',
      };
    } catch {
      return DEMO_BUSINESSES.find((b) => b.id === id) ?? null;
    }
  },

  async getPopular(limitCount = 10): Promise<Business[]> {
    if (shouldUseDemoData()) {
      return [...demoStore.getBusinesses()]
        .sort((a, b) => b.reputationScore - a.reputationScore)
        .slice(0, limitCount);
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.BUSINESSES),
        where('isVerified', '==', true),
        orderBy('reputationScore', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('empty');
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Business);
    } catch {
      return DEMO_BUSINESSES;
    }
  },

  async getByOwner(ownerUid: string): Promise<Business | null> {
    if (shouldUseDemoData()) {
      return demoStore.getBusinessByOwner(ownerUid);
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.BUSINESSES),
        where('ownerUid', '==', ownerUid),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Business;
    } catch {
      return demoStore.getBusinessByOwner(ownerUid);
    }
  },

  async create(data: CreateBusiness): Promise<string> {
    if (shouldUseDemoData()) {
      const business = demoStore.createBusiness(data.ownerUid, data);
      return business.id;
    }
    const ref = await addDoc(collection(db, COLLECTIONS.BUSINESSES), {
      ...data,
      isVerified: false,
      verificationStatus: 'none',
      reputationScore: 0,
      totalTasksPublished: 0,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Business, 'id' | 'createdAt'>>) {
    await updateDoc(doc(db, COLLECTIONS.BUSINESSES, id), data);
  },
};
