import { buildPoseShadowValidationReport, type PoseShadowValidationSample } from './PoseShadowValidation';

function sample(index: number, ownerOutcome: 'success' | 'partial-success' | 'unsuccessful' = 'success'): PoseShadowValidationSample {
  return {
    id: `sample-${index}`,
    expectedPosture: 'sit_like',
    predictedPosture: 'sit_like',
    confidence: 0.93,
    ownerOutcome,
  };
}

describe('buildPoseShadowValidationReport', () => {
  it('refuses certification before enough owner-labelled real-world samples exist', () => {
    const report = buildPoseShadowValidationReport(Array.from({ length: 20 }, (_, index) => sample(index)));

    expect(report.certifiedForAutoScoring).toBe(false);
    expect(report.blockers.join(' ')).toContain('50');
    expect(report.precision).toBe(1);
  });

  it('refuses certification when high-confidence matching predictions include too many false positives', () => {
    const samples = Array.from({ length: 50 }, (_, index) => sample(index));
    samples[49] = sample(49, 'unsuccessful');
    samples[48] = sample(48, 'partial-success');

    const report = buildPoseShadowValidationReport(samples);

    expect(report.falsePositiveCandidates).toBe(2);
    expect(report.falsePositiveRate).toBeCloseTo(0.04, 5);
    expect(report.certifiedForAutoScoring).toBe(false);
  });

  it('certifies only after sample volume, precision and false-positive requirements all pass', () => {
    const samples = Array.from({ length: 60 }, (_, index) => sample(index));
    samples[59] = { ...sample(59), predictedPosture: 'unknown', confidence: 0.4 };

    const report = buildPoseShadowValidationReport(samples);

    expect(report.samples).toBe(60);
    expect(report.autoCandidates).toBe(59);
    expect(report.falsePositiveCandidates).toBe(0);
    expect(report.precision).toBe(1);
    expect(report.coverage).toBeCloseTo(59 / 60, 5);
    expect(report.certifiedForAutoScoring).toBe(true);
  });
});
