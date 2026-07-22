import type {
  DailyPlan,
  Dog,
  LessonId,
  LessonPerformanceRating,
  LessonProgress,
  TrainingOutcome,
  TrainingSession,
} from '../../../domain/models';
import { createDomainRepositories } from '../../../services/createDomainRepositories';
import { RepositoryValidationError } from '../../../storage/AsyncStorageRepository';
import {
  StorageTransactionManager,
  TransactionError,
} from '../../../storage/StorageTransactionManager';
import { storageKeys } from '../../../storage/storageKeys';
import type { LessonCatalogue } from '../catalogue';
import { LessonEligibilityError, LessonEligibilityService } from '../eligibility';
import { LessonUnlockError, LessonUnlockService } from './LessonUnlockService';

export type LessonSessionCompletionErrorCode =
  | 'INVALID_SESSION_ID'
  | 'INVALID_STARTED_AT'
  | 'INVALID_RATING'
  | 'OWNER_NOT_FOUND'
  | 'DOG_NOT_FOUND'
  | 'DOG_OWNERSHIP_MISMATCH'
  | 'STALE_SELECTED_DOG'
  | 'LESSON_NOT_FOUND'
  | 'LESSON_INACTIVE'
  | 'LESSON_LOCKED'
  | 'LESSON_INELIGIBLE'
  | 'LESSON_PROGRESS_NOT_FOUND'
  | 'PROGRESS_OWNERSHIP_MISMATCH'
  | 'SESSION_ID_CONFLICT'
  | 'DAILY_PLAN_NOT_FOUND'
  | 'DAILY_PLAN_OWNERSHIP_MISMATCH'
  | 'DAILY_PLAN_LESSON_MISMATCH'
  | 'DAILY_PLAN_CLOSED'
  | 'CORRUPT_STORED_DATA'
  | 'TRANSACTION_FAILED';

export class LessonSessionCompletionError extends Error {
  constructor(
    readonly code: LessonSessionCompletionErrorCode,
    readonly context: Readonly<Record<string, unknown>> = {},
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'LessonSessionCompletionError';
  }
}

export type CompleteLessonSessionRequest = {
  readonly sessionId: string;
  readonly ownerId: string;
  readonly dogId: string;
  readonly lessonId: LessonId;
  readonly dailyPlanId: string | null;
  readonly startedAt: string;
  readonly rating: LessonPerformanceRating;
  readonly notes: string;
};

export type LessonSessionCompletionResult = {
  readonly progressRecords: readonly LessonProgress[];
  readonly session: TrainingSession;
  readonly dailyPlan: DailyPlan | null;
  readonly idempotent: boolean;
};

const completionKeys = [
  storageKeys.owners,
  storageKeys.dogs,
  storageKeys.lessonProgress,
  storageKeys.trainingSessions,
  storageKeys.dailyPlans,
] as const;

export class LessonSessionCompletionService {
  private readonly eligibility: LessonEligibilityService;
  private readonly unlocks: LessonUnlockService;

  constructor(
    private readonly transactions: StorageTransactionManager,
    private readonly catalogue: LessonCatalogue,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    this.eligibility = new LessonEligibilityService(catalogue);
    this.unlocks = new LessonUnlockService(catalogue);
  }

