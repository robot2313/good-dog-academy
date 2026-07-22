export type LessonLibraryErrorCode =
  | 'MISSING_SELECTED_DOG'
  | 'CORRUPT_PROGRESS'
  | 'LESSON_NOT_FOUND';

export class LessonLibraryError extends Error {
  constructor(readonly code: LessonLibraryErrorCode, readonly context: Readonly<Record<string, unknown>> = {}) {
    super(code);
    this.name = 'LessonLibraryError';
  }
}
