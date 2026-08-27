export type TrainingHistoryErrorCode =
  | 'INVALID_OWNER_ID'
  | 'INVALID_DOG_ID'
  | 'INVALID_SESSION_ID'
  | 'INVALID_TIMEZONE'
  | 'INVALID_OFFSET'
  | 'INVALID_LIMIT'
  | 'OWNER_NOT_FOUND'
  | 'DOG_NOT_FOUND'
  | 'DOG_OWNERSHIP_MISMATCH'
  | 'SESSION_NOT_FOUND'
  | 'CORRUPT_STORED_DATA'
  | 'READ_FAILED';

export class TrainingHistoryError extends Error {
  constructor(
    readonly code: TrainingHistoryErrorCode,
    readonly context: Readonly<Record<string, unknown>> = {},
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'TrainingHistoryError';
  }
}
