import { StorageTransactionManager } from '../storage/StorageTransactionManager';
import { storageKeys } from '../storage/storageKeys';
import { createDomainRepositories } from './createDomainRepositories';

const dogOwnedKeys = [
  storageKeys.dogs,
  storageKeys.behaviourProfiles,
  storageKeys.behaviourAssessments,
  storageKeys.lessonProgress,
  storageKeys.progress,
  storageKeys.trainingSessions,
  storageKeys.dailyPlans,
  storageKeys.achievements,
] as const;

const ownerOwnedKeys = [
  storageKeys.owners,
  storageKeys.notificationSettings,
  ...dogOwnedKeys,
] as const;

export class OwnershipService {
  constructor(private readonly transactions: StorageTransactionManager) {}

  async deleteDog(dogId: string): Promise<void> {
    await this.transactions.run(dogOwnedKeys, async (storage) => {
      const repositories = createDomainRepositories(storage);
      await this.deleteDogRecords(dogId, repositories);
    });
  }

  async deleteOwner(ownerId: string): Promise<void> {
    await this.transactions.run(ownerOwnedKeys, async (storage) => {
      const repositories = createDomainRepositories(storage);
      const dogs = (await repositories.dogs.findAll()).filter((dog) => dog.ownerId === ownerId);

      for (const dog of dogs) await this.deleteDogRecords(dog.id, repositories);

      const settings = (await repositories.notificationSettings.findAll()).filter((item) => item.ownerId === ownerId);
      for (const item of settings) await repositories.notificationSettings.remove(item.id);
      await repositories.owners.remove(ownerId);
    });
  }

  private async deleteDogRecords(
    dogId: string,
    repositories: ReturnType<typeof createDomainRepositories>,
  ): Promise<void> {
    const childRepositories = [
      repositories.behaviourProfiles,
      repositories.behaviourAssessments,
      repositories.lessonProgress,
      repositories.progress,
      repositories.trainingSessions,
      repositories.dailyPlans,
      repositories.achievements,
    ] as const;

    for (const repository of childRepositories) {
      const records = (await repository.findAll()).filter((record) => record.dogId === dogId);
      for (const record of records) await repository.remove(record.id);
    }

    await repositories.dogs.remove(dogId);
  }
}
