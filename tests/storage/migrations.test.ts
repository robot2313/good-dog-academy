import type { Migration } from '../../src/storage/migrations/Migration';
import { MigrationError, MigrationManager } from '../../src/storage/migrations/MigrationManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { migration1To2 } from '../../src/storage/migrations/Migration1To2';
import { migration2To3 } from '../../src/storage/migrations/Migration2To3';
import { migration3To4 } from '../../src/storage/migrations/Migration3To4';
import { behaviourSkills } from '../../src/domain/models';
import { lessonProgress } from '../support/lessonFixtures';
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

class ProfileWriteFailingStorage implements StorageAdapter {
  constructor(private readonly base: StorageAdapter) {}
  getItem<T>(key: string): Promise<T | null> { return this.base.getItem<T>(key); }
  removeItem(key: string): Promise<void> { return this.base.removeItem(key); }
  async setItem<T>(key: string, value: T): Promise<void> {
    if (key === storageKeys.behaviourProfiles) throw new Error('Injected profile migration failure');
    await this.base.setItem(key, value);
  }
}

class LessonProgressWriteFailingStorage implements StorageAdapter {
  constructor(private readonly base: StorageAdapter) {}
  getItem<T>(key: string): Promise<T | null> { return this.base.getItem<T>(key); }
  removeItem(key: string): Promise<void> { return this.base.removeItem(key); }
  async setItem<T>(key: string, value: T): Promise<void> {
    if (key === storageKeys.lessonProgress) throw new Error('Injected lesson progress migration failure');
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

describe('schema migration 2 to 3', () => {
  const version2Profile = { id: 'profile-v2', dogId: 'dog-v1', energyLevel: 'high', confidenceLevel: 'medium', foodMotivation: 'high', challenges: ['recall'], notes: 'Preserve this', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-02T00:00:00.000Z' };
  async function version2Storage() {
    const storage = new InMemoryStorageAdapter();
    await storage.setItem(storageKeys.schemaVersion, 2);
    await storage.setItem(storageKeys.behaviourProfiles, [version2Profile]);
    return storage;
  }

  it('preserves profile values, removes the obsolete field, and applies neutral assessment defaults', async () => {
    const storage = await version2Storage();
    await new MigrationManager(storage, storageKeys.schemaVersion, 3, [migration2To3]).migrateToCurrent();
    const [profile] = await storage.getItem<Array<Record<string, unknown>>>(storageKeys.behaviourProfiles) ?? [];
    expect(profile).toMatchObject({ id: version2Profile.id, dogId: version2Profile.dogId, energyLevel: 'high', foodMotivation: 'high', challenges: ['recall'], notes: 'Preserve this', assessmentId: null });
    expect(profile).not.toHaveProperty('confidenceLevel');
    expect(profile.unknownSkills).toEqual(behaviourSkills);
    expect(Object.values(profile.skillScores as Record<string, number>)).toEqual(Array(10).fill(50));
    await expect(storage.getItem(storageKeys.schemaVersion)).resolves.toBe(3);
  });

  it('does not leave a partial migration after a failed write', async () => {
    const base = await version2Storage();
    const before = base.snapshot();
    await expect(new MigrationManager(new ProfileWriteFailingStorage(base), storageKeys.schemaVersion, 3, [migration2To3]).migrateToCurrent()).rejects.toBeInstanceOf(MigrationError);
    expect(base.snapshot()).toEqual(before);
  });

  it('is idempotent when startup runs again', async () => {
    const storage = await version2Storage();
    const manager = new MigrationManager(storage, storageKeys.schemaVersion, 3, [migration2To3]);
    await manager.migrateToCurrent();
    const once = storage.snapshot();
    await manager.migrateToCurrent();
    expect(storage.snapshot()).toEqual(once);
  });
});

describe('schema migration 3 to 4', () => {
  async function version3Storage(withPreReleaseProgress = true) {
    const storage = new InMemoryStorageAdapter();
    await storage.setItem(storageKeys.schemaVersion, 3);
    await storage.setItem(storageKeys.owners, [version1Owner]);
    if (withPreReleaseProgress) await storage.setItem(storageKeys.lessonProgress, [lessonProgress()]);
    return storage;
  }

  it('preserves existing records and never creates lesson progress automatically', async () => {
    const withProgress = await version3Storage();
    await new MigrationManager(withProgress, storageKeys.schemaVersion, 4, [migration3To4]).migrateToCurrent();
    await expect(withProgress.getItem(storageKeys.owners)).resolves.toEqual([version1Owner]);
    await expect(withProgress.getItem(storageKeys.lessonProgress)).resolves.toEqual([lessonProgress()]);
    await expect(withProgress.getItem(storageKeys.schemaVersion)).resolves.toBe(4);

    const withoutProgress = await version3Storage(false);
    await new MigrationManager(withoutProgress, storageKeys.schemaVersion, 4, [migration3To4]).migrateToCurrent();
    await expect(withoutProgress.getItem(storageKeys.lessonProgress)).resolves.toBeNull();
  });

  it('rolls back the schema update and data when migration writes fail', async () => {
    const base = await version3Storage();
    const before = base.snapshot();
    await expect(new MigrationManager(new LessonProgressWriteFailingStorage(base), storageKeys.schemaVersion, 4, [migration3To4]).migrateToCurrent()).rejects.toBeInstanceOf(MigrationError);
    expect(base.snapshot()).toEqual(before);
  });

  it('is idempotent on repeated startup', async () => {
    const storage = await version3Storage();
    const manager = new MigrationManager(storage, storageKeys.schemaVersion, 4, [migration3To4]);
    await manager.migrateToCurrent();
    const once = storage.snapshot();
    await manager.migrateToCurrent();
    expect(storage.snapshot()).toEqual(once);
  });
});
