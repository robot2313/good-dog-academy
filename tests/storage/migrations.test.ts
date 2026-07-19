import type { Migration } from '../../src/storage/migrations/Migration';
import { MigrationError, MigrationManager } from '../../src/storage/migrations/MigrationManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { migration1To2 } from '../../src/storage/migrations/Migration1To2';
import { storageKeys } from '../../src/storage/storageKeys';
import type { StorageAdapter } from '../../src/storage/StorageAdapter';

const version1Owner = {
  id: 'owner-v1', email: 'legacy@example.com', displayName: 'Legacy Owner',
  createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-02T00:00:00.000Z',
};
const version1Dog = {
  id: 'dog-v1', ownerId: 'owner-v1', name: 'Scout', breed: 'Kelpie', dateOfBirth: '2022-05-10',
  sex: 'female', weightKg: 18, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-02T00:00:00.000Z',
};

class DogWriteFailingStorage implements StorageAdapter {
  constructor(private readonly base: StorageAdapter) {}
  getItem<T>(key: string): Promise<T | null> { return this.base.getItem<T>(key); }
  removeItem(key: string): Promise<void> { return this.base.removeItem(key); }
  async setItem<T>(key: string, value: T): Promise<void> {
    if (key === storageKeys.dogs) throw new Error('Injected dog migration failure');
    await this.base.setItem(key, value);
  }
}

describe('MigrationManager', () => {
  const key = 'schema-version';

  it('initializes an unversioned empty database at the current version', async () => {
    const storage = new InMemoryStorageAdapter();
    await expect(new MigrationManager(storage, key, 1, []).migrateToCurrent()).resolves.toBe(1);
    await expect(storage.getItem(key)).resolves.toBe(1);
  });

  it('does nothing when already current', async () => {
    const storage = new InMemoryStorageAdapter();
    await storage.setItem(key, 1);
    await expect(new MigrationManager(storage, key, 1, []).migrateToCurrent()).resolves.toBe(1);
  });

  it('runs ordered migrations and updates the version', async () => {
    const storage = new InMemoryStorageAdapter();
    await storage.setItem(key, 1);
    const migration: Migration = { fromVersion: 1, toVersion: 2, keys: ['migrated'], migrate: async (adapter) => adapter.setItem('migrated', true) };
    await expect(new MigrationManager(storage, key, 2, [migration]).migrateToCurrent()).resolves.toBe(2);
    await expect(storage.getItem('migrated')).resolves.toBe(true);
    await expect(storage.getItem(key)).resolves.toBe(2);
  });

  it('rejects invalid, newer, and unmigratable versions', async () => {
    const invalid = new InMemoryStorageAdapter();
    await invalid.setItem(key, 'one');
    await expect(new MigrationManager(invalid, key, 1, []).migrateToCurrent()).rejects.toBeInstanceOf(MigrationError);

    const newer = new InMemoryStorageAdapter();
    await newer.setItem(key, 2);
    await expect(new MigrationManager(newer, key, 1, []).migrateToCurrent()).rejects.toBeInstanceOf(MigrationError);

    const missingPath = new InMemoryStorageAdapter();
    await missingPath.setItem(key, 1);
    await expect(new MigrationManager(missingPath, key, 2, []).migrateToCurrent()).rejects.toBeInstanceOf(MigrationError);
  });
});

describe('schema migration 1 to 2', () => {
  async function version1Storage() {
    const storage = new InMemoryStorageAdapter();
    await storage.setItem(storageKeys.schemaVersion, 1);
    await storage.setItem(storageKeys.owners, [version1Owner]);
    await storage.setItem(storageKeys.dogs, [version1Dog]);
    return storage;
  }

  it('preserves existing values, relationships, and applies valid defaults', async () => {
    const storage = await version1Storage();
    await new MigrationManager(storage, storageKeys.schemaVersion, 2, [migration1To2]).migrateToCurrent();
    const [owner] = await storage.getItem<Array<Record<string, unknown>>>(storageKeys.owners) ?? [];
    const [dog] = await storage.getItem<Array<Record<string, unknown>>>(storageKeys.dogs) ?? [];
    expect(owner).toMatchObject({ ...version1Owner, trainingExperience: 'beginner', primaryGoal: 'family-companion' });
    expect(dog).toMatchObject({ ...version1Dog, breedUnknown: false, birthdayEstimated: false, estimatedAgeYears: null, weightUnit: 'kg', energyLevel: 'medium', photoUri: null });
    expect(dog.ownerId).toBe(owner.id);
    await expect(storage.getItem(storageKeys.schemaVersion)).resolves.toBe(2);
  });

  it('does not leave partially migrated records after a failed write', async () => {
    const base = await version1Storage();
    const before = base.snapshot();
    await expect(new MigrationManager(new DogWriteFailingStorage(base), storageKeys.schemaVersion, 2, [migration1To2]).migrateToCurrent()).rejects.toBeInstanceOf(MigrationError);
    expect(base.snapshot()).toEqual(before);
  });

  it('is safe and idempotent when startup runs again', async () => {
    const storage = await version1Storage();
    const manager = new MigrationManager(storage, storageKeys.schemaVersion, 2, [migration1To2]);
    await manager.migrateToCurrent();
    const once = storage.snapshot();
    await manager.migrateToCurrent();
    expect(storage.snapshot()).toEqual(once);
  });
});
