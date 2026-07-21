import type { BehaviourProfile } from '../../src/domain/models';
import { DailyPlanGenerator } from '../../src/features/dailyPlan/DailyPlanGenerator';
import { DailyPlanManagementService } from '../../src/features/dailyPlan/DailyPlanManagementService';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { foundationLesson } from '../support/lessonFixtures';

const profile: BehaviourProfile = {
  id: 'profile-1', dogId: 'dog-1', energyLevel: 'medium', foodMotivation: 'medium', challenges: [],
  skillScores: { recall: 25, 'loose-lead-walking': 50, jumping: 50, barking: 50, chewing: 50, reactivity: 50, 'house-training': 50, confidence: 50, 'impulse-control': 50, focus: 75 },
  unknownSkills: [], assessmentId: 'assessment-1', notes: '', createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('DailyPlanManagementService', () => {
  function setup() {
    const storage = new InMemoryStorageAdapter();
    const catalogue = LessonCatalogue.load([
      foundationLesson,
      { ...foundationLesson, id: 'fixture-recall-foundation', skill: 'recall' as const },
      { ...foundationLesson, id: 'fixture-confidence-foundation', skill: 'confidence' as const },
    ]);
    return { storage, repositories: createDomainRepositories(storage), service: new DailyPlanManagementService(new StorageTransactionManager(storage), new DailyPlanGenerator(catalogue), () => '2026-07-22T02:00:00.000Z') };
  }

  it('replaces scheduled lessons with eligible alternatives', async () => {
    const { repositories, service } = setup();
    await repositories.dailyPlans.save({ id: 'plan-1', dogId: 'dog-1', date: '2026-07-22', lessonIds: [foundationLesson.id], status: 'scheduled', createdAt: '2026-07-22T00:00:00.000Z', updatedAt: '2026-07-22T00:00:00.000Z' });
    const refreshed = await service.refresh('plan-1', 'dog-1', profile, 24, []);
    expect(refreshed.lessonIds).toEqual(['fixture-recall-foundation']);
    expect(refreshed.updatedAt).toBe('2026-07-22T02:00:00.000Z');
  });

  it('records a confirmed rest day without deleting the plan', async () => {
    const { repositories, service } = setup();
    await repositories.dailyPlans.save({ id: 'plan-1', dogId: 'dog-1', date: '2026-07-22', lessonIds: [foundationLesson.id], status: 'scheduled', createdAt: '2026-07-22T00:00:00.000Z', updatedAt: '2026-07-22T00:00:00.000Z' });
    await expect(service.skip('plan-1', 'dog-1')).resolves.toMatchObject({ status: 'skipped' });
    await expect(repositories.dailyPlans.findById('plan-1')).resolves.toMatchObject({ status: 'skipped' });
  });
});
