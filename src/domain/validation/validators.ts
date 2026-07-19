import type {
  Achievement,
  BehaviourProfile,
  DailyPlan,
  Dog,
  Lesson,
  NotificationSettings,
  Owner,
  Progress,
  TrainingSession,
} from '../models';
import {
  finishValidation,
  isDateOnly,
  isIsoDate,
  isNonEmptyString,
  isNonNegativeInteger,
  isNonNegativeNumber,
  isOneOf,
  isRecord,
  isStringArray,
  type ValidationResult,
} from './validation';

const levels = ['low', 'medium', 'high'] as const;
const challenges = ['recall', 'lead-pulling', 'jumping'] as const;
const categories = ['foundation', ...challenges] as const;

function requireString(record: Record<string, unknown>, key: string, errors: string[]): void {
  if (!isNonEmptyString(record[key])) errors.push(`${key} must be a non-empty string`);
}

function requireIsoDate(record: Record<string, unknown>, key: string, errors: string[]): void {
  if (!isIsoDate(record[key])) errors.push(`${key} must be a valid ISO date`);
}

function recordOrError(value: unknown): { record?: Record<string, unknown>; errors: string[] } {
  return isRecord(value) ? { record: value, errors: [] } : { errors: ['value must be an object'] };
}

export function validateOwner(value: unknown): ValidationResult<Owner> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'displayName'].forEach((key) => requireString(record, key, errors));
  if (record.email !== null && (!isNonEmptyString(record.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email))) errors.push('email must be valid or null');
  if (!isOneOf(record.trainingExperience, ['beginner', 'intermediate', 'experienced'] as const)) errors.push('trainingExperience is invalid');
  if (!isOneOf(record.primaryGoal, ['family-companion', 'basic-obedience', 'behaviour-help', 'adventure', 'dog-sport'] as const)) errors.push('primaryGoal is invalid');
  requireIsoDate(record, 'createdAt', errors);
  requireIsoDate(record, 'updatedAt', errors);
  return finishValidation<Owner>(value, errors);
}

export function validateDog(value: unknown): ValidationResult<Dog> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'ownerId', 'name'].forEach((key) => requireString(record, key, errors));
  if (typeof record.breedUnknown !== 'boolean') errors.push('breedUnknown must be boolean');
  if (record.breedUnknown !== true && !isNonEmptyString(record.breed)) errors.push('breed must be provided unless unknown');
  if (typeof record.birthdayEstimated !== 'boolean') errors.push('birthdayEstimated must be boolean');
  if (record.dateOfBirth !== null && !isDateOnly(record.dateOfBirth)) errors.push('dateOfBirth must be a date or null');
  if (isDateOnly(record.dateOfBirth) && Date.parse(`${record.dateOfBirth}T00:00:00.000Z`) > Date.now()) errors.push('dateOfBirth cannot be in the future');
  if (record.estimatedAgeYears !== null && (!isNonNegativeNumber(record.estimatedAgeYears) || record.estimatedAgeYears <= 0 || record.estimatedAgeYears > 30)) errors.push('estimatedAgeYears must be greater than 0 and at most 30, or null');
  if (record.birthdayEstimated === true && record.estimatedAgeYears === null) errors.push('estimatedAgeYears is required for an estimated birthday');
  if (record.birthdayEstimated === false && record.dateOfBirth === null) errors.push('dateOfBirth is required when birthday is not estimated');
  if (!isOneOf(record.sex, ['female', 'male', 'unknown'] as const)) errors.push('sex is invalid');
  if (record.weightKg !== null && (!isNonNegativeNumber(record.weightKg) || record.weightKg === 0)) errors.push('weightKg must be positive or null');
  if (!isOneOf(record.weightUnit, ['kg', 'lb'] as const)) errors.push('weightUnit is invalid');
  if (!isOneOf(record.energyLevel, levels)) errors.push('energyLevel is invalid');
  if (record.photoUri !== null && !isNonEmptyString(record.photoUri)) errors.push('photoUri must be a non-empty string or null');
  requireIsoDate(record, 'createdAt', errors);
  requireIsoDate(record, 'updatedAt', errors);
  return finishValidation<Dog>(value, errors);
}

