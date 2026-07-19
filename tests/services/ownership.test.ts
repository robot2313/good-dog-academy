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
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { OwnershipService } from '../../src/services/OwnershipService';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { lessonProgress } from '../support/lessonFixtures';

async function populate(storage: InMemoryStorageAdapter) {
  const repositories = createDomainRepositories(storage);
  await repositories.owners.save(sampleOwner);
  await repositories.dogs.save(sampleDog);
  await repositories.behaviourProfiles.save(sampleBehaviourProfile);
  await repositories.behaviourAssessments.save(sampleBehaviourAssessment);
  await repositories.lessonProgress.save(lessonProgress());
  await repositories.progress.save(sampleProgress);
  await repositories.trainingSessions.save(sampleTrainingSession);
  await repositories.dailyPlans.save(sampleDailyPlan);
  await repositories.achievements.save(sampleAchievement);
  await repositories.notificationSettings.save(sampleNotificationSettings);
  return repositories;
}

describe('OwnershipService', () => {
  it('deleting a dog removes every dog-owned record but preserves the owner', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = await populate(storage);
    await new OwnershipService(new StorageTransactionManager(storage)).deleteDog(sampleDog.id);

    await expect(repositories.dogs.findAll()).resolves.toEqual([]);
    await expect(repositories.behaviourProfiles.findAll()).resolves.toEqual([]);
    await expect(repositories.behaviourAssessments.findAll()).resolves.toEqual([]);
    await expect(repositories.lessonProgress.findAll()).resolves.toEqual([]);
    await expect(repositories.progress.findAll()).resolves.toEqual([]);
    await expect(repositories.trainingSessions.findAll()).resolves.toEqual([]);
    await expect(repositories.dailyPlans.findAll()).resolves.toEqual([]);
    await expect(repositories.achievements.findAll()).resolves.toEqual([]);
    await expect(repositories.owners.findById(sampleOwner.id)).resolves.toEqual(sampleOwner);
  });

  it('deleting an owner removes the owner, settings, dogs, and dog-owned records', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = await populate(storage);
    await new OwnershipService(new StorageTransactionManager(storage)).deleteOwner(sampleOwner.id);

    await expect(repositories.owners.findAll()).resolves.toEqual([]);
    await expect(repositories.notificationSettings.findAll()).resolves.toEqual([]);
    await expect(repositories.dogs.findAll()).resolves.toEqual([]);
    await expect(repositories.behaviourProfiles.findAll()).resolves.toEqual([]);
    await expect(repositories.behaviourAssessments.findAll()).resolves.toEqual([]);
    await expect(repositories.lessonProgress.findAll()).resolves.toEqual([]);
    await expect(repositories.progress.findAll()).resolves.toEqual([]);
    await expect(repositories.trainingSessions.findAll()).resolves.toEqual([]);
    await expect(repositories.dailyPlans.findAll()).resolves.toEqual([]);
    await expect(repositories.achievements.findAll()).resolves.toEqual([]);
  });
});
