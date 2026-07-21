import type { BehaviourProfile, DailyPlan, LessonProgress } from '../../domain/models';
import { createDomainRepositories } from '../../services/createDomainRepositories';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { storageKeys } from '../../storage/storageKeys';
import type { DailyPlanGenerator } from './DailyPlanGenerator';

export class DailyPlanManagementService {
  constructor(
    private readonly transactions: StorageTransactionManager,
    private readonly generator: DailyPlanGenerator,
    private readonly now: () => string,
  ) {}

  async skip(planId: string, dogId: string): Promise<DailyPlan> {
    return this.transactions.run([storageKeys.dailyPlans], async (storage) => {
      const repository = createDomainRepositories(storage).dailyPlans;
      const plan = await repository.findById(planId);
      if (!plan || plan.dogId !== dogId || plan.status === 'completed') throw new Error('Daily plan cannot be skipped.');
      const updated: DailyPlan = { ...plan, status: 'skipped', updatedAt: this.now() };
      await repository.save(updated);
      return updated;
    });
  }

  async refresh(planId: string, dogId: string, profile: BehaviourProfile, dogAgeMonths: number, progress: readonly LessonProgress[]): Promise<DailyPlan> {
    return this.transactions.run([storageKeys.dailyPlans], async (storage) => {
      const repository = createDomainRepositories(storage).dailyPlans;
      const plan = await repository.findById(planId);
      if (!plan || plan.dogId !== dogId || plan.status !== 'scheduled') throw new Error('Daily plan cannot be refreshed.');
      const alternatives = this.generator.generate(profile, dogAgeMonths, progress, plan.lessonIds.length, plan.lessonIds);
      const updated: DailyPlan = { ...plan, lessonIds: alternatives.length > 0 ? alternatives : plan.lessonIds, updatedAt: this.now() };
      await repository.save(updated);
      return updated;
    });
  }
}
