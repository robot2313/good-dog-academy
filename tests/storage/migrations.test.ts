import type { Migration } from '../../src/storage/migrations/Migration';
import { MigrationError, MigrationManager } from '../../src/storage/migrations/MigrationManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';

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
    const migration: Migration = { fromVersion: 1, toVersion: 2, migrate: async (adapter) => adapter.setItem('migrated', true) };
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
