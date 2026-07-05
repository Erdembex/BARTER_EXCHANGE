import { shouldUseDemoData } from '@/lib/devMode';
import { Timestamp } from 'firebase/firestore';
import { getDevProfile, loadDevProfiles, setDevProfile } from '@/lib/devProfileStore';
import { demoStore } from '@/lib/demoStore';
import { tasksRepository } from '@/features/data/businessesRepository';
import { Application, PortfolioItem } from '@/types';
import { isPortfolioImageUrl, PORTFOLIO_APPROVED_STATUSES } from '@/lib/portfolioUtils';

function mergePortfolioItems(
  existing: PortfolioItem[],
  incoming: PortfolioItem[]
): PortfolioItem[] {
  const seen = new Set(existing.map((item) => item.imageUrl));
  const merged = [...existing];
  for (const item of incoming) {
    if (seen.has(item.imageUrl)) continue;
    seen.add(item.imageUrl);
    merged.push(item);
  }
  return merged.sort((a, b) => b.approvedAt.toMillis() - a.approvedAt.toMillis());
}

async function derivePortfolioFromApplications(userId: string): Promise<PortfolioItem[]> {
  const apps = demoStore
    .getApplications()
    .filter(
      (a) =>
        a.userId === userId &&
        PORTFOLIO_APPROVED_STATUSES.includes(
          a.status as (typeof PORTFOLIO_APPROVED_STATUSES)[number]
        )
    );

  const items: PortfolioItem[] = [];

  for (const app of apps) {
    const task = await tasksRepository.getById(app.taskId);
    const taskTitle = task?.title ?? 'Görev';
    const approvedAt = app.reviewedAt ?? app.submittedAt ?? app.createdAt;

    app.submissionFiles.filter(isPortfolioImageUrl).forEach((imageUrl, index) => {
      items.push({
        id: `${app.id}-${index}`,
        imageUrl,
        taskTitle,
        applicationId: app.id,
        approvedAt,
      });
    });
  }

  return mergePortfolioItems([], items);
}

export async function buildPortfolioItemsFromApplication(
  application: Application,
  taskTitle: string
): Promise<PortfolioItem[]> {
  const approvedAt = Timestamp.now();
  return application.submissionFiles.filter(isPortfolioImageUrl).map((imageUrl, index) => ({
    id: `${application.id}-${index}`,
    imageUrl,
    taskTitle,
    applicationId: application.id,
    approvedAt,
  }));
}

export async function appendApprovedWorkToPortfolio(
  userId: string,
  application: Application,
  taskTitle: string
): Promise<void> {
  const incoming = await buildPortfolioItemsFromApplication(application, taskTitle);
  if (incoming.length === 0) return;

  await loadDevProfiles();
  const existing = getDevProfile(userId)?.portfolioItems ?? [];
  const merged = mergePortfolioItems(existing, incoming);
  await setDevProfile(userId, { portfolioItems: merged });
}

export async function getUserPortfolio(userId: string): Promise<PortfolioItem[]> {
  await loadDevProfiles();
  const stored = getDevProfile(userId)?.portfolioItems;
  if (stored?.length) return stored;

  if (shouldUseDemoData()) {
    const derived = await derivePortfolioFromApplications(userId);
    if (derived.length > 0) {
      await setDevProfile(userId, { portfolioItems: derived });
    }
    return derived;
  }

  const backfilled = await backfillPortfolioFromUserApplications(userId);
  return backfilled;
}

async function backfillPortfolioFromUserApplications(userId: string): Promise<PortfolioItem[]> {
  const { applicationsRepository } = await import('@/features/data/applicationsRepository');
  const apps = await applicationsRepository.getByUser(userId);
  const approved = apps.filter((a) =>
    PORTFOLIO_APPROVED_STATUSES.includes(
      a.status as (typeof PORTFOLIO_APPROVED_STATUSES)[number]
    )
  );

  if (approved.length === 0) return [];

  const items: PortfolioItem[] = [];
  for (const app of approved) {
    const task = await tasksRepository.getById(app.taskId);
    const taskTitle = task?.title ?? 'Görev';
    const approvedAt = app.reviewedAt ?? app.submittedAt ?? app.createdAt;
    app.submissionFiles.filter(isPortfolioImageUrl).forEach((imageUrl, index) => {
      items.push({
        id: `${app.id}-${index}`,
        imageUrl,
        taskTitle,
        applicationId: app.id,
        approvedAt,
      });
    });
  }

  const merged = mergePortfolioItems([], items);
  if (merged.length === 0) return [];

  await setDevProfile(userId, { portfolioItems: merged });
  return merged;
}
