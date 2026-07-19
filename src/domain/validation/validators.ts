import type {
  Achievement,
  BehaviourAssessment,
  BehaviourProfile,
  DailyPlan,
  Dog,
  LessonDefinition,
  LessonProgress,
  NotificationSettings,
  Owner,
  Progress,
  TrainingSession,
} from '../models';
import { behaviourSkills } from '../models';
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
const lessonCategories = ['foundation', 'life-skills', 'behaviour', 'safety'] as const;
const lessonTags = ['foundation', 'home', 'outdoors', 'walking', 'recall', 'impulse-control', 'confidence', 'safety'] as const;
const assessmentOptions = ['never', 'rarely', 'sometimes', 'often', 'almost-always', 'not-sure'] as const;
const optionValues: Record<(typeof assessmentOptions)[number], number | null> = { never: 0, rarely: 1, sometimes: 2, often: 3, 'almost-always': 4, 'not-sure': null };

function isSkillScores(value: unknown): boolean {
  return isRecord(value) && behaviourSkills.every((skill) => typeof value[skill] === 'number' && [0, 25, 50, 75, 100].includes(value[skill] as number));
}

function isUnknownSkills(value: unknown): boolean {
  return Array.isArray(value) && value.every((skill) => isOneOf(skill, behaviourSkills)) && new Set(value).size === value.length;
}

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
  ['energyLevel', 'foodMotivation'].forEach((key) => {
    if (!isOneOf(record[key], levels)) errors.push(`${key} is invalid`);
  });
  if (!Array.isArray(record.challenges) || !record.challenges.every((item) => isOneOf(item, challenges))) errors.push('challenges contains an invalid value');
  if (!isSkillScores(record.skillScores)) errors.push('skillScores must contain a valid score for every behaviour skill');
  if (!isUnknownSkills(record.unknownSkills)) errors.push('unknownSkills contains an invalid or duplicate skill');
  if (record.assessmentId !== null && !isNonEmptyString(record.assessmentId)) errors.push('assessmentId must be a string or null');
  if (typeof record.notes !== 'string') errors.push('notes must be a string');
  requireIsoDate(record, 'createdAt', errors);
  requireIsoDate(record, 'updatedAt', errors);
  return finishValidation<BehaviourProfile>(value, errors);
}

export function validateBehaviourAssessment(value: unknown): ValidationResult<BehaviourAssessment> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'ownerId', 'dogId'].forEach((key) => requireString(record, key, errors));
  if (!Array.isArray(record.responses) || record.responses.length === 0) {
    errors.push('responses must be a non-empty array');
  } else {
    record.responses.forEach((response, index) => {
      if (!isRecord(response)) { errors.push(`responses[${index}] must be an object`); return; }
      requireString(response, 'questionId', errors);
      if (!isOneOf(response.skill, behaviourSkills)) errors.push(`responses[${index}].skill is invalid`);
      if (!isOneOf(response.selectedOption, assessmentOptions)) errors.push(`responses[${index}].selectedOption is invalid`);
      if (!isOneOf(response.scoringDirection, ['positive', 'negative'] as const)) errors.push(`responses[${index}].scoringDirection is invalid`);
      if (isOneOf(response.selectedOption, assessmentOptions) && response.frequencyValue !== optionValues[response.selectedOption]) errors.push(`responses[${index}].frequencyValue does not match selectedOption`);
    });
  }
  if (!isSkillScores(record.calculatedScores)) errors.push('calculatedScores must contain every behaviour skill');
  if (!isUnknownSkills(record.unknownSkills)) errors.push('unknownSkills contains an invalid or duplicate skill');
  requireIsoDate(record, 'completedAt', errors);
  if (record.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  return finishValidation<BehaviourAssessment>(value, errors);
}

