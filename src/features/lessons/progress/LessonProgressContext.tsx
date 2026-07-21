import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { LessonPerformanceRating, LessonProgress } from '../../../domain/models';
import { useOnboarding } from '../../onboarding/OnboardingContext';
import { lessonProgressInitializationService, lessonSessionCompletionService } from './lessonProgressServices';

type LessonProgressContextValue = {
  records: readonly LessonProgress[];
  loading: boolean;
  error: string | null;
  completeLesson: (lessonId: string, rating: LessonPerformanceRating) => Promise<void>;
};

const LessonProgressContext = createContext<LessonProgressContextValue | undefined>(undefined);

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

  const completeLesson = useCallback(async (lessonId: string, rating: LessonPerformanceRating) => {
    if (status?.state !== 'complete') return;
    setError(null);
    try {
      const result = await lessonSessionCompletionService.complete(lessonId, status.dog.id, rating);
      setRecords(result.progress);
    } catch {
      setError('This training session could not be saved. Please try again.');
    }
  }, [status]);

  const value = useMemo(() => ({ records, loading, error, completeLesson }), [completeLesson, error, loading, records]);
  return <LessonProgressContext.Provider value={value}>{children}</LessonProgressContext.Provider>;
}

export function useLessonProgress(): LessonProgressContextValue {
  const value = useContext(LessonProgressContext);
  if (!value) throw new Error('useLessonProgress must be used within LessonProgressProvider');
  return value;
}
