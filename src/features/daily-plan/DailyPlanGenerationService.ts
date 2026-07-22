import type { BehaviourAssessment, DailyPlan, DailyPlanItem, DailyPlanTargetMinutes, Dog } from '../../domain/models';
import { createDomainRepositories } from '../../services/createDomainRepositories';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { storageKeys } from '../../storage/storageKeys';
import type { LessonCatalogue } from '../lessons/catalogue';
import { DailyPlanRecommendationService } from './DailyPlanRecommendationService';

export type DailyPlanGenerationErrorCode =
  | 'OWNER_NOT_FOUND' | 'DOG_NOT_FOUND' | 'DOG_OWNERSHIP_MISMATCH'
  | 'BEHAVIOUR_PROFILE_NOT_FOUND' | 'ASSESSMENT_NOT_FOUND'
  | 'ASSESSMENT_RELATIONSHIP_MISMATCH' | 'NO_ELIGIBLE_LESSONS';

export class DailyPlanGenerationError extends Error {
  constructor(readonly code: DailyPlanGenerationErrorCode, readonly context: Record<string, unknown>) {
    super(code);
    this.name = 'DailyPlanGenerationError';
  }
}

export type GenerateDailyPlanRequest = {
  ownerId: string;
  dogId: string;
  timezone: string;
  targetMinutes?: DailyPlanTargetMinutes;
};

const generationKeys = [storageKeys.owners, storageKeys.dogs, storageKeys.behaviourProfiles,
  storageKeys.behaviourAssessments, storageKeys.lessonProgress, storageKeys.dailyPlans] as const;

function localDateAt(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function dogAgeMonths(dog: Dog, localDate: string): number {
  if (dog.dateOfBirth) {
    const [year, month, day] = localDate.split('-').map(Number);
    const [birthYear, birthMonth, birthDay] = dog.dateOfBirth.split('-').map(Number);
    return Math.max(0, (year - birthYear) * 12 + month - birthMonth - (day < birthDay ? 1 : 0));
  }
  return Math.max(0, Math.round((dog.estimatedAgeYears ?? 0) * 12));
}

function latestAssessment(assessments: readonly BehaviourAssessment[]): BehaviourAssessment | null {
  return [...assessments].sort((a, b) =>
    Date.parse(b.completedAt) - Date.parse(a.completedAt) || a.id.localeCompare(b.id),
  )[0] ?? null;
}

export class DailyPlanGenerationService {
  constructor(
    private readonly transactions: StorageTransactionManager,
    private readonly catalogue: LessonCatalogue,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getOrCreate(request: GenerateDailyPlanRequest): Promise<DailyPlan> {
    const targetMinutes = request.targetMinutes ?? 15;
    const now = this.now();
    const localDate = localDateAt(now, request.timezone);

    return this.transactions.run(generationKeys, async (storage) => {
      const repositories = createDomainRepositories(storage);
      const allPlans = await repositories.dailyPlans.findAll();
      const existing = allPlans.find((plan) => plan.ownerId === request.ownerId
        && plan.dogId === request.dogId && plan.localDate === localDate);
      if (existing) return existing;

      const owner = await repositories.owners.findById(request.ownerId);
      if (!owner) throw new DailyPlanGenerationError('OWNER_NOT_FOUND', { ownerId: request.ownerId });
      const dog = await repositories.dogs.findById(request.dogId);
      if (!dog) throw new DailyPlanGenerationError('DOG_NOT_FOUND', { dogId: request.dogId });
      if (dog.ownerId !== owner.id) throw new DailyPlanGenerationError('DOG_OWNERSHIP_MISMATCH', { ownerId: owner.id, dogId: dog.id });

      const profile = (await repositories.behaviourProfiles.findAll()).find((item) => item.dogId === dog.id);
      if (!profile) throw new DailyPlanGenerationError('BEHAVIOUR_PROFILE_NOT_FOUND', { dogId: dog.id });
      const assessment = latestAssessment((await repositories.behaviourAssessments.findAll())
        .filter((item) => item.ownerId === owner.id && item.dogId === dog.id));
      if (!assessment) throw new DailyPlanGenerationError('ASSESSMENT_NOT_FOUND', { ownerId: owner.id, dogId: dog.id });
      if (profile.assessmentId !== assessment.id) throw new DailyPlanGenerationError('ASSESSMENT_RELATIONSHIP_MISMATCH', {
        profileAssessmentId: profile.assessmentId, latestAssessmentId: assessment.id,
      });

      const progress = (await repositories.lessonProgress.findAll())
        .filter((item) => item.ownerId === owner.id && item.dogId === dog.id);
      const history = allPlans.filter((plan) => plan.ownerId === owner.id && plan.dogId === dog.id && plan.localDate < localDate)
        .sort((a, b) => b.localDate.localeCompare(a.localDate) || a.id.localeCompare(b.id)).slice(0, 7);
      const recommendations = new DailyPlanRecommendationService(this.catalogue, () => now).recommend({
        dogAgeMonths: dogAgeMonths(dog, localDate), behaviourProfile: profile, progressRecords: progress,
        targetMinutes: 30, maximumLessons: 2, recentPlans: history,
      }).recommendations;
      const primary = recommendations.find((item) => item.kind === 'new-learning') ?? recommendations[0];
      if (!primary) throw new DailyPlanGenerationError('NO_ELIGIBLE_LESSONS', { dogId: dog.id });

      const items: DailyPlanItem[] = [{ lessonId: primary.lessonId, skill: primary.skill, role: 'primary',
        plannedMinutes: Math.min(primary.estimatedMinutes, targetMinutes), reasonCodes: primary.reasons, order: 1 }];
      const remaining = targetMinutes - items[0].plannedMinutes;
      const reinforcement = recommendations.find((item) => item.lessonId !== primary.lessonId
        && item.kind === 'reinforcement' && item.estimatedMinutes <= remaining);
      if (reinforcement) items.push({ lessonId: reinforcement.lessonId, skill: reinforcement.skill,
        role: 'reinforcement', plannedMinutes: reinforcement.estimatedMinutes,
        reasonCodes: reinforcement.reasons, order: 2 });

      const timestamp = now.toISOString();
      const plan: DailyPlan = {
        id: `daily-plan-${dog.id}-${localDate}`, ownerId: owner.id, dogId: dog.id, localDate,
        timezone: request.timezone, targetMinutes,
        estimatedMinutes: items.reduce((sum, item) => sum + item.plannedMinutes, 0),
        focusSkill: items[0].skill, items, status: 'planned', sourceAssessmentId: assessment.id,
        generatedAt: timestamp, createdAt: timestamp, updatedAt: timestamp,
      };
      await repositories.dailyPlans.save(plan);
      return plan;
    });
  }
}