export function validateBehaviourProfile(value: unknown): ValidationResult<BehaviourProfile> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'dogId'].forEach((key) => requireString(record, key, errors));
  ['energyLevel', 'confidenceLevel', 'foodMotivation'].forEach((key) => {
    if (!isOneOf(record[key], levels)) errors.push(`${key} is invalid`);
  });
  if (!Array.isArray(record.challenges) || !record.challenges.every((item) => isOneOf(item, challenges))) errors.push('challenges contains an invalid value');
  if (typeof record.notes !== 'string') errors.push('notes must be a string');
  requireIsoDate(record, 'createdAt', errors);
  requireIsoDate(record, 'updatedAt', errors);
  return finishValidation<BehaviourProfile>(value, errors);
}

export function validateLesson(value: unknown): ValidationResult<Lesson> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'slug', 'title', 'description'].forEach((key) => requireString(record, key, errors));
  if (!isOneOf(record.category, categories)) errors.push('category is invalid');
  if (!isOneOf(record.difficulty, [1, 2, 3, 4, 5] as const)) errors.push('difficulty must be between 1 and 5');
  if (!isNonNegativeInteger(record.estimatedMinutes) || record.estimatedMinutes === 0) errors.push('estimatedMinutes must be a positive integer');
  if (!isStringArray(record.steps)) errors.push('steps must contain non-empty strings');
  if (!isStringArray(record.successCriteria)) errors.push('successCriteria must contain non-empty strings');
  if (typeof record.published !== 'boolean') errors.push('published must be boolean');
  requireIsoDate(record, 'createdAt', errors);
  requireIsoDate(record, 'updatedAt', errors);
  return finishValidation<Lesson>(value, errors);
}

export function validateDailyPlan(value: unknown): ValidationResult<DailyPlan> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'dogId'].forEach((key) => requireString(record, key, errors));
  if (!isDateOnly(record.date)) errors.push('date must use YYYY-MM-DD');
  if (!isStringArray(record.lessonIds)) errors.push('lessonIds must contain non-empty strings');
  if (!isOneOf(record.status, ['scheduled', 'in-progress', 'completed', 'skipped'] as const)) errors.push('status is invalid');
  requireIsoDate(record, 'createdAt', errors);
  requireIsoDate(record, 'updatedAt', errors);
  return finishValidation<DailyPlan>(value, errors);
}

export function validateTrainingSession(value: unknown): ValidationResult<TrainingSession> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'dogId', 'lessonId'].forEach((key) => requireString(record, key, errors));
  if (record.dailyPlanId !== null && !isNonEmptyString(record.dailyPlanId)) errors.push('dailyPlanId must be a string or null');
  requireIsoDate(record, 'startedAt', errors);
  if (record.completedAt !== null && !isIsoDate(record.completedAt)) errors.push('completedAt must be an ISO date or null');
  if (!isNonNegativeInteger(record.durationMinutes)) errors.push('durationMinutes must be a non-negative integer');
  if (record.outcome !== null && !isOneOf(record.outcome, ['success', 'partial-success', 'unsuccessful'] as const)) errors.push('outcome is invalid');
  if (typeof record.notes !== 'string') errors.push('notes must be a string');
  return finishValidation<TrainingSession>(value, errors);
}

export function validateAchievement(value: unknown): ValidationResult<Achievement> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'dogId', 'code', 'title', 'description'].forEach((key) => requireString(record, key, errors));
  requireIsoDate(record, 'earnedAt', errors);
  return finishValidation<Achievement>(value, errors);
}

export function validateProgress(value: unknown): ValidationResult<Progress> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'dogId'].forEach((key) => requireString(record, key, errors));
  if (!isStringArray(record.completedLessonIds)) errors.push('completedLessonIds must contain non-empty strings');
  ['sessionsCompleted', 'currentStreakDays', 'bestStreakDays', 'totalTrainingMinutes'].forEach((key) => {
    if (!isNonNegativeInteger(record[key])) errors.push(`${key} must be a non-negative integer`);
  });
  requireIsoDate(record, 'updatedAt', errors);
  return finishValidation<Progress>(value, errors);
}

export function validateNotificationSettings(value: unknown): ValidationResult<NotificationSettings> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'ownerId', 'timezone'].forEach((key) => requireString(record, key, errors));
  ['enabled', 'dailyReminderEnabled', 'weeklySummaryEnabled'].forEach((key) => {
    if (typeof record[key] !== 'boolean') errors.push(`${key} must be boolean`);
  });
  if (typeof record.dailyReminderTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.dailyReminderTime)) errors.push('dailyReminderTime must use HH:mm');
  requireIsoDate(record, 'updatedAt', errors);
  return finishValidation<NotificationSettings>(value, errors);
}
