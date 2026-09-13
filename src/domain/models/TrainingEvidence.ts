import type { TrainingOutcome } from './TrainingSession';

export type EvidenceSource =
  | 'owner_confirmed'
  | 'camera_auto'
  | 'voice_auto'
  | 'multimodal_auto';

export type DogPostureEvidence =
  | 'stand_like'
  | 'sit_like'
  | 'down_like'
  | 'unknown';

export type RepEvidence = {
  source: EvidenceSource;
  confidence: number | null;
  observedOutcome: TrainingOutcome;
  observedAt: string;
  cueAt: string | null;
  responseAt: string | null;
  markerAt: string | null;
  rewardAt: string | null;
  cueCount: number | null;
  signal: string | null;
  posture: DogPostureEvidence | null;
  poseConfidence: number | null;
  notes: string | null;
};

export type EvidenceCorrection = {
  correctedAt: string;
  correctedOutcome: TrainingOutcome;
  reason: string | null;
  source: 'owner';
};

export type TrainingRep = {
  id: string;
  repNumber: number;
  evidence: RepEvidence;
  correction: EvidenceCorrection | null;
};

export function clampEvidenceConfidence(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value));
}

export function effectiveRepOutcome(rep: TrainingRep): TrainingOutcome {
  return rep.correction?.correctedOutcome ?? rep.evidence.observedOutcome;
}

export function correctTrainingRep(
  rep: TrainingRep,
  correctedOutcome: TrainingOutcome,
  correctedAt = new Date().toISOString(),
  reason: string | null = null,
): TrainingRep {
  return {
    ...rep,
    correction: {
      correctedAt,
      correctedOutcome,
      reason,
      source: 'owner',
    },
  };
}
