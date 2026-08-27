export type DogLearningPassportErrorCode =
  | 'INVALID_OWNER_ID'
  | 'INVALID_DOG_ID'
  | 'INVALID_TIMEZONE'
  | 'OWNER_NOT_FOUND'
  | 'DOG_NOT_FOUND'
  | 'DOG_OWNERSHIP_MISMATCH'
  | 'PROGRESS_OWNERSHIP_MISMATCH'
  | 'HISTORY_OWNERSHIP_MISMATCH'
  | 'CORRUPT_STORED_DATA'
  | 'READ_FAILED';

export class DogLearningPassportError extends Error {
  constructor(
    readonly code: DogLearningPassportErrorCode,
    readonly context: Readonly<Record<string, unknown>> = {},
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'DogLearningPassportError';
  }
}
