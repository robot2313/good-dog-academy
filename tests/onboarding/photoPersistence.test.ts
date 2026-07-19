import { emptyDogForm } from '../../src/features/onboarding/types';
import { OnboardingCompletionService } from '../../src/features/onboarding/OnboardingCompletionService';
import type { DogPhotoStorage } from '../../src/features/onboarding/photo/DogPhotoStorage';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { DomainTransactionService } from '../../src/services/DomainTransactionService';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import type { StorageAdapter } from '../../src/storage/StorageAdapter';
import { storageKeys } from '../../src/storage/storageKeys';

const ownerForm = { displayName: 'Taylor', trainingExperience: 'beginner', primaryGoal: 'family-companion' } as const;
const dogForm = { ...emptyDogForm, name: 'Milo', breed: 'Labrador mix', birthday: '2024-03-12', sex: 'male', weight: '24', energyLevel: 'high' } as const;

function serviceWith(storage: InMemoryStorageAdapter, photos: DogPhotoStorage) {
  let id = 0;
  return new OnboardingCompletionService(new DomainTransactionService(new StorageTransactionManager(storage)), (prefix) => `${prefix}-${++id}`, () => '2026-07-19T00:00:00.000Z', photos);
}

class DogCommitFailingStorage implements StorageAdapter {
  constructor(private readonly base: StorageAdapter) {}
  getItem<T>(key: string): Promise<T | null> { return this.base.getItem<T>(key); }
  removeItem(key: string): Promise<void> { return this.base.removeItem(key); }
  async setItem<T>(key: string, value: T): Promise<void> {
    if (key === storageKeys.dogs) throw new Error('dog commit failed');
    await this.base.setItem(key, value);
  }
}

describe('onboarding dog photo persistence', () => {
  it('copies a selected temporary image only during completion and stores the managed URI', async () => {
    const storage = new InMemoryStorageAdapter();
    const photos: DogPhotoStorage = { persist: jest.fn(async (_uri, dogId) => `file:///documents/dog-photos/${dogId}.jpg`), remove: jest.fn(async () => undefined) };
    const result = await serviceWith(storage, photos).complete(ownerForm, { ...dogForm, photoUri: 'file:///cache/picker.jpg' });
    expect(photos.persist).toHaveBeenCalledWith('file:///cache/picker.jpg', result.dog.id);
    expect(result.dog.photoUri).toBe(`file:///documents/dog-photos/${result.dog.id}.jpg`);
    await expect(createDomainRepositories(storage).dogs.findById(result.dog.id)).resolves.toEqual(result.dog);
  });

  it('does not copy anything when the optional photo is omitted', async () => {
    const photos: DogPhotoStorage = { persist: jest.fn(), remove: jest.fn() };
    const result = await serviceWith(new InMemoryStorageAdapter(), photos).complete(ownerForm, { ...dogForm, photoUri: null });
    expect(photos.persist).not.toHaveBeenCalled();
    expect(result.dog.photoUri).toBeNull();
  });

  it('does not persist domain records if photo copying fails', async () => {
    const storage = new InMemoryStorageAdapter();
    const photos: DogPhotoStorage = { persist: jest.fn(async () => { throw new Error('copy failed'); }), remove: jest.fn() };
    await expect(serviceWith(storage, photos).complete(ownerForm, { ...dogForm, photoUri: 'file:///cache/picker.jpg' })).rejects.toThrow('copy failed');
    expect(storage.snapshot()).toEqual({});
  });

  it('removes the managed copy when the onboarding transaction fails', async () => {
    const base = new InMemoryStorageAdapter();
    const photos: DogPhotoStorage = { persist: jest.fn(async () => 'file:///documents/dog-photos/dog.jpg'), remove: jest.fn(async () => undefined) };
    let id = 0;
    const service = new OnboardingCompletionService(new DomainTransactionService(new StorageTransactionManager(new DogCommitFailingStorage(base))), (prefix) => `${prefix}-${++id}`, () => '2026-07-19T00:00:00.000Z', photos);
    await expect(service.complete(ownerForm, { ...dogForm, photoUri: 'file:///cache/picker.jpg' })).rejects.toThrow();
    expect(photos.remove).toHaveBeenCalledWith('file:///documents/dog-photos/dog.jpg');
    expect(base.snapshot()).toEqual({});
  });
});
