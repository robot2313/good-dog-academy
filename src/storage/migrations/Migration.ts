import type { StorageAdapter } from '../StorageAdapter';
import type { SchemaVersion } from './SchemaVersion';

export interface Migration {
  readonly fromVersion: SchemaVersion;
  readonly toVersion: SchemaVersion;
  readonly keys: readonly string[];
  migrate(storage: StorageAdapter): Promise<void>;
}
