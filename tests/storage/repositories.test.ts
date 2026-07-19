import {
  sampleAchievement,
  sampleBehaviourAssessment,
  sampleBehaviourProfile,
  sampleDailyPlan,
  sampleDog,
  sampleNotificationSettings,
  sampleOwner,
  sampleProgress,
  sampleTrainingSession,
} from '../../src/development/seed/sampleData';
import type { Repository } from '../../src/domain/repositories';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { lessonProgress } from '../support/lessonFixtures';

type Entity = { id: string };
type RepositoryCase = {
  name: string;
  entity: Entity;
  update: (entity: Entity) => Entity;
  select: (repositories: ReturnType<typeof createDomainRepositories>) => Repository<Entity>;
};

const cases: RepositoryCase[] = [
  { name: 'Owner', entity: sampleOwner, update: (value) => ({ ...value, displayName: 'Updated Owner' }), select: (r) => r.owners },
  { name: 'Dog', entity: sampleDog, update: (value) => ({ ...value, name: 'Updated Dog' }), select: (r) => r.dogs },
  { name: 'BehaviourProfile', entity: sampleBehaviourProfile, update: (value) => ({ ...value, notes: 'Updated notes' }), select: (r) => r.behaviourProfiles },
  { name: 'BehaviourAssessment', entity: sampleBehaviourAssessment, update: (value) => ({ ...value, completedAt: '2026-07-19T01:00:00.000Z' }), select: (r) => r.behaviourAssessments },
  { name: 'LessonProgress', entity: lessonProgress(), update: (value) => ({ ...value, attempts: 1, status: 'inProgress', lastAttemptedAt: '2026-07-19T01:00:00.000Z' }), select: (r) => r.lessonProgress },
  { name: 'DailyPlan', entity: sampleDailyPlan, update: (value) => ({ ...value, status: 'completed' }), select: (r) => r.dailyPlans },
  { name: 'TrainingSession', entity: sampleTrainingSession, update: (value) => ({ ...value, notes: 'Updated notes' }), select: (r) => r.trainingSessions },
  { name: 'Achievement', entity: sampleAchievement, update: (value) => ({ ...value, title: 'Updated Achievement' }), select: (r) => r.achievements },
  { name: 'Progress', entity: sampleProgress, update: (value) => ({ ...value, sessionsCompleted: 2 }), select: (r) => r.progress },
  { name: 'NotificationSettings', entity: sampleNotificationSettings, update: (value) => ({ ...value, enabled: false }), select: (r) => r.notificationSettings },
];

describe.each(cases)('$name repository', ({ entity, update, select }) => {
  function createRepository(): Repository<Entity> {
    return select(createDomainRepositories(new InMemoryStorageAdapter()));
  }

  it('returns an empty collection for an empty database', async () => {
    await expect(createRepository().findAll()).resolves.toEqual([]);
  });

  it('returns null for a missing record', async () => {
    await expect(createRepository().findById('missing')).resolves.toBeNull();
  });

  it('creates a record', async () => {
    const repository = createRepository();
    await repository.save(entity);
    await expect(repository.findAll()).resolves.toEqual([entity]);
  });

  it('reads a record by id', async () => {
    const repository = createRepository();
    await repository.save(entity);
    await expect(repository.findById(entity.id)).resolves.toEqual(entity);
  });

  it('updates a record without duplicating it', async () => {
    const repository = createRepository();
    const updated = update(entity);
    await repository.save(entity);
    await repository.save(updated);
    await expect(repository.findAll()).resolves.toEqual([updated]);
  });

  it('deletes a record', async () => {
    const repository = createRepository();
    await repository.save(entity);
    await repository.remove(entity.id);
    await expect(repository.findById(entity.id)).resolves.toBeNull();
  });
});
