import type { BehaviourProfile, DailyPlan, LessonId, LessonProgress } from '../../domain/models';
import { createDomainRepositories } from '../../services/createDomainRepositories';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { storageKeys } from '../../storage/storageKeys';
import type { LessonCatalogue } from '../lessons/catalogue';
import { LessonEligibilityService } from '../lessons/eligibility';
import type { DailyPlanGenerator } from './DailyPlanGenerator';

function addDays(date: string, offset: number): string {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) + offset * 86_400_000).toISOString().slice(0, 10);
}

export class WeeklyPlanService {
  constructor(
    private readonly transactions: StorageTransactionManager,
    private readonly catalogue: LessonCatalogue,
    private readonly generator: DailyPlanGenerator,
    private readonly createId: (prefix: string) => string,
    private readonly now: () => string,
  ) {}

  async ensureWeek(dogId: string, profile: BehaviourProfile, dogAgeMonths: number, progress: readonly LessonProgress[], startDate: string): Promise<DailyPlan[]> {
    return this.transactions.run([storageKeys.dailyPlans], async (storage) => {
      const repository = createDomainRepositories(storage).dailyPlans;
      const allPlans = await repository.findAll();
      const byDate = new Map(allPlans.filter((plan) => plan.dogId === dogId).map((plan) => [plan.date, plan]));
      const timestamp = this.now();
      const week: DailyPlan[] = [];
      let previousLessonIds: readonly LessonId[] = [];

      for (let offset = 0; offset < 7; offset += 1) {
        const date = addDays(startDate, offset);
        const existing = byDate.get(date);
        if (existing) { week.push(existing); previousLessonIds = existing.lessonIds; continue; }
        let lessonIds = this.generator.generate(profile, dogAgeMonths, progress, 2, previousLessonIds);
        if (lessonIds.length < 2) {
          const fallback = this.generator.generate(profile, dogAgeMonths, progress, 2);
          lessonIds = [...lessonIds, ...fallback.filter((id) => !lessonIds.includes(id))].slice(0, 2);
        }
        const created: DailyPlan = { id: this.createId('daily-plan'), dogId, date, lessonIds, status: 'scheduled', createdAt: timestamp, updatedAt: timestamp };
        await repository.save(created);
        week.push(created);
        previousLessonIds = lessonIds;
      }
      return week;
    });
  }

  async setLessons(planId: string, dogId: string, lessonIds: readonly LessonId[], dogAgeMonths: number, progress: readonly LessonProgress[]): Promise<DailyPlan> {
    if (lessonIds.length < 1 || lessonIds.length > 2 || new Set(lessonIds).size !== lessonIds.length) throw new Error('Choose one or two unique lessons.');
    const eligibility = new LessonEligibilityService(this.catalogue);
    if (lessonIds.some((id) => !eligibility.evaluate(id, dogAgeMonths, progress).eligible)) throw new Error('A selected lesson is not eligible.');
    return this.updatePlan(planId, dogId, (plan) => ({ ...plan, lessonIds: [...lessonIds], status: 'scheduled', updatedAt: this.now() }));
  }

  async toggleRestDay(planId: string, dogId: string): Promise<DailyPlan> {
    return this.updatePlan(planId, dogId, (plan) => {
      if (plan.status !== 'scheduled' && plan.status !== 'skipped') throw new Error('An active or completed plan cannot become a rest day.');
      return { ...plan, status: plan.status === 'skipped' ? 'scheduled' : 'skipped', updatedAt: this.now() };
    });
  }

  private async updatePlan(planId: string, dogId: string, update: (plan: DailyPlan) => DailyPlan): Promise<DailyPlan> {
    return this.transactions.run([storageKeys.dailyPlans], async (storage) => {
      const repository = createDomainRepositories(storage).dailyPlans;
      const plan = await repository.findById(planId);
      if (!plan || plan.dogId !== dogId) throw new Error('Daily plan does not belong to this dog.');
      const updated = update(plan);
      await repository.save(updated);
      return updated;
    });
  }
}
