import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import type { DailyPlan } from '../../domain/models';
import { domainRepositories } from '../../services/domainRepositories';
import { createLocalId } from '../../utils/ids';
import { useLessonProgress } from '../lessons/progress/LessonProgressContext';
import { loadBundledLessonCatalogue } from '../lessons/catalogue';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { DailyPlanGenerator, dogAgeInMonths } from './DailyPlanGenerator';

type DailyPlanContextValue = { plan: DailyPlan | null; loading: boolean; error: string | null };
const DailyPlanContext = createContext<DailyPlanContextValue | undefined>(undefined);
const generator = new DailyPlanGenerator(loadBundledLessonCatalogue());

export function DailyPlanProvider({ children }: PropsWithChildren): React.JSX.Element {
  const { status } = useOnboarding();
  const { records, loading: progressLoading } = useLessonProgress();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status?.state !== 'complete' || progressLoading || records.length === 0) { setPlan(null); return; }
    let active = true;
    setLoading(true);
    setError(null);
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    void domainRepositories.dailyPlans.findAll().then(async (plans) => {
      const existing = plans.find((candidate) => candidate.dogId === status.dog.id && candidate.date === date);
      if (existing) return existing;
      const timestamp = now.toISOString();
      const created: DailyPlan = {
        id: createLocalId('daily-plan'),
        dogId: status.dog.id,
        date,
        lessonIds: generator.generate(status.behaviourProfile, dogAgeInMonths(status.dog.dateOfBirth, status.dog.estimatedAgeYears, now), records),
        status: 'scheduled',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await domainRepositories.dailyPlans.save(created);
      return created;
    }).then((nextPlan) => { if (active) setPlan(nextPlan); })
      .catch(() => { if (active) setError('Today’s training plan could not be prepared.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [progressLoading, records, status]);

  const value = useMemo(() => ({ plan, loading, error }), [error, loading, plan]);
  return <DailyPlanContext.Provider value={value}>{children}</DailyPlanContext.Provider>;
}

export function useDailyPlan(): DailyPlanContextValue {
  const value = useContext(DailyPlanContext);
  if (!value) throw new Error('useDailyPlan must be used within DailyPlanProvider');
  return value;
}
