import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Achievement, LessonPerformanceRating, LessonProgress, Progress, TrainingSession } from '../../../domain/models';
import { domainRepositories } from '../../../services/domainRepositories';
import { useOnboarding } from '../../onboarding/OnboardingContext';
import { lessonProgressInitializationService, lessonSessionCompletionService } from './lessonProgressServices';

type LessonProgressContextValue = {
  records: readonly LessonProgress[];
  loading: boolean;
  error: string | null;
  sessions: readonly TrainingSession[];
  summary: Progress | null;
  achievements: readonly Achievement[];
  completeLesson: (lessonId: string, rating: LessonPerformanceRating, dailyPlanId?: string | null) => Promise<void>;
};

const LessonProgressContext = createContext<LessonProgressContextValue | undefined>(undefined);

export function LessonProgressProvider({ children }: PropsWithChildren): React.JSX.Element {
  const { status } = useOnboarding();
  const [records, setRecords] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [summary, setSummary] = useState<Progress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (status?.state !== 'complete') { setRecords([]); setSessions([]); setSummary(null); setAchievements([]); return; }
    setLoading(true);
    setError(null);
    void lessonProgressInitializationService.initialize(status.owner.id, status.dog.id)
      .then(async (nextRecords) => {
        const [allSessions, allSummaries, allAchievements] = await Promise.all([
          domainRepositories.trainingSessions.findAll(), domainRepositories.progress.findAll(), domainRepositories.achievements.findAll(),
        ]);
        setRecords(nextRecords);
        setSessions(allSessions.filter((item) => item.dogId === status.dog.id).sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)));
        setSummary(allSummaries.find((item) => item.dogId === status.dog.id) ?? null);
        setAchievements(allAchievements.filter((item) => item.dogId === status.dog.id).sort((a, b) => b.earnedAt.localeCompare(a.earnedAt)));
      })
      .catch(() => setError('Training progress could not be loaded. Please try again.'))
      .finally(() => setLoading(false));
  }, [status]);

  const completeLesson = useCallback(async (lessonId: string, rating: LessonPerformanceRating, dailyPlanId: string | null = null) => {
    if (status?.state !== 'complete') return;
    setError(null);
    try {
      const result = await lessonSessionCompletionService.complete(lessonId, status.dog.id, rating, dailyPlanId);
      setRecords(result.progress);
      setSessions((current) => [result.session, ...current]);
      setSummary(result.summary);
      setAchievements(result.achievements.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt)));
    } catch {
      setError('This training session could not be saved. Please try again.');
    }
  }, [status]);

  const value = useMemo(() => ({ records, loading, error, sessions, summary, achievements, completeLesson }), [achievements, completeLesson, error, loading, records, sessions, summary]);
  return <LessonProgressContext.Provider value={value}>{children}</LessonProgressContext.Provider>;
}

export function useLessonProgress(): LessonProgressContextValue {
  const value = useContext(LessonProgressContext);
  if (!value) throw new Error('useLessonProgress must be used within LessonProgressProvider');
  return value;
}
