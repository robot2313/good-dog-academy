import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import type { DailyPlan } from '../../domain/models';
import { domainRepositories } from '../../services/domainRepositories';
import { createLocalId } from '../../utils/ids';
import { appStorage } from '../../services/appStorage';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { useLessonProgress } from '../lessons/progress/LessonProgressContext';
import { loadBundledLessonCatalogue } from '../lessons/catalogue';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { DailyPlanGenerator, dogAgeInMonths } from './DailyPlanGenerator';
import { DailyPlanManagementService } from './DailyPlanManagementService';

type DailyPlanContextValue = { plan: DailyPlan | null; loading: boolean; saving: boolean; error: string | null; refreshPlan: () => Promise<void>; skipPlan: () => Promise<void> };
const DailyPlanContext = createContext<DailyPlanContextValue | undefined>(undefined);
const generator = new DailyPlanGenerator(loadBundledLessonCatalogue());
const management = new DailyPlanManagementService(new StorageTransactionManager(appStorage), generator, () => new Date().toISOString());

export function DailyPlanProvider({ children }: PropsWithChildren): React.JSX.Element {
  const { status } = useOnboarding();
  const { records, loading: progressLoading } = useLessonProgress();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const refreshPlan = async (): Promise<void> => {
    if (!plan || status?.state !== 'complete') return;
    setSaving(true); setError(null);
    try {
      setPlan(await management.refresh(plan.id, status.dog.id, status.behaviourProfile, dogAgeInMonths(status.dog.dateOfBirth, status.dog.estimatedAgeYears, new Date()), records));
    } catch { setError('Today’s plan could not be refreshed.'); }
    finally { setSaving(false); }
  };

  const skipPlan = async (): Promise<void> => {
    if (!plan || status?.state !== 'complete') return;
    setSaving(true); setError(null);
    try { setPlan(await management.skip(plan.id, status.dog.id)); }
    catch { setError('Today’s plan could not be skipped.'); }
    finally { setSaving(false); }
  };

  const value = useMemo(() => ({ plan, loading, saving, error, refreshPlan, skipPlan }), [error, loading, plan, saving, status, records]);
  return <DailyPlanContext.Provider value={value}>{children}</DailyPlanContext.Provider>;
}

export function useDailyPlan(): DailyPlanContextValue {
  const value = useContext(DailyPlanContext);
  if (!value) throw new Error('useDailyPlan must be used within DailyPlanProvider');
  return value;
}
