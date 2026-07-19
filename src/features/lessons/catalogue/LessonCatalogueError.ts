export type LessonCatalogueErrorCode =
  | 'INVALID_LESSON_CATALOGUE'
  | 'DUPLICATE_LESSON_IDS'
  | 'MISSING_LESSON_PREREQUISITES'
  | 'CIRCULAR_LESSON_PREREQUISITES';

export class LessonCatalogueError extends Error {
  constructor(readonly code: LessonCatalogueErrorCode, readonly context: Record<string, unknown>) {
    super(code);
    this.name = 'LessonCatalogueError';
  }
}
