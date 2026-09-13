import {
  buildPoseShadowValidationReport,
  type PoseShadowOwnerLabel,
  type PoseShadowValidationReport,
  type PoseShadowValidationSample,
} from '../../domain/vision/PoseShadowValidation';
import type { DogPostureEvidence } from '../../domain/models/TrainingEvidence';
import type { TrainingOutcome } from '../../domain/models/TrainingSession';
import { appStorage } from '../appStorage';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { storageKeys } from '../../storage/storageKeys';

export type PersistedPoseShadowValidationSample = PoseShadowValidationSample & {
  dogId: string;
  lessonId: string;
  recordedAt: string;
};

type StoredPoseShadowValidation = Record<string, PersistedPoseShadowValidationSample[]>;

type SharedRecordInput = {
  id: string;
  dogId: string;
  lessonId: string;
  expectedPosture: Exclude<DogPostureEvidence, 'unknown'>;
  predictedPosture: DogPostureEvidence;
  confidence: number | null;
  recordedAt: string;
};

export type RecordPoseShadowValidationInput = SharedRecordInput & (
  | { ownerLabel: PoseShadowOwnerLabel; ownerOutcome?: never }
  | { ownerLabel?: never; ownerOutcome: TrainingOutcome }
);

const MAX_SAMPLES_PER_DOG = 500;

function isTrainingOutcome(value: unknown): value is TrainingOutcome {
  return value === 'success' || value === 'partial-success' || value === 'unsuccessful';
}

function isOwnerLabel(value: unknown): value is PoseShadowOwnerLabel {
  return value === 'correct' || value === 'incorrect';
}

function isPosture(value: unknown): value is DogPostureEvidence {
  return value === 'stand_like' || value === 'sit_like' || value === 'down_like' || value === 'unknown';
}

function normaliseStoredSample(value: unknown): PersistedPoseShadowValidationSample | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const sample = value as Record<string, unknown>;
  const ownerLabel = isOwnerLabel(sample.ownerLabel)
    ? sample.ownerLabel
    : isTrainingOutcome(sample.ownerOutcome)
      ? sample.ownerOutcome === 'success' ? 'correct' : 'incorrect'
      : null;

  if (
    typeof sample.id !== 'string' || sample.id.length === 0 ||
    typeof sample.dogId !== 'string' || sample.dogId.length === 0 ||
    typeof sample.lessonId !== 'string' || sample.lessonId.length === 0 ||
    !isPosture(sample.expectedPosture) || sample.expectedPosture === 'unknown' ||
    !isPosture(sample.predictedPosture) ||
    !(sample.confidence === null || (typeof sample.confidence === 'number' && Number.isFinite(sample.confidence) && sample.confidence >= 0 && sample.confidence <= 1)) ||
    ownerLabel === null ||
    typeof sample.recordedAt !== 'string' || !Number.isFinite(new Date(sample.recordedAt).getTime())
  ) {
    return null;
  }

  return {
    id: sample.id,
    dogId: sample.dogId,
    lessonId: sample.lessonId,
    expectedPosture: sample.expectedPosture,
    predictedPosture: sample.predictedPosture,
    confidence: sample.confidence,
    ownerLabel,
    recordedAt: sample.recordedAt,
  };
}

async function readRoot(storage: StorageAdapter): Promise<StoredPoseShadowValidation> {
  try {
    const raw = await storage.getItem<unknown>(storageKeys.poseShadowValidation);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

    const valid: StoredPoseShadowValidation = {};
    for (const [dogId, samples] of Object.entries(raw as Record<string, unknown>)) {
      if (!Array.isArray(samples)) continue;
      const filtered = samples
        .map(normaliseStoredSample)
        .filter((sample): sample is PersistedPoseShadowValidationSample => sample !== null)
        .filter((sample) => sample.dogId === dogId);
      if (filtered.length > 0) valid[dogId] = filtered.slice(0, MAX_SAMPLES_PER_DOG);
    }
    return valid;
  } catch {
    return {};
  }
}

export async function loadPoseShadowValidationSamples(
  dogId: string,
  storage: StorageAdapter = appStorage,
): Promise<PersistedPoseShadowValidationSample[]> {
  const root = await readRoot(storage);
  return [...(root[dogId] ?? [])];
}

export async function recordPoseShadowValidationSample(
  input: RecordPoseShadowValidationInput,
  storage: StorageAdapter = appStorage,
): Promise<PersistedPoseShadowValidationSample[]> {
  const normalised = normaliseStoredSample(input);
  if (!normalised) throw new Error('Invalid pose shadow validation sample.');

  const root = await readRoot(storage);
  const current = root[normalised.dogId] ?? [];
  const next = [normalised, ...current.filter((sample) => sample.id !== normalised.id)]
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, MAX_SAMPLES_PER_DOG);

  await storage.setItem(storageKeys.poseShadowValidation, {
    ...root,
    [normalised.dogId]: next,
  });
  return next;
}

export async function loadPoseShadowValidationReport(
  dogId: string,
  expectedPosture?: Exclude<DogPostureEvidence, 'unknown'>,
  storage: StorageAdapter = appStorage,
): Promise<PoseShadowValidationReport> {
  const samples = await loadPoseShadowValidationSamples(dogId, storage);
  const filtered = expectedPosture
    ? samples.filter((sample) => sample.expectedPosture === expectedPosture)
    : samples;
  return buildPoseShadowValidationReport(filtered);
}
