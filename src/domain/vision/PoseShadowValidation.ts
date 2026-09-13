import type { DogPostureEvidence } from '../models/TrainingEvidence';

export type PoseShadowOwnerLabel = 'correct' | 'incorrect';
export type PoseShadowGroundTruth = Exclude<DogPostureEvidence, 'unknown'> | 'no_dog' | 'unsure';

export type PoseShadowValidationSample = {
  id: string;
  expectedPosture: Exclude<DogPostureEvidence, 'unknown'>;
  predictedPosture: DogPostureEvidence;
  confidence: number | null;
  /**
   * Owner-supplied ground truth for new calibration samples. Legacy samples may
   * only have ownerLabel; report logic keeps supporting those records.
   */
  groundTruth?: PoseShadowGroundTruth;
  ownerLabel?: PoseShadowOwnerLabel;
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
  labelledSamples: number;
  unsureSamples: number;
  noDogSamples: number;
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

function ownerSaysPredictionIsCorrect(sample: PoseShadowValidationSample): boolean | null {
  if (sample.groundTruth) {
    if (sample.groundTruth === 'unsure') return null;
    if (sample.groundTruth === 'no_dog') return false;
    return sample.predictedPosture === sample.groundTruth;
  }
  if (sample.ownerLabel) return sample.ownerLabel === 'correct';
  return null;
}

function ownerObservedExpectedPosture(sample: PoseShadowValidationSample): boolean | null {
  if (sample.groundTruth) {
    if (sample.groundTruth === 'unsure' || sample.groundTruth === 'no_dog') return false;
    return sample.groundTruth === sample.expectedPosture;
  }
  if (sample.ownerLabel) return sample.ownerLabel === 'correct';
  return null;
}

export function buildPoseShadowValidationReport(
  samples: PoseShadowValidationSample[],
  policy: PoseShadowValidationPolicy = DEFAULT_POSE_VALIDATION_POLICY,
): PoseShadowValidationReport {
  const labelledSamples = samples.filter((sample) => ownerSaysPredictionIsCorrect(sample) !== null);
  const unsureSamples = samples.filter((sample) => sample.groundTruth === 'unsure');
  const noDogSamples = samples.filter((sample) => sample.groundTruth === 'no_dog');

  const autoCandidates = labelledSamples.filter((sample) => (
    sample.confidence !== null &&
    sample.confidence >= policy.candidateConfidence &&
    sample.predictedPosture === sample.expectedPosture
  ));
  const successfulOwnerReps = labelledSamples.filter((sample) => ownerObservedExpectedPosture(sample) === true);
  const truePositiveCandidates = autoCandidates.filter((sample) => ownerSaysPredictionIsCorrect(sample) === true);
  const falsePositiveCandidates = autoCandidates.filter((sample) => ownerSaysPredictionIsCorrect(sample) === false);
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
  if (labelledSamples.length < policy.minimumSamples) {
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
    labelledSamples: labelledSamples.length,
    unsureSamples: unsureSamples.length,
    noDogSamples: noDogSamples.length,
    successfulOwnerReps: successfulOwnerReps.length,
    autoCandidates: autoCandidates.length,
    truePositiveCandidates: truePositiveCandidates.length,
    falsePositiveCandidates: falsePositiveCandidates.length,
    missedSuccessfulReps: missedSuccessfulReps.length,
    precision,
    falsePositiveRate,
    coverage,
    shadowQualityGatePassed,
    certifiedForAutoScoring: false,
    blockers: [...qualityBlockers, PRODUCTION_AUTO_SCORING_BLOCKER],
  };
}
