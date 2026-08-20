import React, { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import {
  fetchPendingFeedback,
  submitBusinessFeedback,
  submitIndividualFeedback,
  type PendingFeedbackDto,
} from '@/features/feedback/feedbackApi';
import { TaskFeedbackModal } from '@/components/profile/TaskFeedbackModal';
import { useTranslation } from '@/i18n';

const refreshListeners = new Set<() => void>();

export function refreshPendingFeedbackGate(): void {
  refreshListeners.forEach((fn) => fn());
}

function subscribePendingFeedbackRefresh(fn: () => void): () => void {
  refreshListeners.add(fn);
  return () => {
    refreshListeners.delete(fn);
  };
}

export function PendingFeedbackGate() {
  const { firebaseUser, bexUser } = useAuthStore();
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingFeedbackDto[]>([]);
  const current = pending[0] ?? null;
  const isBusiness = bexUser?.role === 'business';

  const load = useCallback(async () => {
    if (!firebaseUser || !(await hasRestAuthSession())) {
      setPending([]);
      return;
    }
    if (bexUser?.role === 'admin') {
      setPending([]);
      return;
    }

    try {
      const role = isBusiness ? 'business' : 'user';
      const items = await fetchPendingFeedback(role);
      setPending(items);
    } catch {
      setPending([]);
    }
  }, [firebaseUser, bexUser?.role, isBusiness]);

  useEffect(() => {
    load();
    const unsubscribe = subscribePendingFeedbackRefresh(load);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, [load]);

  if (!current) return null;

  return (
    <TaskFeedbackModal
      visible
      required
      title={t('pendingFeedback.modalTitle', { task: current.taskTitle })}
      onClose={() => {}}
      onSubmit={async (stars, comment) => {
        if (isBusiness) {
          await submitBusinessFeedback(current.applicationId, stars, comment);
        } else {
          await submitIndividualFeedback(current.applicationId, stars, comment);
        }
        setPending((prev) =>
          prev.filter((item) => item.applicationId !== current.applicationId)
        );
        await load();
      }}
    />
  );
}
