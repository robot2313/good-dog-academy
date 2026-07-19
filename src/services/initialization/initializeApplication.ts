import { MigrationError, migrationManager } from '../../storage/migrations';
import { InitializationError } from './InitializationError';
import { initializationErrorReporter } from './InitializationErrorReporter';

export type InitializationResult =
  | { ok: true }
  | { ok: false; error: InitializationError };

export async function initializeApplication(): Promise<InitializationResult> {
  try {
    await migrationManager.migrateToCurrent();
    return { ok: true };
  } catch (cause) {
    const error = cause instanceof MigrationError
      ? new InitializationError('MIGRATION_FAILED', { phase: 'storage-migration', ...cause.context }, true, { cause })
      : new InitializationError('UNKNOWN_INITIALIZATION_ERROR', { phase: 'application-bootstrap' }, true, { cause });

    initializationErrorReporter.report(error);
    return { ok: false, error };
  }
}
