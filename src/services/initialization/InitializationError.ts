export type InitializationErrorCode =
  | 'MIGRATION_FAILED'
  | 'STORAGE_UNAVAILABLE'
  | 'ONBOARDING_SAVE_FAILED'
  | 'ONBOARDING_RECOVERY_FAILED'
  | 'DOG_PHOTO_PERSIST_FAILED'
  | 'DEVELOPMENT_RESET_FAILED'
  | 'UNKNOWN_INITIALIZATION_ERROR';

const messages: Record<InitializationErrorCode, string> = {
  MIGRATION_FAILED: 'Stored application data could not be upgraded.',
  STORAGE_UNAVAILABLE: 'Local storage is temporarily unavailable.',
  ONBOARDING_SAVE_FAILED: 'We couldn’t save your setup. Your answers are still here, so please try again.',
  ONBOARDING_RECOVERY_FAILED: 'We couldn’t restart setup safely. Your saved data has not been intentionally changed.',
  DOG_PHOTO_PERSIST_FAILED: 'We couldn’t save that photo. Try another image or remove the optional photo and continue.',
  DEVELOPMENT_RESET_FAILED: 'App data could not be reset safely. No navigation change was made.',
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
