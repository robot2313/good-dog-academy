import { LocalDataDeletionService } from '../../src/features/privacy/LocalDataDeletionService';
import { storageKeys } from '../../src/storage/storageKeys';
import type { StorageAdapter } from '../../src/storage/StorageAdapter';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';

describe('LocalDataDeletionService', () => {
  it('atomically clears every known app storage key and managed photo', async () => {
    const storage = new InMemoryStorageAdapter();
    for (const [index, key] of Object.values(storageKeys).entries()) {
      await storage.setItem(key, { index });
    }
    await storage.setItem('@unrelated/key', { preserved: true });
    const photoCleaner = { removeAllManagedPhotos: jest.fn(async () => undefined) };

    const result = await new LocalDataDeletionService(storage, photoCleaner).deleteAllLocalData();

    expect(result).toEqual({ managedPhotosRemoved: true });
    expect(photoCleaner.removeAllManagedPhotos).toHaveBeenCalledTimes(1);
    expect(storage.snapshot()).toEqual({ '@unrelated/key': { preserved: true } });
  });

  it('restores already-cleared keys if the storage commit fails', async () => {
    const base = new InMemoryStorageAdapter();
    const keys = Object.values(storageKeys);
    for (const [index, key] of keys.entries()) await base.setItem(key, { index });
    const original = base.snapshot();
    let failed = false;
    const storage: StorageAdapter = {
      getItem: <T>(key: string) => base.getItem<T>(key),
      setItem: <T>(key: string, value: T) => base.setItem(key, value),
      removeItem: async (key: string) => {
        if (key === keys[1] && !failed) {
          failed = true;
          throw new Error('simulated write failure');
        }
        await base.removeItem(key);
      },
    };
    const photoCleaner = { removeAllManagedPhotos: jest.fn(async () => undefined) };

    await expect(new LocalDataDeletionService(storage, photoCleaner).deleteAllLocalData()).rejects.toThrow();

    expect(base.snapshot()).toEqual(original);
    expect(photoCleaner.removeAllManagedPhotos).not.toHaveBeenCalled();
  });

  it('reports a managed-photo cleanup failure after records are safely deleted', async () => {
    const storage = new InMemoryStorageAdapter();
    await storage.setItem(storageKeys.dogs, [{ id: 'dog-1' }]);
    const photoCleaner = { removeAllManagedPhotos: jest.fn(async () => { throw new Error('file locked'); }) };

    const result = await new LocalDataDeletionService(storage, photoCleaner).deleteAllLocalData();

    expect(result).toEqual({ managedPhotosRemoved: false });
    expect(storage.snapshot()).toEqual({});
  });
});
