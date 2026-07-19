import { appStorage } from '../../services/appStorage';
import { storageKeys } from '../storageKeys';
import { MigrationManager } from './MigrationManager';
import { migration1To2 } from './Migration1To2';
import { migration2To3 } from './Migration2To3';
import { CURRENT_SCHEMA_VERSION } from './SchemaVersion';

export const migrations = [migration1To2, migration2To3] as const;

export const migrationManager = new MigrationManager(
  appStorage,
  storageKeys.schemaVersion,
  CURRENT_SCHEMA_VERSION,
  migrations,
);

export type { Migration } from './Migration';
export { MigrationError, MigrationManager } from './MigrationManager';
export { CURRENT_SCHEMA_VERSION, isSchemaVersion, type SchemaVersion } from './SchemaVersion';
export { migration1To2 } from './Migration1To2';
export { migration2To3 } from './Migration2To3';
