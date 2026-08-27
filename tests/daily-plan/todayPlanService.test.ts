import type { DailyPlan, Dog, TrainingSession } from '../../src/domain/models';
import {
  sampleBehaviourAssessment,
  sampleBehaviourProfile,
  sampleDog,
  sampleOwner,
} from '../../src/development/seed/sampleData';
import {
  DailyPlanGenerationService,
  TodayPlanError,
  TodayPlanService,
} from '../../src/features/daily-plan';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { storageKeys } from '../../src/storage/storageKeys';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import {
  foundationLesson,
  lessonProgress,
  recallLesson,
} from '../support/lessonFixtures';

const request = {
  ownerId: sampleOwner.id,
  dogId: sampleDog.id,
  timezone: 'Australia/Adelaide',
} as const;

describe('TodayPlanService', () => {
  it('creates one same-day plan idempotently and preserves plan.items order', async () => {
    const { repositories, service } = await setup();

    const first = await service.getOrCreate(request);
    const second = await service.getOrCreate(request);

    expect(second).toEqual(first);
    expect(first.items.map((item) => item.lessonId)).toEqual([
      recallLesson.id,
      foundationLesson.id,
    ]);
    expect(first.items.map((item) => item.role)).toEqual([
      'primary',
      'reinforcement',
    ]);
    await expect(repositories.dailyPlans.findAll()).resolves.toHaveLength(1);
  });

  it('creates only one same-day plan when requests run concurrently', async () => {
    const { repositories, service } = await setup();

    const [first, second] = await Promise.all([
      service.getOrCreate(request),
      service.getOrCreate(request),
    ]);

    expect(second).toEqual(first);
    await expect(repositories.dailyPlans.findAll()).resolves.toEqual([
      expect.objectContaining({ id: first.id }),
    ]);
  });

  it('validates the selected owner/dog relationship before generating a plan', async () => {
    const { repositories, service } = await setup();
    const foreignDog: Dog = {
      ...sampleDog,
      id: 'dog-owned-elsewhere',
      ownerId: 'owner-not-selected',
    };
    await repositories.dogs.save(foreignDog);

    await expect(service.getOrCreate({
      ...request,
      dogId: foreignDog.id,
    })).rejects.toMatchObject({
      code: 'DOG_OWNERSHIP_MISMATCH',
    } satisfies Partial<TodayPlanError>);
  });

  it('derives coverage only from completed sessions for the selected dog and plan', async () => {
    const { repositories, service } = await setup();
    const initial = await service.getOrCreate(request);
    const [completedItem, incompleteItem] = initial.items;
    const otherDog: Dog = {
      ...sampleDog,
      id: 'dog-other-today-plan',
    };
    await repositories.dogs.save(otherDog);
    await repositories.trainingSessions.save(session({
      id: 'session-covered',
      dogId: sampleDog.id,
      lessonId: completedItem.lessonId,
      dailyPlanId: initial.id,
    }));
    await repositories.trainingSessions.save(session({
      id: 'session-incomplete',
      dogId: sampleDog.id,
      lessonId: incompleteItem.lessonId,
      dailyPlanId: initial.id,
      completedAt: null,
      outcome: null,
    }));
    await repositories.trainingSessions.save(session({
      id: 'session-other-dog',
      dogId: otherDog.id,
      lessonId: incompleteItem.lessonId,
      dailyPlanId: initial.id,
    }));

    const refreshed = await service.getOrCreate(request);

    expect(refreshed.completedItemCount).toBe(1);
    expect(refreshed.items.map((item) => item.completed)).toEqual([true, false]);
  });

  it('keeps obsolete lesson IDs visible but unavailable and non-actionable', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    const plan = stalePlan();
    const generator = {
      getOrCreate: jest.fn().mockResolvedValue(plan),
    };
    const service = new TodayPlanService(
      repositories,
      LessonCatalogue.load([foundationLesson]),
      generator,
    );

    const result = await service.getOrCreate(request);

    expect(result.stale).toBe(true);
    expect(result.items).toEqual([
      expect.objectContaining({
        lessonId: 'retired-lesson',
        title: 'Unknown lesson',
        lessonAvailable: false,
      }),
    ]);
  });

  it('rejects a generated plan owned by another dog', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    const generator = {
      getOrCreate: jest.fn().mockResolvedValue({
        ...stalePlan(),
        dogId: 'dog-private-plan',
      }),
    };
    const service = new TodayPlanService(
      repositories,
      LessonCatalogue.load([foundationLesson]),
      generator,
    );

    await expect(service.getOrCreate(request)).rejects.toMatchObject({
      code: 'PLAN_OWNERSHIP_MISMATCH',
    } satisfies Partial<TodayPlanError>);
  });

  it('maps corrupt stored sessions without exposing partial results', async () => {
    const { storage, service } = await setup();
    await storage.setItem(storageKeys.trainingSessions, [{ id: 'broken-session' }]);

    await expect(service.getOrCreate(request)).rejects.toMatchObject({
      code: 'CORRUPT_STORED_DATA',
    } satisfies Partial<TodayPlanError>);
  });

  it('maps progress that references a missing catalogue lesson as corrupt', async () => {
    const { repositories, service } = await setup();
    await repositories.lessonProgress.save(lessonProgress({
      id: 'progress-retired-lesson',
      lessonId: 'retired-lesson',
    }));

    await expect(service.getOrCreate(request)).rejects.toMatchObject({
      code: 'CORRUPT_STORED_DATA',
    } satisfies Partial<TodayPlanError>);
  });

  it('maps the real generator NO_ELIGIBLE_LESSONS outcome', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.behaviourAssessments.save(sampleBehaviourAssessment);
    await repositories.behaviourProfiles.save(sampleBehaviourProfile);
    const catalogue = LessonCatalogue.load([{
      ...foundationLesson,
      isActive: false,
    }]);
    const generator = new DailyPlanGenerationService(
      new StorageTransactionManager(storage),
      catalogue,
      () => new Date('2026-07-22T14:30:00.000Z'),
    );
    const service = new TodayPlanService(repositories, catalogue, generator);

    await expect(service.getOrCreate(request)).rejects.toMatchObject({
      code: 'NO_ELIGIBLE_LESSONS',
    } satisfies Partial<TodayPlanError>);
    await expect(repositories.dailyPlans.findAll()).resolves.toEqual([]);
  });

  it('rejects invalid IANA timezones before plan generation', async () => {
    const { service } = await setup();

    await expect(service.getOrCreate({
      ...request,
      timezone: 'Not/A_Timezone',
    })).rejects.toMatchObject({
      code: 'INVALID_TIMEZONE',
    } satisfies Partial<TodayPlanError>);
  });

  it.each([
    ['Australia/Adelaide', '2026-04-04T16:29:59.000Z', '2026-04-05'],
    ['Australia/Adelaide', '2026-04-04T16:30:00.000Z', '2026-04-05'],
    ['America/New_York', '2026-11-01T05:59:59.000Z', '2026-11-01'],
    ['America/New_York', '2026-11-01T06:00:00.000Z', '2026-11-01'],
    ['Australia/Adelaide', '2026-07-22T14:29:59.000Z', '2026-07-22'],
    ['Australia/Adelaide', '2026-07-22T14:30:00.000Z', '2026-07-23'],
    ['America/New_York', '2026-07-23T03:59:59.000Z', '2026-07-22'],
    ['America/New_York', '2026-07-23T04:00:00.000Z', '2026-07-23'],
  ])(
    'uses %s local calendar dates across DST and UTC-midnight boundaries',
    async (timezone, timestamp, expectedLocalDate) => {
      const { service } = await setup(timestamp);

      const plan = await service.getOrCreate({
        ...request,
        timezone,
      });

      expect(plan.localDate).toBe(expectedLocalDate);
      expect(plan.timezone).toBe(timezone);
    },
  );
});

