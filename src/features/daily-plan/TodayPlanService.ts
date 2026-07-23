import type { DailyPlan } from '../../domain/models';
import type { DomainRepositories } from '../../domain/repositories';
import { RepositoryValidationError } from '../../storage/AsyncStorageRepository';
import { TransactionError } from '../../storage/StorageTransactionManager';
import { isValidTimeZone } from '../progress/time/localCalendarDate';
import type { LessonCatalogue } from '../lessons/catalogue';
import { LessonEligibilityError } from '../lessons/eligibility';
import { LessonUnlockError } from '../lessons/progress';
import {
  DailyPlanGenerationError,
  type DailyPlanGenerationService,
} from './DailyPlanGenerationService';
import { TodayPlanError } from './TodayPlanError';
import type {
  TodayPlanItemView,
  TodayPlanRequest,
  TodayPlanView,
} from './TodayPlanTypes';

type TodayPlanGenerator = Pick<DailyPlanGenerationService, 'getOrCreate'>;

export class TodayPlanService {
  constructor(
    private readonly repositories: DomainRepositories,
    private readonly catalogue: LessonCatalogue,
    private readonly generator: TodayPlanGenerator,
  ) {}

  async getOrCreate(request: TodayPlanRequest): Promise<TodayPlanView> {
    try {
      if (!isValidTimeZone(request.timezone)) {
        throw new TodayPlanError('INVALID_TIMEZONE', {
          timezone: request.timezone,
        });
      }

      const owner = await this.repositories.owners.findById(request.ownerId);
      if (!owner) {
        throw new TodayPlanError('OWNER_NOT_FOUND', {
          ownerId: request.ownerId,
        });
      }

      const dog = await this.repositories.dogs.findById(request.dogId);
      if (!dog) {
        throw new TodayPlanError('DOG_NOT_FOUND', { dogId: request.dogId });
      }
      if (dog.ownerId !== owner.id) {
        throw new TodayPlanError('DOG_OWNERSHIP_MISMATCH', {
          ownerId: owner.id,
          dogId: dog.id,
          dogOwnerId: dog.ownerId,
        });
      }

      const plan = await this.generator.getOrCreate({
        ownerId: owner.id,
        dogId: dog.id,
        timezone: request.timezone,
        targetMinutes: 15,
      });
      this.assertPlanOwnership(plan, owner.id, dog.id);

      const sessions = await this.repositories.trainingSessions.findAll();
      const completedLessonIds = new Set(
        sessions
          .filter(
            (session) =>
              session.dogId === dog.id
              && session.dailyPlanId === plan.id
              && session.completedAt !== null,
          )
          .map((session) => session.lessonId),
      );
      const items = plan.items.map<TodayPlanItemView>((item) => {
        const lesson = this.catalogue.findById(item.lessonId);
        return Object.freeze({
          lessonId: item.lessonId,
          title: lesson?.title ?? 'Unknown lesson',
          description:
            lesson?.shortDescription
            ?? 'This saved plan item is no longer available in the current lesson catalogue.',
          skill: lesson?.skill ?? item.skill,
          difficultyLevel: lesson?.difficultyLevel ?? null,
          role: item.role,
          plannedMinutes: item.plannedMinutes,
          completed: completedLessonIds.has(item.lessonId),
          lessonAvailable: lesson !== null && lesson.isActive,
        });
      });

      return Object.freeze({
        id: plan.id,
        ownerId: plan.ownerId,
        dogId: plan.dogId,
        localDate: plan.localDate,
        timezone: plan.timezone,
        targetMinutes: plan.targetMinutes,
        estimatedMinutes: plan.estimatedMinutes,
        focusSkill: plan.focusSkill,
        status: plan.status,
        items: Object.freeze(items),
        completedItemCount: items.filter((item) => item.completed).length,
        stale: items.some((item) => !item.lessonAvailable),
      });
    } catch (cause) {
      throw asTodayPlanError(cause, request);
    }
  }

  private assertPlanOwnership(
    plan: DailyPlan,
    ownerId: string,
    dogId: string,
  ): void {
    if (plan.ownerId !== ownerId || plan.dogId !== dogId) {
      throw new TodayPlanError('PLAN_OWNERSHIP_MISMATCH', {
        planId: plan.id,
        ownerId,
        dogId,
      });
    }
  }
}

function asTodayPlanError(
  cause: unknown,
  request: TodayPlanRequest,
): TodayPlanError {
  if (cause instanceof TodayPlanError) return cause;

  const generationError = unwrapGenerationError(cause);
  if (generationError) {
    if (
      generationError.code === 'OWNER_NOT_FOUND'
      || generationError.code === 'DOG_NOT_FOUND'
      || generationError.code === 'DOG_OWNERSHIP_MISMATCH'
      || generationError.code === 'NO_ELIGIBLE_LESSONS'
    ) {
      return new TodayPlanError(
        generationError.code,
        generationError.context,
        { cause },
      );
    }
  }

  if (containsCorruptDataError(cause)) {
    return new TodayPlanError(
      'CORRUPT_STORED_DATA',
      { ownerId: request.ownerId, dogId: request.dogId },
      { cause },
    );
  }

  return new TodayPlanError(
    'PLAN_LOAD_FAILED',
    { ownerId: request.ownerId, dogId: request.dogId },
    { cause },
  );
}

function unwrapGenerationError(
  cause: unknown,
): DailyPlanGenerationError | null {
  if (cause instanceof DailyPlanGenerationError) return cause;
  if (
    cause instanceof TransactionError
    && cause.cause instanceof DailyPlanGenerationError
  ) {
    return cause.cause;
  }
  return null;
}

function containsCorruptDataError(cause: unknown): boolean {
  const candidate = cause instanceof TransactionError ? cause.cause : cause;
  return candidate instanceof RepositoryValidationError
    || candidate instanceof LessonUnlockError
    || candidate instanceof LessonEligibilityError;
}
