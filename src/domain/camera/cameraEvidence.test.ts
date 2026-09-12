import { decideCameraRepEvidence } from './cameraEvidence';
import type { DogVisionResult } from '../../services/vision/DogVisionEngine';

const baseVision: DogVisionResult = {
  frameId: 'frame-1',
  analysedAt: '2026-09-12T10:00:01.000Z',
  dogDetected: true,
  detectionConfidence: 0.94,
  posture: 'sit_like',
  postureConfidence: 0.91,
  stressSignal: 'none',
  stressConfidence: null,
};

const baseObservation = {
  outcome: 'success' as const,
  expectedPosture: 'sit_like' as const,
  observedAt: '2026-09-12T10:00:01.000Z',
  cueAt: '2026-09-12T10:00:00.000Z',
  responseAt: '2026-09-12T10:00:00.800Z',
  markerAt: '2026-09-12T10:00:00.900Z',
  rewardAt: '2026-09-12T10:00:01.100Z',
  cueCount: 1,
  signal: 'sit',
  notes: null,
};

describe('camera evidence gating', () => {
  it('accepts high-confidence evidence only when the observed posture matches the expected cue posture', () => {
    const decision = decideCameraRepEvidence(baseVision, baseObservation);

    expect(decision.kind).toBe('accept');
    if (decision.kind !== 'accept') throw new Error('expected accepted evidence');

    expect(decision.evidence.source).toBe('camera_auto');
    expect(decision.evidence.confidence).toBe(0.91);
    expect(decision.evidence.posture).toBe('sit_like');
    expect(decision.evidence.observedOutcome).toBe('success');
  });

  it('requires owner confirmation when the dog is not reliably detected', () => {
    const decision = decideCameraRepEvidence(
      { ...baseVision, dogDetected: false, detectionConfidence: 0.2 },
      baseObservation,
    );

    expect(decision).toEqual({ kind: 'ask_owner', reason: 'dog_not_detected' });
  });

  it('requires owner confirmation for low posture confidence', () => {
    const decision = decideCameraRepEvidence(
      { ...baseVision, postureConfidence: 0.4 },
      baseObservation,
    );

    expect(decision).toEqual({ kind: 'ask_owner', reason: 'low_posture_confidence' });
  });

  it('lets stress-like visual evidence override automatic scoring', () => {
    const decision = decideCameraRepEvidence(
      {
        ...baseVision,
        stressSignal: 'avoidance_like',
        stressConfidence: 0.88,
      },
      baseObservation,
    );

    expect(decision).toEqual({ kind: 'ask_owner', reason: 'stress_signal' });
  });

  it('never silently scores an unknown posture', () => {
    const decision = decideCameraRepEvidence(
      { ...baseVision, posture: 'unknown', postureConfidence: 0.99 },
      baseObservation,
    );

    expect(decision).toEqual({ kind: 'ask_owner', reason: 'unknown_posture' });
  });

  it('requires owner confirmation when the lesson has no expected posture mapping', () => {
    const decision = decideCameraRepEvidence(baseVision, { ...baseObservation, expectedPosture: null });

    expect(decision).toEqual({ kind: 'ask_owner', reason: 'expected_posture_not_configured' });
  });

  it('does not infer failure from a confident but mismatched posture', () => {
    const decision = decideCameraRepEvidence(
      { ...baseVision, posture: 'stand_like', postureConfidence: 0.95 },
      baseObservation,
    );

    expect(decision).toEqual({ kind: 'ask_owner', reason: 'posture_mismatch' });
  });
});