async function setup(now = '2026-07-22T14:30:00.000Z') {
  const storage = new InMemoryStorageAdapter();
  const repositories = createDomainRepositories(storage);
  await repositories.owners.save(sampleOwner);
  await repositories.dogs.save(sampleDog);
  await repositories.behaviourAssessments.save(sampleBehaviourAssessment);
  await repositories.behaviourProfiles.save(sampleBehaviourProfile);
  await repositories.lessonProgress.save(lessonProgress({
    lessonId: foundationLesson.id,
    status: 'completed',
    attempts: 2,
    successfulCompletions: 2,
    lastCompletedAt: '2026-06-01T00:00:00.000Z',
  }));
  await repositories.lessonProgress.save(lessonProgress({
    id: 'recall-progress',
    lessonId: recallLesson.id,
    status: 'inProgress',
    attempts: 2,
    successfulCompletions: 0,
  }));
  const catalogue = LessonCatalogue.load([foundationLesson, recallLesson]);
  const generator = new DailyPlanGenerationService(
    new StorageTransactionManager(storage),
    catalogue,
    () => new Date(now),
  );
  const service = new TodayPlanService(repositories, catalogue, generator);
  return { storage, repositories, service };
}

function session(
  overrides: Partial<TrainingSession> = {},
): TrainingSession {
  return {
    id: 'session-today-plan',
    dogId: sampleDog.id,
    lessonId: recallLesson.id,
    dailyPlanId: 'daily-plan-today',
    startedAt: '2026-07-22T14:30:00.000Z',
    completedAt: '2026-07-22T14:35:00.000Z',
    durationMinutes: 5,
    outcome: 'success',
    notes: 'A short successful session.',
    ...overrides,
  };
}

function stalePlan(): DailyPlan {
  return {
    id: 'daily-plan-stale',
    ownerId: sampleOwner.id,
    dogId: sampleDog.id,
    localDate: '2026-07-23',
    timezone: 'Australia/Adelaide',
    targetMinutes: 15,
    estimatedMinutes: 5,
    focusSkill: 'focus',
    items: [{
      lessonId: 'retired-lesson',
      skill: 'focus',
      role: 'primary',
      plannedMinutes: 5,
      reasonCodes: ['AVAILABLE_NEW_LEARNING'],
      order: 1,
    }],
    status: 'planned',
    sourceAssessmentId: sampleBehaviourAssessment.id,
    generatedAt: '2026-07-22T14:30:00.000Z',
    createdAt: '2026-07-22T14:30:00.000Z',
    updatedAt: '2026-07-22T14:30:00.000Z',
  };
}
