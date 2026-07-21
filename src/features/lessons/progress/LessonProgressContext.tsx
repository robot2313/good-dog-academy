import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { LessonProgress } from '../../../domain/models';
import { domainRepositories } from '../../../services/domainRepositories';
import { useOnboarding } from '../../onboarding/OnboardingContext';
import { loadBundledLessonCatalogue } from '../catalogue';
import { LessonUnlockService } from './LessonUnlockService';
import { lessonProgressInitializationService } from './lessonProgressServices';

type LessonProgressContextValue = {
  records: readonly LessonProgress[];
  loading: boolean;
  error: string | null;
  completeLesson: (lessonId: string) => Promise<void>;
};

const LessonProgressContext = createContext<LessonProgressContextValue | undefined>(undefined);
const catalogue = loadBundledLessonCatalogue();

export function LessonProgressProvider({ children }: PropsWithChildren): React.JSX.Element {
  const { status } = useOnboarding();
  const [records, setRecords] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status?.state !== 'complete') { setRecords([]); return; }
    setLoading(true);
    setError(null);
    void lessonProgressInitializationService.initialize(status.owner.id, status.dog.id)
      .then(setRecords)
      .catch(() => setError('Training progress could not be loaded. Please try again.'))
      .finally(() => setLoading(false));
  }, [status]);

  const completeLesson = useCallback(async (lessonId: string) => {
    const current = records.find((record) => record.lessonId === lessonId);
    if (!current || current.status === 'locked') return;
    const now = new Date().toISOString();
    const completedRecord: LessonProgress = {
      ...current,
      attempts: current.attempts + 1,
      successfulCompletions: current.successfulCompletions + 1,
      lastAttemptedAt: now,
      lastCompletedAt: now,
      updatedAt: now,
    };
    const nextRecords = records.map((record) => record.id === current.id ? completedRecord : record);
    const statuses = new LessonUnlockService(catalogue).determineStatuses(nextRecords);
    const updated = nextRecords.map((record) => {
      const nextStatus = statuses.get(record.lessonId) ?? record.status;
      return { ...record, status: nextStatus, unlockedAt: nextStatus === 'locked' ? null : record.unlockedAt ?? now, updatedAt: now };
    });
    for (const record of updated) await domainRepositories.lessonProgress.save(record);
    setRecords(updated);
  }, [records]);

  const value = useMemo(() => ({ records, loading, error, completeLesson }), [completeLesson, error, loading, records]);
  return <LessonProgressContext.Provider value={value}>{children}</LessonProgressContext.Provider>;
}

export function useLessonProgress(): LessonProgressContextValue {
  const value = useContext(LessonProgressContext);
  if (!value) throw new Error('useLessonProgress must be used within LessonProgressProvider');
  return value;
}
