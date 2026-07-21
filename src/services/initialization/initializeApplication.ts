import { MigrationError, migrationManager } from '../../storage/migrations';
import { InitializationError } from './InitializationError';
import { initializationErrorReporter } from './InitializationErrorReporter';
import { loadBundledLessonCatalogue, LessonCatalogueError } from '../../features/lessons/catalogue';

export type InitializationResult =
  | { ok: true }
  | { ok: false; error: InitializationError };

export type InitializationDependencies = {
  migrate: () => Promise<unknown>;
  loadLessonCatalogue: () => unknown;
  report: (error: InitializationError) => void;
};

export async function initializeApplication(overrides: Partial<InitializationDependencies> = {}): Promise<InitializationResult> {
  const dependencies: InitializationDependencies = {
    migrate: () => migrationManager.migrateToCurrent(),
    loadLessonCatalogue: loadBundledLessonCatalogue,
    report: (error) => initializationErrorReporter.report(error),
    ...overrides,
  };
  try {
    await dependencies.migrate();
    dependencies.loadLessonCatalogue();
    return { ok: true };
  } catch (cause) {
    const error = cause instanceof MigrationError
      ? new InitializationError('MIGRATION_FAILED', { phase: 'storage-migration', ...cause.context }, true, { cause })
      : cause instanceof LessonCatalogueError
        ? new InitializationError(cause.code, { phase: 'lesson-catalogue-validation', ...cause.context }, false, { cause })
        : new InitializationError('UNKNOWN_INITIALIZATION_ERROR', { phase: 'application-bootstrap' }, true, { cause });

    dependencies.report(error);
    return { ok: false, error };
  }
}
