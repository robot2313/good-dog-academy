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
import { DevelopmentResetService, DevelopmentOnlyError } from '../../src/development/reset/DevelopmentResetService';
import { performDevelopmentReset } from '../../src/development/reset/DevelopmentResetController';
import type { DogPhotoStorage } from '../../src/features/onboarding/photo/DogPhotoStorage';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { OwnershipService } from '../../src/services/OwnershipService';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { lessonProgress } from '../support/lessonFixtures';

async function populate() {
  const storage = new InMemoryStorageAdapter();
  const repositories = createDomainRepositories(storage);
  const dog = { ...sampleDog, photoUri: 'file:///documents/dog-photos/dog.jpg' };
  await repositories.owners.save(sampleOwner);
  await repositories.dogs.save(dog);
  await repositories.behaviourProfiles.save(sampleBehaviourProfile);
  await repositories.behaviourAssessments.save(sampleBehaviourAssessment);
  await repositories.lessonProgress.save(lessonProgress());
  await repositories.progress.save(sampleProgress);
  await repositories.trainingSessions.save(sampleTrainingSession);
  await repositories.dailyPlans.save(sampleDailyPlan);
  await repositories.achievements.save(sampleAchievement);
  await repositories.notificationSettings.save(sampleNotificationSettings);
  return { storage, repositories, dog };
}

describe('DevelopmentResetService', () => {
  it('cascades all owner data and removes managed dog photos', async () => {
    const { storage, repositories, dog } = await populate();
    const photos: DogPhotoStorage = { persist: jest.fn(), remove: jest.fn(async () => undefined) };
    const service = new DevelopmentResetService(repositories, new OwnershipService(new StorageTransactionManager(storage)), photos, true);
    await service.resetAppData();

    await expect(repositories.owners.findAll()).resolves.toEqual([]);
    await expect(repositories.dogs.findAll()).resolves.toEqual([]);
    await expect(repositories.behaviourProfiles.findAll()).resolves.toEqual([]);
    await expect(repositories.behaviourAssessments.findAll()).resolves.toEqual([]);
    await expect(repositories.lessonProgress.findAll()).resolves.toEqual([]);
    await expect(repositories.progress.findAll()).resolves.toEqual([]);
    await expect(repositories.trainingSessions.findAll()).resolves.toEqual([]);
    await expect(repositories.dailyPlans.findAll()).resolves.toEqual([]);
    await expect(repositories.achievements.findAll()).resolves.toEqual([]);
    await expect(repositories.notificationSettings.findAll()).resolves.toEqual([]);
    expect(photos.remove).toHaveBeenCalledWith(dog.photoUri);
  });

  it('retains records and does not clean photos when ownership deletion fails', async () => {
    const { repositories } = await populate();
    const photos: DogPhotoStorage = { persist: jest.fn(), remove: jest.fn() };
    const service = new DevelopmentResetService(repositories, { deleteOwner: jest.fn(async () => { throw new Error('delete failed'); }) }, photos, true);
    await expect(service.resetAppData()).rejects.toThrow('delete failed');
    await expect(repositories.owners.findById(sampleOwner.id)).resolves.toEqual(sampleOwner);
    expect(photos.remove).not.toHaveBeenCalled();
  });

  it('refuses to execute when development mode is disabled', async () => {
    const { repositories } = await populate();
    const service = new DevelopmentResetService(repositories, { deleteOwner: jest.fn() }, { persist: jest.fn(), remove: jest.fn() }, false);
    await expect(service.resetAppData()).rejects.toBeInstanceOf(DevelopmentOnlyError);
  });

  it('reports structured failures and does not call the success route', async () => {
    const reporter = { report: jest.fn() };
    const onSuccess = jest.fn();
    const result = await performDevelopmentReset({ resetAppData: jest.fn(async () => { throw new Error('reset failed'); }) }, reporter, onSuccess);
    expect(result.ok).toBe(false);
    expect(reporter.report).toHaveBeenCalledWith(expect.objectContaining({ code: 'DEVELOPMENT_RESET_FAILED' }));
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
