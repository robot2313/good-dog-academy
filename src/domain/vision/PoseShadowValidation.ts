import type { DogPostureEvidence } from '../models/TrainingEvidence';
import type { TrainingOutcome } from '../models/TrainingSession';

export type PoseShadowValidationSample = {
  id: string;
  expectedPosture: Exclude<DogPostureEvidence, 'unknown'>;
  predictedPosture: DogPostureEvidence;
  confidence: number | null;
  ownerOutcome: TrainingOutcome;
};

export type PoseShadowValidationPolicy = {
  candidateConfidence: number;
  minimumSamples: number;
  maximumFalsePositiveRate: number;
  minimumPrecision: number;
};

export const DEFAULT_POSE_VALIDATION_POLICY: PoseShadowValidationPolicy = {
  candidateConfidence: 0.85,
  minimumSamples: 50,
  maximumFalsePositiveRate: 0.02,
  minimumPrecision: 0.98,
};

export type PoseShadowValidationReport = {
  samples: number;
  successfulOwnerReps: number;
  autoCandidates: number;
  truePositiveCandidates: number;
  falsePositiveCandidates: number;
  missedSuccessfulReps: number;
  precision: number | null;
  falsePositiveRate: number | null;
  coverage: number | null;
  shadowQualityGatePassed: boolean;
  certifiedForAutoScoring: boolean;
  blockers: string[];
};

const PRODUCTION_AUTO_SCORING_BLOCKER =
  'Production auto-scoring remains disabled until animal detection, cue-level validation, licensing review, and physical-device real-dog QA are complete.';

export function buildPoseShadowValidationReport(
  samples: PoseShadowValidationSample[],
  policy: PoseShadowValidationPolicy = DEFAULT_POSE_VALIDATION_POLICY,
): PoseShadowValidationReport {
  const autoCandidates = samples.filter((sample) => (
    sample.confidence !== null &&
    sample.confidence >= policy.candidateConfidence &&
    sample.predictedPosture === sample.expectedPosture
  ));
  const successfulOwnerReps = samples.filter((sample) => sample.ownerOutcome === 'success');
  const truePositiveCandidates = autoCandidates.filter((sample) => sample.ownerOutcome === 'success');
  const falsePositiveCandidates = autoCandidates.filter((sample) => sample.ownerOutcome !== 'success');
  const missedSuccessfulReps = successfulOwnerReps.filter((sample) => !autoCandidates.includes(sample));

  const precision = autoCandidates.length > 0
    ? truePositiveCandidates.length / autoCandidates.length
    : null;
  const falsePositiveRate = autoCandidates.length > 0
    ? falsePositiveCandidates.length / autoCandidates.length
    : null;
  const coverage = successfulOwnerReps.length > 0
    ? truePositiveCandidates.length / successfulOwnerReps.length
    : null;

  const qualityBlockers: string[] = [];
  if (samples.length < policy.minimumSamples) {
    qualityBlockers.push(`Need at least ${policy.minimumSamples} owner-labelled validation reps.`);
  }
  if (autoCandidates.length === 0) {
    qualityBlockers.push('No high-confidence matching posture predictions have been observed yet.');
  }
  if (precision === null || precision < policy.minimumPrecision) {
    qualityBlockers.push(`High-confidence posture precision must be at least ${(policy.minimumPrecision * 100).toFixed(0)}%.`);
  }
  if (falsePositiveRate === null || falsePositiveRate > policy.maximumFalsePositiveRate) {
    qualityBlockers.push(`High-confidence false-positive rate must be at most ${(policy.maximumFalsePositiveRate * 100).toFixed(0)}%.`);
  }

  const shadowQualityGatePassed = qualityBlockers.length === 0;

  return {
    samples: samples.length,
    successfulOwnerReps: successfulOwnerReps.length,
    autoCandidates: autoCandidates.length,
    truePositiveCandidates: truePositiveCandidates.length,
    falsePositiveCandidates: falsePositiveCandidates.length,
    missedSuccessfulReps: missedSuccessfulReps.length,
    precision,
    falsePositiveRate,
    coverage,
    shadowQualityGatePassed,
    // Shadow labels can tell us whether the current heuristic is promising,
    // but they are not sufficient evidence to enable autonomous scoring. The
    // current pose path intentionally has no animal detector and commercial
    // model/data licensing plus real-device validation are still open gates.
    certifiedForAutoScoring: false,
    blockers: [...qualityBlockers, PRODUCTION_AUTO_SCORING_BLOCKER],
  };
}
