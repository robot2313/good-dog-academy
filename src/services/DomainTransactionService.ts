import type { BehaviourProfile, DailyPlan, Dog, Owner } from '../domain/models';
import { StorageTransactionManager } from '../storage/StorageTransactionManager';
import { storageKeys } from '../storage/storageKeys';
import { createDomainRepositories } from './createDomainRepositories';

const ownerSetupKeys = [
  storageKeys.owners,
  storageKeys.dogs,
  storageKeys.behaviourProfiles,
  storageKeys.dailyPlans,
] as const;

export type OwnerSetup = {
  owner: Owner;
  dog: Dog;
  behaviourProfile: BehaviourProfile;
  dailyPlan: DailyPlan;
};

export class DomainTransactionService {
  constructor(private readonly transactions: StorageTransactionManager) {}

  async saveOwnerSetup(setup: OwnerSetup): Promise<void> {
    await this.transactions.run(ownerSetupKeys, async (storage) => {
      const repositories = createDomainRepositories(storage);
      await repositories.owners.save(setup.owner);
      await repositories.dogs.save(setup.dog);
      await repositories.behaviourProfiles.save(setup.behaviourProfile);
      await repositories.dailyPlans.save(setup.dailyPlan);
    });
  }
}
