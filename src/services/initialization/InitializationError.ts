export type InitializationErrorCode =
  | 'MIGRATION_FAILED'
  | 'STORAGE_UNAVAILABLE'
  | 'UNKNOWN_INITIALIZATION_ERROR';

const messages: Record<InitializationErrorCode, string> = {
  MIGRATION_FAILED: 'Stored application data could not be upgraded.',
  STORAGE_UNAVAILABLE: 'Local storage is temporarily unavailable.',
  UNKNOWN_INITIALIZATION_ERROR: 'The application could not finish initialising.',
};

export class InitializationError extends Error {
  readonly userMessage: string;

  constructor(
    readonly code: InitializationErrorCode,
    readonly context: Record<string, unknown>,
    readonly recoverable: boolean,
    options?: ErrorOptions,
  ) {
    super(messages[code], options);
    this.name = 'InitializationError';
    this.userMessage = messages[code];
  }
}
