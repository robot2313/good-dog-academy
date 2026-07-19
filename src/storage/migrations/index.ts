import { appStorage } from '../../services/appStorage';
import { storageKeys } from '../storageKeys';
import { MigrationManager } from './MigrationManager';
import { CURRENT_SCHEMA_VERSION } from './SchemaVersion';

export const migrations = [] as const;

export const migrationManager = new MigrationManager(
  appStorage,
  storageKeys.schemaVersion,
  CURRENT_SCHEMA_VERSION,
  migrations,
);

export type { Migration } from './Migration';
export { MigrationError, MigrationManager } from './MigrationManager';
export { CURRENT_SCHEMA_VERSION, isSchemaVersion, type SchemaVersion } from './SchemaVersion';
