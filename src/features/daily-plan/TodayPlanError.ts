export type TodayPlanErrorCode =
  | 'INVALID_TIMEZONE'
  | 'OWNER_NOT_FOUND'
  | 'DOG_NOT_FOUND'
  | 'DOG_OWNERSHIP_MISMATCH'
  | 'PLAN_OWNERSHIP_MISMATCH'
  | 'NO_ELIGIBLE_LESSONS'
  | 'CORRUPT_STORED_DATA'
  | 'PLAN_LOAD_FAILED';

export class TodayPlanError extends Error {
  constructor(
    readonly code: TodayPlanErrorCode,
    readonly context: Readonly<Record<string, unknown>> = {},
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'TodayPlanError';
  }
}
