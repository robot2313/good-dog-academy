import type { DailyPlan, Dog, LessonDefinition } from '../../src/domain/models';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import {
  LessonSessionCompletionService,
  type CompleteLessonSessionRequest,
} from '../../src/features/lessons/progress';
import { sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import type { StorageAdapter } from '../../src/storage/StorageAdapter';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { storageKeys } from '../../src/storage/storageKeys';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { foundationLesson, lessonProgress, recallLesson } from '../support/lessonFixtures';

const completedAt = '2026-07-23T03:00:00.000Z';
const baseRequest: CompleteLessonSessionRequest = {
  sessionId: 'training-session-1',
  ownerId: sampleOwner.id,
  dogId: sampleDog.id,
  lessonId: foundationLesson.id,
  dailyPlanId: null,
  startedAt: '2026-07-23T02:54:00.000Z',
  rating: 5,
  notes: 'Guided check-ins: 4 successful repetitions.',
};

class FailingStorageAdapter implements StorageAdapter {
  constructor(
    private readonly base: StorageAdapter,
    private readonly failKey: string,
  ) {}

  getItem<T>(key: string): Promise<T | null> {
    return this.base.getItem<T>(key);
  }

  removeItem(key: string): Promise<void> {
    return this.base.removeItem(key);
  }

  setItem<T>(key: string, value: T): Promise<void> {
    return key === this.failKey
      ? Promise.reject(new Error('Injected completion failure'))
      : this.base.setItem(key, value);
  }
}

describe('LessonSessionCompletionService', () => {
  it('atomically records actual session time, performance, and prerequisite unlocks', async () => {
    const { repositories, service } = await setup([foundationLesson, recallLesson], [
      lessonProgress(),
      lessonProgress({
        id: 'recall-progress',
        lessonId: recallLesson.id,
        status: 'locked',
        unlockedAt: null,
      }),
    ]);

    const result = await service.complete(baseRequest);

    expect(result.idempotent).toBe(false);
    expect(result.session).toMatchObject({
      id: baseRequest.sessionId,
      dogId: sampleDog.id,
      lessonId: foundationLesson.id,
      startedAt: baseRequest.startedAt,
      completedAt,
      durationMinutes: 6,
      outcome: 'success',
      notes: baseRequest.notes,
    });
    expect(result.progressRecords.find((record) => record.lessonId === foundationLesson.id))
      .toMatchObject({
        status: 'completed',
        attempts: 1,
        successfulCompletions: 1,
        bestPerformanceRating: 5,
        lastAttemptedAt: completedAt,
        lastCompletedAt: completedAt,
      });
    expect(result.progressRecords.find((record) => record.lessonId === recallLesson.id))
      .toMatchObject({ status: 'available', unlockedAt: completedAt });
    await expect(repositories.trainingSessions.findAll()).resolves.toEqual([result.session]);
    await expect(repositories.progress.findAll()).resolves.toEqual([]);
    await expect(repositories.achievements.findAll()).resolves.toEqual([]);
  });

  it('records a low-rated attempt without counting a successful completion', async () => {
    const { service } = await setup([foundationLesson], [lessonProgress()]);
    const result = await service.complete({ ...baseRequest, rating: 2 });

    expect(result.session.outcome).toBe('unsuccessful');
    expect(result.progressRecords[0]).toMatchObject({
      status: 'inProgress',
      attempts: 1,
      successfulCompletions: 0,
      bestPerformanceRating: 2,
      lastCompletedAt: null,
    });
  });

  it('is idempotent for the same session identity', async () => {
    const { repositories, service } = await setup([foundationLesson], [lessonProgress()]);
    const first = await service.complete(baseRequest);
    const second = await service.complete(baseRequest);

    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    await expect(repositories.trainingSessions.findAll()).resolves.toHaveLength(1);
    await expect(repositories.lessonProgress.findById(lessonProgress().id)).resolves.toMatchObject({
      attempts: 1,
      successfulCompletions: 1,
    });
  });

  it('rejects conflicting reuse of a session ID', async () => {
    const { service } = await setup([foundationLesson], [lessonProgress()]);
    await service.complete(baseRequest);
    await expect(service.complete({
      ...baseRequest,
      startedAt: '2026-07-23T02:53:00.000Z',
    })).rejects.toMatchObject({ code: 'SESSION_ID_CONFLICT' });
  });

  it('isolates progress belonging to another selected dog', async () => {
    const otherDog: Dog = { ...sampleDog, id: 'dog-other-001' };
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.dogs.save(otherDog);
    await repositories.lessonProgress.save(lessonProgress());
    const otherProgress = lessonProgress({ id: 'other-progress', dogId: otherDog.id });
    await repositories.lessonProgress.save(otherProgress);
    const service = createService(storage, [foundationLesson]);

    await service.complete(baseRequest);

    await expect(repositories.lessonProgress.findById(otherProgress.id)).resolves.toEqual(otherProgress);
    await expect(repositories.trainingSessions.findAll()).resolves.toEqual([
      expect.objectContaining({ dogId: sampleDog.id }),
    ]);
  });

  it('rejects owner mismatches without writing a session', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save({ ...sampleDog, ownerId: 'different-owner' });
    const service = createService(storage, [foundationLesson]);

    await expect(service.complete(baseRequest)).rejects.toMatchObject({
      code: 'DOG_OWNERSHIP_MISMATCH',
    });
    await expect(repositories.trainingSessions.findAll()).resolves.toEqual([]);
  });

  it('rejects locked, missing, and age-ineligible lessons', async () => {
    const locked = await setup([foundationLesson, recallLesson], [
      lessonProgress(),
      lessonProgress({
        id: 'recall-progress',
        lessonId: recallLesson.id,
        status: 'locked',
        unlockedAt: null,
      }),
    ]);
    await expect(locked.service.complete({
      ...baseRequest,
      lessonId: recallLesson.id,
    })).rejects.toMatchObject({ code: 'LESSON_LOCKED' });
    await expect(locked.service.complete({
      ...baseRequest,
      lessonId: 'missing-lesson',
    })).rejects.toMatchObject({ code: 'LESSON_NOT_FOUND' });

    const ageRestricted: LessonDefinition = {
      ...foundationLesson,
      minimumDogAgeMonths: 999,
    };
    const age = await setup([ageRestricted], [lessonProgress()]);
    await expect(age.service.complete(baseRequest)).rejects.toMatchObject({
      code: 'LESSON_INELIGIBLE',
    });

    const inactive = await setup(
      [{ ...foundationLesson, isActive: false }],
      [lessonProgress({ status: 'locked', unlockedAt: null })],
    );
    await expect(inactive.service.complete(baseRequest)).rejects.toMatchObject({
      code: 'LESSON_INACTIVE',
    });
  });

  it('requires an initialized progress record', async () => {
    const { service } = await setup([foundationLesson], []);
    await expect(service.complete(baseRequest)).rejects.toMatchObject({
      code: 'LESSON_PROGRESS_NOT_FOUND',
    });
  });

  it('reports duplicate selected-dog progress as corrupt without writing', async () => {
    const { repositories, service } = await setup([foundationLesson], [
      lessonProgress(),
      lessonProgress({ id: 'duplicate-progress' }),
    ]);
    await expect(service.complete(baseRequest)).rejects.toMatchObject({
      code: 'CORRUPT_STORED_DATA',
    });
    await expect(repositories.trainingSessions.findAll()).resolves.toEqual([]);
  });

  it('links no plan when no dailyPlanId is provided', async () => {
    const { repositories, service } = await setup([foundationLesson], [lessonProgress()]);
    const plan = dailyPlan([foundationLesson]);
    await repositories.dailyPlans.save(plan);

    const result = await service.complete(baseRequest);

    expect(result.session.dailyPlanId).toBeNull();
    await expect(repositories.dailyPlans.findById(plan.id)).resolves.toEqual(plan);
  });

  it('completes a one-item current-format DailyPlan without changing provenance', async () => {
    const { repositories, service } = await setup([foundationLesson], [lessonProgress()]);
    const plan = dailyPlan([foundationLesson]);
    await repositories.dailyPlans.save(plan);

    const result = await service.complete({ ...baseRequest, dailyPlanId: plan.id });

    expect(result.dailyPlan).toEqual({
      ...plan,
      status: 'completed',
      updatedAt: completedAt,
    });
    expect(result.dailyPlan?.items).toEqual(plan.items);
    expect(result.dailyPlan?.sourceAssessmentId).toBe(plan.sourceAssessmentId);
  });

  it('keeps a two-item plan planned until both linked lessons have sessions', async () => {
    const { repositories, service } = await setup([foundationLesson, recallLesson], [
      lessonProgress(),
      lessonProgress({
        id: 'recall-progress',
        lessonId: recallLesson.id,
        status: 'locked',
        unlockedAt: null,
      }),
    ]);
    const plan = dailyPlan([foundationLesson, recallLesson]);
    await repositories.dailyPlans.save(plan);
    await repositories.trainingSessions.save({
      id: 'foreign-dog-session',
      dogId: 'different-dog',
      lessonId: recallLesson.id,
      dailyPlanId: plan.id,
      startedAt: '2026-07-23T01:00:00.000Z',
      completedAt: '2026-07-23T01:05:00.000Z',
      durationMinutes: 5,
      outcome: 'success',
      notes: '',
    });

    const first = await service.complete({ ...baseRequest, dailyPlanId: plan.id });
    expect(first.dailyPlan?.status).toBe('planned');

    const second = await service.complete({
      ...baseRequest,
      sessionId: 'training-session-2',
      lessonId: recallLesson.id,
      dailyPlanId: plan.id,
      startedAt: '2026-07-23T02:55:00.000Z',
      rating: 3,
    });
    expect(second.dailyPlan?.status).toBe('completed');
    expect(second.dailyPlan?.items).toEqual(plan.items);
  });

  it('rejects missing, mismatched, completed, and skipped plans', async () => {
    const cases = [
      { plan: null, expected: 'DAILY_PLAN_NOT_FOUND' },
      {
        plan: { ...dailyPlan([foundationLesson]), dogId: 'different-dog' },
        expected: 'DAILY_PLAN_OWNERSHIP_MISMATCH',
      },
      {
        plan: dailyPlan([recallLesson]),
        expected: 'DAILY_PLAN_LESSON_MISMATCH',
      },
      {
        plan: { ...dailyPlan([foundationLesson]), status: 'completed' as const },
        expected: 'DAILY_PLAN_CLOSED',
      },
      {
        plan: { ...dailyPlan([foundationLesson]), status: 'skipped' as const },
        expected: 'DAILY_PLAN_CLOSED',
      },
    ];

    for (const [index, item] of cases.entries()) {
      const { repositories, service } = await setup([foundationLesson, recallLesson], [
        lessonProgress(),
      ]);
      const planId = `daily-plan-case-${index}`;
      if (item.plan) await repositories.dailyPlans.save({ ...item.plan, id: planId });
      await expect(service.complete({
        ...baseRequest,
        sessionId: `session-case-${index}`,
        dailyPlanId: planId,
      })).rejects.toMatchObject({ code: item.expected });
      await expect(repositories.trainingSessions.findAll()).resolves.toEqual([]);
    }
  });

  it('returns an existing idempotent completion after it closes a plan', async () => {
    const { repositories, service } = await setup([foundationLesson], [lessonProgress()]);
    const plan = dailyPlan([foundationLesson]);
    await repositories.dailyPlans.save(plan);
    const request = { ...baseRequest, dailyPlanId: plan.id };

    await service.complete(request);
    await expect(service.complete(request)).resolves.toMatchObject({
      idempotent: true,
      dailyPlan: { status: 'completed' },
    });
  });

  it('rolls back progress when the session collection cannot commit', async () => {
    const base = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(base);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    const original = lessonProgress();
    await repositories.lessonProgress.save(original);
    const service = createService(
      new FailingStorageAdapter(base, storageKeys.trainingSessions),
      [foundationLesson],
    );

    await expect(service.complete(baseRequest)).rejects.toMatchObject({
      code: 'TRANSACTION_FAILED',
    });
    await expect(repositories.lessonProgress.findById(original.id)).resolves.toEqual(original);
    await expect(repositories.trainingSessions.findAll()).resolves.toEqual([]);
  });
});

