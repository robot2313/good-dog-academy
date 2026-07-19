import {
  sampleBehaviourProfile,
  sampleDog,
  sampleOwner,
} from '../../src/development/seed/sampleData';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { DomainTransactionService } from '../../src/services/DomainTransactionService';
import { StorageTransactionManager, TransactionError } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';

describe('DomainTransactionService', () => {
  it('saves an owner setup atomically', async () => {
    const storage = new InMemoryStorageAdapter();
    const service = new DomainTransactionService(new StorageTransactionManager(storage));
    await service.saveOwnerSetup({ owner: sampleOwner, dog: sampleDog, behaviourProfile: sampleBehaviourProfile });

    const repositories = createDomainRepositories(storage);
    await expect(repositories.owners.findById(sampleOwner.id)).resolves.toEqual(sampleOwner);
    await expect(repositories.dogs.findById(sampleDog.id)).resolves.toEqual(sampleDog);
    await expect(repositories.behaviourProfiles.findById(sampleBehaviourProfile.id)).resolves.toEqual(sampleBehaviourProfile);
    await expect(repositories.dailyPlans.findAll()).resolves.toEqual([]);
  });

  it('saves none of the setup when any entity is invalid', async () => {
    const storage = new InMemoryStorageAdapter();
    const service = new DomainTransactionService(new StorageTransactionManager(storage));
    const invalidProfile = { ...sampleBehaviourProfile, energyLevel: 'extreme' } as unknown as typeof sampleBehaviourProfile;

    await expect(service.saveOwnerSetup({ owner: sampleOwner, dog: sampleDog, behaviourProfile: invalidProfile })).rejects.toBeInstanceOf(TransactionError);
    expect(storage.snapshot()).toEqual({});
  });
});
