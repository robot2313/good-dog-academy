import type { TrainingOutcome } from '../models/TrainingSession';
import {
  clampEvidenceConfidence,
  type DogPostureEvidence,
  type RepEvidence,
} from '../models/TrainingEvidence';
import type { DogVisionResult } from '../../services/vision/DogVisionEngine';

export type CameraEvidenceDecision =
  | { kind: 'accept'; evidence: RepEvidence }
  | { kind: 'ask_owner'; reason: CameraEvidenceUncertainty };

export type CameraEvidenceUncertainty =
  | 'dog_not_detected'
  | 'low_detection_confidence'
  | 'unknown_posture'
  | 'low_posture_confidence'
  | 'stress_signal'
  | 'expected_posture_not_configured'
  | 'posture_mismatch';

export type CameraEvidencePolicy = {
  minDetectionConfidence: number;
  minPostureConfidence: number;
};

export const DEFAULT_CAMERA_EVIDENCE_POLICY: CameraEvidencePolicy = {
  minDetectionConfidence: 0.7,
  minPostureConfidence: 0.72,
};

export type CameraRepObservation = {
  outcome: TrainingOutcome;
  expectedPosture?: DogPostureEvidence | null;
  observedAt: string;
  cueAt: string | null;
  responseAt: string | null;
  markerAt: string | null;
  rewardAt: string | null;
  cueCount: number | null;
  signal: string | null;
  notes?: string | null;
};

export function decideCameraRepEvidence(
  vision: DogVisionResult,
  observation: CameraRepObservation,
  policy: CameraEvidencePolicy = DEFAULT_CAMERA_EVIDENCE_POLICY,
): CameraEvidenceDecision {
  const detectionConfidence = clampEvidenceConfidence(vision.detectionConfidence);
  const postureConfidence = clampEvidenceConfidence(vision.postureConfidence);

  if (!vision.dogDetected) {
    return { kind: 'ask_owner', reason: 'dog_not_detected' };
  }

  if (detectionConfidence === null || detectionConfidence < policy.minDetectionConfidence) {
    return { kind: 'ask_owner', reason: 'low_detection_confidence' };
  }

  if (vision.stressSignal !== 'none') {
    return { kind: 'ask_owner', reason: 'stress_signal' };
  }

  if (vision.posture === 'unknown') {
    return { kind: 'ask_owner', reason: 'unknown_posture' };
  }

  if (postureConfidence === null || postureConfidence < policy.minPostureConfidence) {
    return { kind: 'ask_owner', reason: 'low_posture_confidence' };
  }

  if (!observation.expectedPosture || observation.expectedPosture === 'unknown') {
    return { kind: 'ask_owner', reason: 'expected_posture_not_configured' };
  }

  if (vision.posture !== observation.expectedPosture) {
    return { kind: 'ask_owner', reason: 'posture_mismatch' };
  }

  return {
    kind: 'accept',
    evidence: {
      source: 'camera_auto',
      confidence: Math.min(detectionConfidence, postureConfidence),
      observedOutcome: 'success',
      observedAt: observation.observedAt,
      cueAt: observation.cueAt,
      responseAt: observation.responseAt,
      markerAt: observation.markerAt,
      rewardAt: observation.rewardAt,
      cueCount: observation.cueCount,
      signal: observation.signal,
      posture: vision.posture,
      poseConfidence: postureConfidence,
      notes: observation.notes ?? null,
    },
  };
}