  async complete(
    request: CompleteLessonSessionRequest,
  ): Promise<LessonSessionCompletionResult> {
    this.validateRequest(request);

    try {
      return await this.transactions.run(completionKeys, async (storage) => {
        const repositories = createDomainRepositories(storage);
        const owner = await repositories.owners.findById(request.ownerId);
        if (!owner) {
          throw new LessonSessionCompletionError('OWNER_NOT_FOUND', {
            ownerId: request.ownerId,
          });
        }

        const dog = await repositories.dogs.findById(request.dogId);
        if (!dog) {
          throw new LessonSessionCompletionError('DOG_NOT_FOUND', {
            dogId: request.dogId,
          });
        }
        if (dog.ownerId !== owner.id) {
          throw new LessonSessionCompletionError('DOG_OWNERSHIP_MISMATCH', {
            ownerId: owner.id,
            dogId: dog.id,
            dogOwnerId: dog.ownerId,
          });
        }

        const lesson = this.catalogue.findById(request.lessonId);
        if (!lesson) {
          throw new LessonSessionCompletionError('LESSON_NOT_FOUND', {
            lessonId: request.lessonId,
          });
        }
        if (!lesson.isActive) {
          throw new LessonSessionCompletionError('LESSON_INACTIVE', {
            lessonId: lesson.id,
          });
        }

        const allProgress = await repositories.lessonProgress.findAll();
        const dogProgress = allProgress.filter((record) => record.dogId === dog.id);
        if (dogProgress.some((record) => record.ownerId !== owner.id)) {
          throw new LessonSessionCompletionError('PROGRESS_OWNERSHIP_MISMATCH', {
            ownerId: owner.id,
            dogId: dog.id,
          });
        }

        const existingSession = await repositories.trainingSessions.findById(
          request.sessionId,
        );
        if (existingSession) {
          if (!sameSessionIdentity(existingSession, request)) {
            throw new LessonSessionCompletionError('SESSION_ID_CONFLICT', {
              sessionId: request.sessionId,
            });
          }
          const existingPlan = request.dailyPlanId
            ? await repositories.dailyPlans.findById(request.dailyPlanId)
            : null;
          return {
            progressRecords: this.sortProgress(dogProgress),
            session: existingSession,
            dailyPlan: existingPlan,
            idempotent: true,
          };
        }

        const completedAt = this.now();
        if (!isIsoTimestamp(completedAt) || Date.parse(request.startedAt) > Date.parse(completedAt)) {
          throw new LessonSessionCompletionError('INVALID_STARTED_AT', {
            startedAt: request.startedAt,
            completedAt,
          });
        }

        const eligibility = this.eligibility.evaluate(
          lesson.id,
          dogAgeMonthsAt(dog, completedAt),
          dogProgress,
        );
        if (!eligibility.eligible) {
          throw new LessonSessionCompletionError(
            eligibility.status === 'locked' ? 'LESSON_LOCKED' : 'LESSON_INELIGIBLE',
            { lessonId: lesson.id, reasons: eligibility.reasons },
          );
        }

        const current = dogProgress.find((record) => record.lessonId === lesson.id);
        if (!current) {
          throw new LessonSessionCompletionError('LESSON_PROGRESS_NOT_FOUND', {
            dogId: dog.id,
            lessonId: lesson.id,
          });
        }

        const plan = request.dailyPlanId
          ? await this.requireApplicablePlan(repositories, request)
          : null;
        const successful = request.rating >= 3;
        const attempted: LessonProgress = {
          ...current,
          attempts: current.attempts + 1,
          successfulCompletions:
            current.successfulCompletions + (successful ? 1 : 0),
          lastAttemptedAt: completedAt,
          lastCompletedAt: successful ? completedAt : current.lastCompletedAt,
          bestPerformanceRating: Math.max(
            current.bestPerformanceRating ?? 0,
            request.rating,
          ) as LessonPerformanceRating,
          updatedAt: completedAt,
        };
        const attemptedRecords = dogProgress.map((record) =>
          record.id === current.id ? attempted : record,
        );
        const statuses = this.unlocks.determineStatuses(attemptedRecords);
        const progressRecords = attemptedRecords.map((record) => {
          const status = statuses.get(record.lessonId) ?? record.status;
          const unlockedAt = status === 'locked'
            ? null
            : record.unlockedAt ?? completedAt;
          const changed = record.id === current.id
            || status !== record.status
            || unlockedAt !== record.unlockedAt;
          return changed
            ? { ...record, status, unlockedAt, updatedAt: completedAt }
            : record;
        });

        for (const record of progressRecords) {
          const previous = dogProgress.find((candidate) => candidate.id === record.id);
          if (previous !== record) await repositories.lessonProgress.save(record);
        }

        const session: TrainingSession = {
          id: request.sessionId,
          dogId: dog.id,
          lessonId: lesson.id,
          dailyPlanId: plan?.id ?? null,
          startedAt: request.startedAt,
          completedAt,
          durationMinutes: elapsedMinutes(request.startedAt, completedAt),
          outcome: outcomeForRating(request.rating),
          notes: request.notes,
        };
        const existingSessions = await repositories.trainingSessions.findAll();
        await repositories.trainingSessions.save(session);

        const dailyPlan = plan
          ? await this.completePlanWhenCovered(
              repositories,
              plan,
              [...existingSessions, session],
              completedAt,
            )
          : null;

        return {
          progressRecords: this.sortProgress(progressRecords),
          session,
          dailyPlan,
          idempotent: false,
        };
      });
    } catch (cause) {
      throw completionErrorFrom(cause, request);
    }
  }

  private validateRequest(request: CompleteLessonSessionRequest): void {
    if (!request.sessionId.trim()) {
      throw new LessonSessionCompletionError('INVALID_SESSION_ID');
    }
    if (!isIsoTimestamp(request.startedAt)) {
      throw new LessonSessionCompletionError('INVALID_STARTED_AT', {
        startedAt: request.startedAt,
      });
    }
    if (!isRating(request.rating)) {
      throw new LessonSessionCompletionError('INVALID_RATING', {
        rating: request.rating,
      });
    }
  }

