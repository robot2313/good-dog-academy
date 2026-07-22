import { sampleBehaviourAssessment, sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { DailyPlanGenerationError, DailyPlanGenerationService } from '../../src/features/daily-plan';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { TransactionError } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { foundationLesson, lessonProgress, recallLesson } from '../support/lessonFixtures';

async function setup() {
  const storage = new InMemoryStorageAdapter();
  const repositories = createDomainRepositories(storage);
  await repositories.owners.save(sampleOwner);
  await repositories.dogs.save(sampleDog);
  await repositories.behaviourAssessments.save(sampleBehaviourAssessment);
  await repositories.behaviourProfiles.save(sampleBehaviourProfile);
  await repositories.lessonProgress.save(lessonProgress({
    lessonId: foundationLesson.id, status: 'completed', attempts: 2, successfulCompletions: 2,
    lastCompletedAt: '2026-06-01T00:00:00.000Z',
  }));
  await repositories.lessonProgress.save(lessonProgress({
    id: 'recall-progress', lessonId: recallLesson.id, status: 'inProgress', attempts: 2,
    successfulCompletions: 0,
  }));
  const service = new DailyPlanGenerationService(
    new StorageTransactionManager(storage),
    LessonCatalogue.load([foundationLesson, recallLesson]),
    () => new Date('2026-07-22T14:30:00.000Z'),
  );
  return { repositories, service };
}

describe('DailyPlanGenerationService', () => {
  it('creates a valid local-day plan with one primary and optional reinforcement', async () => {
    const { repositories, service } = await setup();
    const plan = await service.getOrCreate({
      ownerId: sampleOwner.id, dogId: sampleDog.id, timezone: 'Australia/Adelaide',
    });

    expect(plan).toMatchObject({
      ownerId: sampleOwner.id, dogId: sampleDog.id, localDate: '2026-07-23',
      targetMinutes: 15, status: 'planned', sourceAssessmentId: sampleBehaviourAssessment.id,
      focusSkill: 'recall',
    });
    expect(plan.items[0]).toMatchObject({ lessonId: recallLesson.id, role: 'primary', order: 1 });
    expect(plan.items[1]).toMatchObject({ lessonId: foundationLesson.id, role: 'reinforcement', order: 2 });
    expect(plan.estimatedMinutes).toBe(10);
    await expect(repositories.dailyPlans.findAll()).resolves.toEqual([plan]);
  });

  it('reuses the same persisted plan for the dog and local date', async () => {
    const { repositories, service } = await setup();
    const first = await service.getOrCreate({ ownerId: sampleOwner.id, dogId: sampleDog.id, timezone: 'Australia/Adelaide' });
    const second = await service.getOrCreate({ ownerId: sampleOwner.id, dogId: sampleDog.id, timezone: 'Australia/Adelaide', targetMinutes: 30 });
    expect(second).toEqual(first);
    await expect(repositories.dailyPlans.findAll()).resolves.toHaveLength(1);
  });

  it('rejects a profile that does not reference the latest valid assessment', async () => {
    const { repositories, service } = await setup();
    await repositories.behaviourAssessments.save({
      ...sampleBehaviourAssessment, id: 'newer-assessment', completedAt: '2026-07-21T00:00:00.000Z',
    });
    await expect(service.getOrCreate({ ownerId: sampleOwner.id, dogId: sampleDog.id, timezone: 'Australia/Adelaide' }))
      .rejects.toMatchObject({ cause: { code: 'ASSESSMENT_RELATIONSHIP_MISMATCH' } satisfies Partial<DailyPlanGenerationError> } satisfies Partial<TransactionError>);
    await expect(repositories.dailyPlans.findAll()).resolves.toEqual([]);
  });
});
