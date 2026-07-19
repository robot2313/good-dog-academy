import { emptyDogForm } from '../../src/features/onboarding/types';
import { OnboardingCompletionService } from '../../src/features/onboarding/OnboardingCompletionService';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { DomainTransactionService } from '../../src/services/DomainTransactionService';
import { StorageTransactionManager, TransactionError } from '../../src/storage/StorageTransactionManager';
import type { StorageAdapter } from '../../src/storage/StorageAdapter';
import { storageKeys } from '../../src/storage/storageKeys';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';

const ownerForm = { displayName: 'Taylor', trainingExperience: 'beginner', primaryGoal: 'family-companion' } as const;
const dogForm = { ...emptyDogForm, name: 'Milo', breed: 'Labrador mix', birthday: '2024-03-12', sex: 'male', weight: '24', energyLevel: 'high' } as const;

class CommitFailingStorage implements StorageAdapter {
  constructor(private readonly base: StorageAdapter) {}
  getItem<T>(key: string): Promise<T | null> { return this.base.getItem<T>(key); }
  removeItem(key: string): Promise<void> { return this.base.removeItem(key); }
  async setItem<T>(key: string, value: T): Promise<void> {
    if (key === storageKeys.dogs) throw new Error('Injected failure');
    await this.base.setItem(key, value);
  }
}

function createService(storage: StorageAdapter) {
  let counter = 0;
  return new OnboardingCompletionService(
    new DomainTransactionService(new StorageTransactionManager(storage)),
    (prefix) => `${prefix}-${++counter}`,
    () => '2026-07-19T00:00:00.000Z',
  );
}

describe('OnboardingCompletionService', () => {
  it('atomically saves owner, dog, and initial behaviour profile without a plan', async () => {
    const storage = new InMemoryStorageAdapter();
    const result = await createService(storage).complete(ownerForm, dogForm);
    const repositories = createDomainRepositories(storage);
    await expect(repositories.owners.findById(result.owner.id)).resolves.toEqual(result.owner);
    await expect(repositories.dogs.findById(result.dog.id)).resolves.toEqual(result.dog);
    await expect(repositories.behaviourProfiles.findById(result.behaviourProfile.id)).resolves.toEqual(result.behaviourProfile);
    await expect(repositories.dailyPlans.findAll()).resolves.toEqual([]);
  });

  it('leaves no partial onboarding records when persistent commit fails', async () => {
    const base = new InMemoryStorageAdapter();
    await expect(createService(new CommitFailingStorage(base)).complete(ownerForm, dogForm)).rejects.toBeInstanceOf(TransactionError);
    expect(base.snapshot()).toEqual({});
  });
});
