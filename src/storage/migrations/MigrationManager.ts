import type { StorageAdapter } from '../StorageAdapter';
import type { Migration } from './Migration';
import { isSchemaVersion, type SchemaVersion } from './SchemaVersion';

export class MigrationError extends Error {
  constructor(
    message: string,
    readonly context: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'MigrationError';
  }
}

export class MigrationManager {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly versionKey: string,
    private readonly currentVersion: SchemaVersion,
    private readonly migrations: readonly Migration[],
  ) {}

  async migrateToCurrent(): Promise<SchemaVersion> {
    const storedVersion = await this.storage.getItem<unknown>(this.versionKey);

    if (storedVersion === null) {
      await this.storage.setItem(this.versionKey, this.currentVersion);
      return this.currentVersion;
    }

    if (!isSchemaVersion(storedVersion)) {
      throw new MigrationError('Stored schema version is invalid.', { storedVersion });
    }

    if (storedVersion > this.currentVersion) {
      throw new MigrationError('Stored data uses a newer unsupported schema.', {
        storedVersion,
        currentVersion: this.currentVersion,
      });
    }

    let version = storedVersion;
    while (version < this.currentVersion) {
      const migration = this.migrations.find((candidate) => candidate.fromVersion === version);
      if (!migration || migration.toVersion <= version || migration.toVersion > this.currentVersion) {
        throw new MigrationError('No valid migration path is available.', {
          fromVersion: version,
          currentVersion: this.currentVersion,
        });
      }

      try {
        await migration.migrate(this.storage);
        await this.storage.setItem(this.versionKey, migration.toVersion);
        version = migration.toVersion;
      } catch (cause) {
        throw new MigrationError('A storage migration failed.', {
          fromVersion: migration.fromVersion,
          toVersion: migration.toVersion,
        }, { cause });
      }
    }

    return version;
  }
}
