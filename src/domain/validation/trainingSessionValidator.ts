import type { TrainingSession } from '../models';
import type { ValidationResult } from './validation';
import { isIsoDate, isNonEmptyString, isNonNegativeInteger, isOneOf, isRecord } from './validation';
import { validateTrainingSession as validateBaseTrainingSession } from './validators';

const outcomes = ['success', 'partial-success', 'unsuccessful'] as const;
const evidenceSources = ['owner_confirmed', 'camera_auto', 'voice_auto', 'multimodal_auto'] as const;
const postures = ['stand_like', 'sit_like', 'down_like', 'unknown'] as const;

function isNullableIsoDate(value: unknown): boolean {
  return value === null || isIsoDate(value);
}

function isNullableString(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

function isNullableConfidence(value: unknown): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1);
}

function validateCorrection(value: unknown, path: string, errors: string[]): void {
  if (value === null) return;
  if (!isRecord(value)) {
    errors.push(`${path} must be an object or null`);
    return;
  }
  if (!isIsoDate(value.correctedAt)) errors.push(`${path}.correctedAt must be a valid ISO date`);
  if (!isOneOf(value.correctedOutcome, outcomes)) errors.push(`${path}.correctedOutcome is invalid`);
  if (!isNullableString(value.reason)) errors.push(`${path}.reason must be a string or null`);
  if (value.source !== 'owner') errors.push(`${path}.source must be owner`);
}

function validateEvidence(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!isOneOf(value.source, evidenceSources)) errors.push(`${path}.source is invalid`);
  if (!isNullableConfidence(value.confidence)) errors.push(`${path}.confidence must be between 0 and 1, or null`);
  if (!isOneOf(value.observedOutcome, outcomes)) errors.push(`${path}.observedOutcome is invalid`);
  if (!isIsoDate(value.observedAt)) errors.push(`${path}.observedAt must be a valid ISO date`);
  ['cueAt', 'responseAt', 'markerAt', 'rewardAt'].forEach((key) => {
    if (!isNullableIsoDate(value[key])) errors.push(`${path}.${key} must be an ISO date or null`);
  });
  if (value.cueCount !== null && (!isNonNegativeInteger(value.cueCount) || value.cueCount === 0)) errors.push(`${path}.cueCount must be a positive integer or null`);
  if (!isNullableString(value.signal)) errors.push(`${path}.signal must be a string or null`);
  if (value.posture !== null && !isOneOf(value.posture, postures)) errors.push(`${path}.posture is invalid`);
  if (!isNullableConfidence(value.poseConfidence)) errors.push(`${path}.poseConfidence must be between 0 and 1, or null`);
  if (!isNullableString(value.notes)) errors.push(`${path}.notes must be a string or null`);
}

export function validateTrainingSession(value: unknown): ValidationResult<TrainingSession> {
  const base = validateBaseTrainingSession(value);
  if (!base.valid || !isRecord(value)) return base;

  const errors: string[] = [];
  if (value.reps !== undefined) {
    if (!Array.isArray(value.reps)) {
      errors.push('reps must be an array when provided');
    } else {
      const ids = new Set<string>();
      const repNumbers = new Set<number>();
      value.reps.forEach((rep, index) => {
        const path = `reps[${index}]`;
        if (!isRecord(rep)) {
          errors.push(`${path} must be an object`);
          return;
        }
        if (!isNonEmptyString(rep.id)) errors.push(`${path}.id must be a non-empty string`);
        else if (ids.has(rep.id)) errors.push(`${path}.id must be unique`);
        else ids.add(rep.id);

        if (!isNonNegativeInteger(rep.repNumber) || rep.repNumber === 0) errors.push(`${path}.repNumber must be a positive integer`);
        else if (repNumbers.has(rep.repNumber)) errors.push(`${path}.repNumber must be unique`);
        else repNumbers.add(rep.repNumber);

        validateEvidence(rep.evidence, `${path}.evidence`, errors);
        validateCorrection(rep.correction, `${path}.correction`, errors);
      });
    }
  }

  return errors.length ? { valid: false, errors } : { valid: true, value: value as TrainingSession, errors: [] };
}
