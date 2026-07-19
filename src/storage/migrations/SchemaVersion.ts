export type SchemaVersion = number;

export const CURRENT_SCHEMA_VERSION: SchemaVersion = 4;

export function isSchemaVersion(value: unknown): value is SchemaVersion {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