export function validateLessonDefinition(value: unknown): ValidationResult<LessonDefinition> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'title', 'shortDescription', 'goal'].forEach((key) => requireString(record, key, errors));
  if (typeof record.id !== 'string' || !/^lesson:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) errors.push('id must be a stable lesson identifier');
  if (typeof record.contentVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(record.contentVersion)) errors.push('contentVersion must use semantic version format');
  if (!isOneOf(record.skill, behaviourSkills)) errors.push('skill is unsupported');
  if (!isOneOf(record.category, lessonCategories)) errors.push('category is invalid');
  if (!isOneOf(record.difficultyLevel, [1, 2, 3, 4, 5] as const)) errors.push('difficultyLevel must be between 1 and 5');
  if (!isNonNegativeInteger(record.estimatedMinutes) || record.estimatedMinutes === 0) errors.push('estimatedMinutes must be a positive integer');
  ['equipment', 'steps', 'tips', 'commonMistakes', 'safetyNotes'].forEach((key) => {
    if (!isStringArray(record[key])) errors.push(`${key} must contain non-empty strings`);
  });
  if (Array.isArray(record.steps) && record.steps.length === 0) errors.push('steps must not be empty');
  if (!Array.isArray(record.prerequisites)) errors.push('prerequisites must be an array');
  else {
    const prerequisiteIds: string[] = [];
    record.prerequisites.forEach((item, index) => {
      if (!isRecord(item)) { errors.push(`prerequisites[${index}] must be an object`); return; }
      if (typeof item.lessonId !== 'string' || !/^lesson:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.lessonId)) errors.push(`prerequisites[${index}].lessonId is invalid`);
      else prerequisiteIds.push(item.lessonId);
      if (!isNonNegativeInteger(item.minimumSuccessfulCompletions) || item.minimumSuccessfulCompletions === 0) errors.push(`prerequisites[${index}].minimumSuccessfulCompletions must be positive`);
    });
    if (new Set(prerequisiteIds).size !== prerequisiteIds.length) errors.push('prerequisites must not contain duplicate lesson IDs');
  }
  if (record.minimumDogAgeMonths !== null && !isNonNegativeInteger(record.minimumDogAgeMonths)) errors.push('minimumDogAgeMonths must be a non-negative integer or null');
  if (!Array.isArray(record.troubleshooting)) errors.push('troubleshooting must be an array');
  else record.troubleshooting.forEach((item, index) => {
    if (!isRecord(item) || !isNonEmptyString(item.problem) || !isNonEmptyString(item.solution)) errors.push(`troubleshooting[${index}] is invalid`);
  });
  if (!isRecord(record.completionCriteria)) errors.push('completionCriteria must be an object');
  else {
    if (!isNonNegativeInteger(record.completionCriteria.minimumSuccessfulCompletions) || record.completionCriteria.minimumSuccessfulCompletions === 0) errors.push('completionCriteria.minimumSuccessfulCompletions must be positive');
    if (record.completionCriteria.minimumPerformanceRating !== null && !isOneOf(record.completionCriteria.minimumPerformanceRating, [1, 2, 3, 4, 5] as const)) errors.push('completionCriteria.minimumPerformanceRating is invalid');
  }
  if (!Array.isArray(record.tags) || !record.tags.every((tag) => isOneOf(tag, lessonTags)) || new Set(record.tags).size !== record.tags.length) errors.push('tags contains an invalid or duplicate value');
  if (typeof record.isActive !== 'boolean') errors.push('isActive must be boolean');
  return finishValidation<LessonDefinition>(value, errors);
}

export function validateLessonProgress(value: unknown): ValidationResult<LessonProgress> {
  const { record, errors } = recordOrError(value);
  if (!record) return { valid: false, errors };
  ['id', 'ownerId', 'dogId', 'lessonId'].forEach((key) => requireString(record, key, errors));
  if (typeof record.lessonId !== 'string' || !/^lesson:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.lessonId)) errors.push('lessonId must be a stable lesson identifier');
  if (!isOneOf(record.status, ['locked', 'available', 'inProgress', 'completed'] as const)) errors.push('status is invalid');
  if (!isNonNegativeInteger(record.attempts)) errors.push('attempts must be a non-negative integer');
  if (!isNonNegativeInteger(record.successfulCompletions)) errors.push('successfulCompletions must be a non-negative integer');
  if (isNonNegativeInteger(record.attempts) && isNonNegativeInteger(record.successfulCompletions) && record.successfulCompletions > record.attempts) errors.push('successfulCompletions cannot exceed attempts');
  ['lastAttemptedAt', 'lastCompletedAt', 'unlockedAt'].forEach((key) => {
    if (record[key] !== null && !isIsoDate(record[key])) errors.push(`${key} must be an ISO date or null`);
  });
  if (record.bestPerformanceRating !== null && !isOneOf(record.bestPerformanceRating, [1, 2, 3, 4, 5] as const)) errors.push('bestPerformanceRating is invalid');
  if (!isOneOf(record.currentDifficultyAdjustment, [-2, -1, 0, 1, 2] as const)) errors.push('currentDifficultyAdjustment is invalid');
  if (record.status === 'locked' && record.unlockedAt !== null) errors.push('locked progress cannot have unlockedAt');
  if (record.status !== 'locked' && !isIsoDate(record.unlockedAt)) errors.push('unlocked progress requires unlockedAt');
  if (record.status === 'completed' && (record.successfulCompletions === 0 || !isIsoDate(record.lastCompletedAt))) errors.push('completed progress requires a successful completion date');
  requireIsoDate(record, 'createdAt', errors);
  requireIsoDate(record, 'updatedAt', errors);
  return finishValidation<LessonProgress>(value, errors);
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
