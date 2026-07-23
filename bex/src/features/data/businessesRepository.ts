import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { shouldUseDemoData } from '../../lib/devMode';
import { usesRestBackend } from '../../lib/restBackend';
import { Task, TaskCategory, TaskDifficulty, Business, CreateBusiness, CreateTask } from '../../types';
import { matchesSearch } from '../../lib/taskUtils';
import {
  DEMO_BUSINESSES,
  enrichTasksWithBusiness,
  getDemoBusinessName,
} from '../../lib/demoData';
import { demoStore } from '../../lib/demoStore';
import {
  closeListing,
  createListing,
  discoverListings,
  fetchBusinessListings,
  fetchListingDetail,
  publishListing,
  shouldUseListingsRest,
  updateListing,
} from '../listing/listingsApi';
import { isBackendId } from '@/lib/api/backendId';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import {
  fetchOwnBusinessProfile,
  fetchPublicBusinessProfile,
} from '../business/businessProfileApi';

export type EnrichedTask = Task & {
  businessName: string;
  businessVerified?: boolean;
  businessIsDangerous?: boolean;
  businessComplaintListed?: boolean;
};

function asEnriched(tasks: EnrichedTask[]): EnrichedTask[] {
  return tasks.map((task) => ({
    ...task,
    businessName: task.businessName || getDemoBusinessName(task.businessId),
    businessVerified: task.businessVerified ?? false,
  }));
}

export const tasksRepository = {
  async getById(id: string): Promise<Task | null> {
    if (shouldUseDemoData()) {
      return demoStore.getTaskById(id) ?? null;
    }

    if (isBackendId(id)) {
      try {
        const listing = await fetchListingDetail(id);
        if (listing) return listing;
      } catch {
        return null;
      }
    }

    return null;
  },

  async getFeatured(limitCount = 5): Promise<EnrichedTask[]> {
    if (await shouldUseListingsRest()) {
      try {
        const page = await discoverListings({ pageSize: limitCount });
        if (page.tasks.length > 0) return asEnriched(page.tasks);
      } catch {
        // demo yedeğine düş
      }
    }

    if (shouldUseDemoData()) {
      return enrichTasksWithBusiness(
        demoStore.getFeaturedTasks(limitCount),
        demoStore.getBusinesses()
      );
    }

    return [];
  },

  async getActive(
    pageSize = 10,
    cursor?: QueryDocumentSnapshot<DocumentData> | string | null,
    filters?: { city?: string; category?: TaskCategory | null }
  ): Promise<{
    tasks: EnrichedTask[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    nextCursor: string | null;
  }> {
    const restCursor = typeof cursor === 'string' ? cursor : undefined;

    if (await shouldUseListingsRest()) {
      try {
        const { mapCategoryToBackendSkill } = await import('../listing/listingsApi');
        const skills =
          filters?.category != null
            ? [mapCategoryToBackendSkill(filters.category)]
            : undefined;
        const page = await discoverListings({
          pageSize,
          cursor: restCursor,
          city: filters?.city?.trim() || undefined,
          skills,
        });
        return {
          tasks: asEnriched(page.tasks),
          lastDoc: null,
          nextCursor: page.nextCursor,
        };
      } catch {
        if (shouldUseDemoData()) {
          const visible = demoStore.getVisibleTasks();
          return {
            tasks: enrichTasksWithBusiness(visible, demoStore.getBusinesses()),
            lastDoc: null,
            nextCursor: null,
          };
        }
        return { tasks: [], lastDoc: null, nextCursor: null };
      }
    }

    if (shouldUseDemoData()) {
      const visible = demoStore.getVisibleTasks();
      return {
        tasks: enrichTasksWithBusiness(visible, demoStore.getBusinesses()),
        lastDoc: null,
        nextCursor: null,
      };
    }

    return { tasks: [], lastDoc: null, nextCursor: null };
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
    if (shouldUseDemoData()) {
      return enrichTasksWithBusiness([task], demoStore.getBusinesses())[0] ?? null;
    }
    return asEnriched([task as EnrichedTask])[0] ?? null;
  },

  async getSimilar(task: Task, limitCount = 3): Promise<EnrichedTask[]> {
    const { tasks } = await this.getActive(20);
    return tasks
      .filter((t) => t.id !== task.id && t.category === task.category)
      .slice(0, limitCount);
  },

  async getByBusiness(businessId: string): Promise<Task[]> {
    if (await shouldUseListingsRest()) {
      try {
        const listings = await fetchBusinessListings();
        return listings.filter(
          (listing) =>
            !businessId ||
            !listing.businessId ||
            listing.businessId === businessId ||
            isBackendId(businessId)
        );
      } catch {
        if (shouldUseDemoData()) {
          return demoStore.getTasksByBusiness(businessId);
        }
        return [];
      }
    }

    if (shouldUseDemoData()) {
      return demoStore.getTasksByBusiness(businessId);
    }

    return [];
  },

  async getPublicActiveByBusiness(businessId: string): Promise<EnrichedTask[]> {
    const tasks = await this.getByBusiness(businessId);
    return asEnriched(
      tasks.filter((t) => t.status === 'active' && t.approvedByAdmin) as EnrichedTask[]
    );
  },

  async create(businessId: string, data: CreateTask): Promise<string> {
    if (shouldUseDemoData()) {
      const task = demoStore.createTask(businessId, data);
      return task.id;
    }

    if (!(await hasRestAuthSession())) {
      throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
    }

    const listing = await createListing(data);
    return listing.id;
  },

  async publish(taskId: string): Promise<void> {
    if (shouldUseDemoData()) {
      demoStore.setTaskAdminApproval(taskId, true);
      demoStore.updateTask(taskId, { status: 'active' });
      return;
    }

    throw new Error('Görev yayınlama yalnızca admin onayı ile yapılır.');
  },

  async createAndPublish(businessId: string, data: CreateTask): Promise<string> {
    const id = await this.create(businessId, data);
    if (shouldUseDemoData()) {
      demoStore.setTaskAdminApproval(id, true);
    }
    return id;
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
        throw new Error('Yayınlanmış görev düzenlenemez');
      }
      demoStore.updateTask(taskId, data);
      return;
    }

    const current = await this.getById(taskId);
    if (!current || current.businessId !== businessId) {
      throw new Error('Görev bulunamadı');
    }
    if (current.approvedByAdmin) {
      throw new Error('Yayınlanmış görev düzenlenemez');
    }

    const merged: CreateTask = {
      businessId,
      title: data.title ?? current.title,
      description: data.description ?? current.description,
      category: data.category ?? current.category,
      difficulty: data.difficulty ?? current.difficulty,
      estimatedHours: data.estimatedHours ?? current.estimatedHours,
      rewardDescription: data.rewardDescription ?? current.rewardDescription,
      rewardQuantity: data.rewardQuantity ?? current.rewardQuantity,
      maxApplicants: data.maxApplicants ?? current.maxApplicants,
      status: data.status ?? current.status,
      location: data.location ?? current.location,
      deadline: data.deadline ?? current.deadline,
    };

    await updateListing(taskId, merged);
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
      if (task.status === 'draft' && status === 'paused') {
        throw new Error('Taslak görev duraklatılamaz.');
      }
      if (task.status === 'draft' && status === 'active') {
        demoStore.setTaskAdminApproval(taskId, true);
      }
      demoStore.updateTask(taskId, { status });
      return;
    }

    const task = await this.getById(taskId);
    if (!task || task.businessId !== businessId) {
      throw new Error('Görev bulunamadı');
    }

    if (task.status === 'draft' && status === 'active') {
      await publishListing(taskId);
      return;
    }

    if (status === 'paused' || status === 'completed') {
      await closeListing(taskId);
      return;
    }

    throw new Error('Bu durum değişikliği desteklenmiyor.');
  },
};

