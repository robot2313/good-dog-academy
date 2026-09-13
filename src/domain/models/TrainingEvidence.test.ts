import { clampEvidenceConfidence, correctTrainingRep, effectiveRepOutcome, type TrainingRep } from './TrainingEvidence';

describe('TrainingEvidence', () => {
  const baseRep: TrainingRep = {
    id: 'rep-1',
    repNumber: 1,
    evidence: {
      source: 'multimodal_auto',
      confidence: 0.84,
      observedOutcome: 'success',
      observedAt: '2026-09-12T10:00:00.000Z',
      cueAt: '2026-09-12T09:59:58.500Z',
      responseAt: '2026-09-12T10:00:00.000Z',
      markerAt: '2026-09-12T10:00:00.300Z',
      rewardAt: null,
      cueCount: 1,
      signal: 'sit_like',
      posture: 'sit_like',
      poseConfidence: 0.88,
      notes: null,
    },
    correction: null,
  };

  it('uses the raw observed outcome until an owner correction exists', () => {
    expect(effectiveRepOutcome(baseRep)).toBe('success');
  });

  it('preserves raw evidence while owner correction becomes authoritative', () => {
    const corrected = correctTrainingRep(
      baseRep,
      'unsuccessful',
      '2026-09-12T10:00:05.000Z',
      'Dog broke position before the marker',
    );

    expect(corrected.evidence).toEqual(baseRep.evidence);
    expect(corrected.evidence.observedOutcome).toBe('success');
    expect(corrected.correction?.correctedOutcome).toBe('unsuccessful');
    expect(effectiveRepOutcome(corrected)).toBe('unsuccessful');
  });

  it('clamps machine confidence into a valid probability range', () => {
    expect(clampEvidenceConfidence(1.4)).toBe(1);
    expect(clampEvidenceConfidence(-0.2)).toBe(0);
    expect(clampEvidenceConfidence(0.72)).toBe(0.72);
    expect(clampEvidenceConfidence(Number.NaN)).toBeNull();
  });
});