async function setup(
  definitions: readonly LessonDefinition[],
  progressRecords: readonly ReturnType<typeof lessonProgress>[],
) {
  const storage = new InMemoryStorageAdapter();
  const repositories = createDomainRepositories(storage);
  await repositories.owners.save(sampleOwner);
  await repositories.dogs.save(sampleDog);
  for (const record of progressRecords) await repositories.lessonProgress.save(record);
  return { repositories, service: createService(storage, definitions), storage };
}

function createService(
  storage: StorageAdapter,
  definitions: readonly LessonDefinition[],
): LessonSessionCompletionService {
  return new LessonSessionCompletionService(
    new StorageTransactionManager(storage),
    LessonCatalogue.load(definitions),
    () => completedAt,
  );
}

function dailyPlan(definitions: readonly LessonDefinition[]): DailyPlan {
  const items = definitions.map((lesson, index) => ({
    lessonId: lesson.id,
    skill: lesson.skill,
    role: index === 0 ? 'primary' as const : 'reinforcement' as const,
    plannedMinutes: 5,
    reasonCodes: index === 0
      ? ['AVAILABLE_NEW_LEARNING' as const]
      : ['REINFORCEMENT_DUE' as const],
    order: (index + 1) as 1 | 2,
  }));
  return {
    id: 'daily-plan-1',
    ownerId: sampleOwner.id,
    dogId: sampleDog.id,
    localDate: '2026-07-23',
    timezone: 'Australia/Adelaide',
    targetMinutes: 10,
    estimatedMinutes: items.reduce((total, item) => total + item.plannedMinutes, 0),
    focusSkill: items[0].skill,
    items,
    status: 'planned',
    sourceAssessmentId: 'assessment-1',
    generatedAt: '2026-07-23T00:00:00.000Z',
    createdAt: '2026-07-23T00:00:00.000Z',
    updatedAt: '2026-07-23T00:00:00.000Z',
  };
}
