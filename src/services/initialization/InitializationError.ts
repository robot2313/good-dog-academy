export type InitializationErrorCode =
  | 'MIGRATION_FAILED'
  | 'STORAGE_UNAVAILABLE'
  | 'ONBOARDING_SAVE_FAILED'
  | 'ONBOARDING_RECOVERY_FAILED'
  | 'DOG_PHOTO_PERSIST_FAILED'
  | 'DEVELOPMENT_RESET_FAILED'
  | 'BEHAVIOUR_ASSESSMENT_SAVE_FAILED'
  | 'BEHAVIOUR_ASSESSMENT_RECOVERY_FAILED'
  | 'INVALID_LESSON_CATALOGUE'
  | 'DUPLICATE_LESSON_IDS'
  | 'MISSING_LESSON_PREREQUISITES'
  | 'CIRCULAR_LESSON_PREREQUISITES'
  | 'LESSON_PROGRESS_INITIALIZATION_FAILED'
  | 'UNKNOWN_INITIALIZATION_ERROR';

const messages: Record<InitializationErrorCode, string> = {
  MIGRATION_FAILED: 'Stored application data could not be upgraded.',
  STORAGE_UNAVAILABLE: 'Local storage is temporarily unavailable.',
  ONBOARDING_SAVE_FAILED: 'We couldn’t save your setup. Your answers are still here, so please try again.',
  ONBOARDING_RECOVERY_FAILED: 'We couldn’t restart setup safely. Your saved data has not been intentionally changed.',
  DOG_PHOTO_PERSIST_FAILED: 'We couldn’t save that photo. Try another image or remove the optional photo and continue.',
  DEVELOPMENT_RESET_FAILED: 'App data could not be reset safely. No navigation change was made.',
  BEHAVIOUR_ASSESSMENT_SAVE_FAILED: 'We couldnâ€™t save the assessment. Your answers are still here, so please try again.',
  BEHAVIOUR_ASSESSMENT_RECOVERY_FAILED: 'We couldnâ€™t safely restart the assessment. Your setup data has not been deleted.',
  INVALID_LESSON_CATALOGUE: 'The bundled lesson catalogue is invalid.',
  DUPLICATE_LESSON_IDS: 'The bundled lesson catalogue contains duplicate lesson identifiers.',
  MISSING_LESSON_PREREQUISITES: 'A bundled lesson references a prerequisite that is unavailable.',
  CIRCULAR_LESSON_PREREQUISITES: 'The bundled lesson prerequisites contain a circular dependency.',
  LESSON_PROGRESS_INITIALIZATION_FAILED: 'Lesson progress could not be prepared safely. No partial progress was saved.',
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