  private async requireApplicablePlan(
    repositories: ReturnType<typeof createDomainRepositories>,
    request: CompleteLessonSessionRequest,
  ): Promise<DailyPlan> {
    const plan = await repositories.dailyPlans.findById(request.dailyPlanId ?? '');
    if (!plan) {
      throw new LessonSessionCompletionError('DAILY_PLAN_NOT_FOUND', {
        dailyPlanId: request.dailyPlanId,
      });
    }
    if (plan.ownerId !== request.ownerId || plan.dogId !== request.dogId) {
      throw new LessonSessionCompletionError('DAILY_PLAN_OWNERSHIP_MISMATCH', {
        dailyPlanId: plan.id,
        ownerId: request.ownerId,
        dogId: request.dogId,
      });
    }
    if (!plan.items.some((item) => item.lessonId === request.lessonId)) {
      throw new LessonSessionCompletionError('DAILY_PLAN_LESSON_MISMATCH', {
        dailyPlanId: plan.id,
        lessonId: request.lessonId,
      });
    }
    if (plan.status !== 'planned') {
      throw new LessonSessionCompletionError('DAILY_PLAN_CLOSED', {
        dailyPlanId: plan.id,
        status: plan.status,
      });
    }
    return plan;
  }

  private async completePlanWhenCovered(
    repositories: ReturnType<typeof createDomainRepositories>,
    plan: DailyPlan,
    sessions: readonly TrainingSession[],
    completedAt: string,
  ): Promise<DailyPlan> {
    const coveredLessonIds = new Set(
      sessions
        .filter(
          (session) => session.dailyPlanId === plan.id
            && session.dogId === plan.dogId
            && session.completedAt !== null,
        )
        .map((session) => session.lessonId),
    );
    const status = plan.items.every((item) => coveredLessonIds.has(item.lessonId))
      ? 'completed'
      : 'planned';
    if (status === plan.status) return plan;
    const updated: DailyPlan = { ...plan, status, updatedAt: completedAt };
    await repositories.dailyPlans.save(updated);
    return updated;
  }

  private sortProgress(records: readonly LessonProgress[]): readonly LessonProgress[] {
    const order = new Map(
      this.catalogue.definitions.map((definition, index) => [definition.id, index]),
    );
    return [...records].sort(
      (left, right) =>
        (order.get(left.lessonId) ?? Number.MAX_SAFE_INTEGER)
        - (order.get(right.lessonId) ?? Number.MAX_SAFE_INTEGER),
    );
  }
}

function completionErrorFrom(
  cause: unknown,
  request: CompleteLessonSessionRequest,
): LessonSessionCompletionError {
  if (cause instanceof LessonSessionCompletionError) return cause;
  if (cause instanceof TransactionError) {
    if (cause.cause instanceof LessonSessionCompletionError) return cause.cause;
    if (isCorruptDataError(cause.cause)) {
      return new LessonSessionCompletionError(
        'CORRUPT_STORED_DATA',
        { dogId: request.dogId, lessonId: request.lessonId },
        { cause },
      );
    }
  }
  if (isCorruptDataError(cause)) {
    return new LessonSessionCompletionError(
      'CORRUPT_STORED_DATA',
      { dogId: request.dogId, lessonId: request.lessonId },
      { cause },
    );
  }
  return new LessonSessionCompletionError(
    'TRANSACTION_FAILED',
    { dogId: request.dogId, lessonId: request.lessonId },
    { cause },
  );
}

function isCorruptDataError(cause: unknown): boolean {
  return cause instanceof RepositoryValidationError
    || cause instanceof LessonUnlockError
    || cause instanceof LessonEligibilityError;
}

function sameSessionIdentity(
  session: TrainingSession,
  request: CompleteLessonSessionRequest,
): boolean {
  return session.completedAt !== null
    && session.dogId === request.dogId
    && session.lessonId === request.lessonId
    && session.dailyPlanId === request.dailyPlanId
    && session.startedAt === request.startedAt;
}

function outcomeForRating(rating: LessonPerformanceRating): TrainingOutcome {
  if (rating >= 4) return 'success';
  if (rating === 3) return 'partial-success';
  return 'unsuccessful';
}

function elapsedMinutes(startedAt: string, completedAt: string): number {
  return Math.max(
    0,
    Math.round((Date.parse(completedAt) - Date.parse(startedAt)) / 60_000),
  );
}

function dogAgeMonthsAt(dog: Dog, timestamp: string): number {
  if (!dog.dateOfBirth) return Math.max(0, Math.round((dog.estimatedAgeYears ?? 0) * 12));
  const at = new Date(timestamp);
  const [birthYear, birthMonth, birthDay] = dog.dateOfBirth.split('-').map(Number);
  return Math.max(
    0,
    (at.getUTCFullYear() - birthYear) * 12
      + at.getUTCMonth() + 1
      - birthMonth
      - (at.getUTCDate() < birthDay ? 1 : 0),
  );
}

function isRating(value: number): value is LessonPerformanceRating {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function isIsoTimestamp(value: string): boolean {
  return value.trim().length > 0 && Number.isFinite(Date.parse(value));
}