export const businessesRepository = {
  async getById(id: string): Promise<Business | null> {
    if (shouldUseDemoData()) {
      return demoStore.getBusinessById(id) ?? DEMO_BUSINESSES.find((b) => b.id === id) ?? null;
    }

    if ((await hasRestAuthSession()) && isBackendId(id)) {
      try {
        return await fetchPublicBusinessProfile(id);
      } catch {
        return null;
      }
    }

    return null;
  },

  async getPopular(limitCount = 10): Promise<Business[]> {
    if (shouldUseDemoData()) {
      return [...demoStore.getBusinesses()]
        .sort((a, b) => b.reputationScore - a.reputationScore)
        .slice(0, limitCount);
    }
    return [];
  },

  async getByOwner(ownerUid: string): Promise<Business | null> {
    if (await hasRestAuthSession()) {
      try {
        return await fetchOwnBusinessProfile(ownerUid);
      } catch {
        return null;
      }
    }

    if (shouldUseDemoData()) {
      return demoStore.getBusinessByOwner(ownerUid);
    }
    return null;
  },

  async create(data: CreateBusiness): Promise<string> {
    if (shouldUseDemoData()) {
      const business = demoStore.createBusiness(data.ownerUid, data);
      return business.id;
    }
    throw new Error('İşletme kaydı REST üzerinden yapılır.');
  },

  async update(_id: string, _data: Partial<Omit<Business, 'id' | 'createdAt'>>) {
    if (shouldUseDemoData()) {
      demoStore.updateBusiness(_id, _data);
      return;
    }
    throw new Error('İşletme profili REST üzerinden güncellenir.');
  },
};
