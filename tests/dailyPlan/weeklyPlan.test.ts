import type { BehaviourProfile } from '../../src/domain/models';
import { DailyPlanGenerator } from '../../src/features/dailyPlan/DailyPlanGenerator';
import { WeeklyPlanService } from '../../src/features/dailyPlan/WeeklyPlanService';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { foundationLesson, recallLesson } from '../support/lessonFixtures';

const profile: BehaviourProfile = {
  id: 'profile-1', dogId: 'dog-1', energyLevel: 'medium', foodMotivation: 'medium', challenges: [],
  skillScores: { recall: 25, 'loose-lead-walking': 50, jumping: 50, barking: 50, chewing: 50, reactivity: 50, 'house-training': 50, confidence: 50, 'impulse-control': 50, focus: 75 },
  unknownSkills: [], assessmentId: 'assessment-1', notes: '', createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('WeeklyPlanService', () => {
  function setup() {
    const storage = new InMemoryStorageAdapter();
    const catalogue = LessonCatalogue.load([
      foundationLesson,
      { ...foundationLesson, id: 'fixture-recall-foundation', skill: 'recall' as const },
      { ...foundationLesson, id: 'fixture-confidence-foundation', skill: 'confidence' as const },
    ]);
    let id = 0;
    return { repositories: createDomainRepositories(storage), service: new WeeklyPlanService(new StorageTransactionManager(storage), catalogue, new DailyPlanGenerator(catalogue), () => `plan-${++id}`, () => '2026-07-22T01:00:00.000Z') };
  }

  it('creates exactly seven plans and is idempotent', async () => {
    const { repositories, service } = setup();
    const first = await service.ensureWeek('dog-1', profile, 24, [], '2026-07-22');
    const second = await service.ensureWeek('dog-1', profile, 24, [], '2026-07-22');
    expect(first).toHaveLength(7);
    expect(second).toEqual(first);
    await expect(repositories.dailyPlans.findAll()).resolves.toHaveLength(7);
    expect(first.map((plan) => plan.date)).toEqual(['2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26', '2026-07-27', '2026-07-28']);
  });

  it('preserves an existing completed day', async () => {
    const { repositories, service } = setup();
    const existing = { id: 'existing-plan', dogId: 'dog-1', date: '2026-07-24', lessonIds: [foundationLesson.id], status: 'completed' as const, createdAt: '2026-07-20T00:00:00.000Z', updatedAt: '2026-07-21T00:00:00.000Z' };
    await repositories.dailyPlans.save(existing);
    const week = await service.ensureWeek('dog-1', profile, 24, [], '2026-07-22');
    expect(week.find((plan) => plan.date === existing.date)).toEqual(existing);
  });

  it('supports eligible manual selection and reversible rest days', async () => {
    const { service } = setup();
    const [plan] = await service.ensureWeek('dog-1', profile, 24, [], '2026-07-22');
    const customised = await service.setLessons(plan.id, 'dog-1', ['fixture-confidence-foundation'], 24, []);
    expect(customised.lessonIds).toEqual(['fixture-confidence-foundation']);
    const skipped = await service.toggleRestDay(plan.id, 'dog-1');
    expect(skipped.status).toBe('skipped');
    await expect(service.toggleRestDay(plan.id, 'dog-1')).resolves.toMatchObject({ status: 'scheduled' });
  });

  it('rejects a locked manual lesson', async () => {
    const storage = new InMemoryStorageAdapter();
    const catalogue = LessonCatalogue.load([foundationLesson, recallLesson]);
    const service = new WeeklyPlanService(new StorageTransactionManager(storage), catalogue, new DailyPlanGenerator(catalogue), () => 'plan-1', () => '2026-07-22T01:00:00.000Z');
    const [plan] = await service.ensureWeek('dog-1', profile, 24, [], '2026-07-22');
    await expect(service.setLessons(plan.id, 'dog-1', [recallLesson.id], 24, [])).rejects.toThrow('not eligible');
  });
});
