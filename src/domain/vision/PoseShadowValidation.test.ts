import { buildPoseShadowValidationReport, type PoseShadowValidationSample } from './PoseShadowValidation';

function sample(index: number, ownerLabel: 'correct' | 'incorrect' = 'correct'): PoseShadowValidationSample {
  return {
    id: `sample-${index}`,
    expectedPosture: 'sit_like',
    predictedPosture: 'sit_like',
    confidence: 0.93,
    ownerLabel,
  };
}

describe('buildPoseShadowValidationReport', () => {
  it('refuses the shadow quality gate before enough owner-labelled real-world samples exist', () => {
    const report = buildPoseShadowValidationReport(Array.from({ length: 20 }, (_, index) => sample(index)));

    expect(report.shadowQualityGatePassed).toBe(false);
    expect(report.certifiedForAutoScoring).toBe(false);
    expect(report.blockers.join(' ')).toContain('50');
    expect(report.precision).toBe(1);
  });

  it('refuses the shadow quality gate when high-confidence matching predictions include too many false positives', () => {
    const samples = Array.from({ length: 50 }, (_, index) => sample(index));
    samples[49] = sample(49, 'incorrect');
    samples[48] = sample(48, 'incorrect');

    const report = buildPoseShadowValidationReport(samples);

    expect(report.falsePositiveCandidates).toBe(2);
    expect(report.falsePositiveRate).toBeCloseTo(0.04, 5);
    expect(report.shadowQualityGatePassed).toBe(false);
    expect(report.certifiedForAutoScoring).toBe(false);
  });

  it('can pass the statistical shadow gate without self-certifying production auto-scoring', () => {
    const samples = Array.from({ length: 60 }, (_, index) => sample(index));
    samples[59] = { ...sample(59), predictedPosture: 'unknown', confidence: 0.4 };

    const report = buildPoseShadowValidationReport(samples);

    expect(report.samples).toBe(60);
    expect(report.autoCandidates).toBe(59);
    expect(report.falsePositiveCandidates).toBe(0);
    expect(report.precision).toBe(1);
    expect(report.coverage).toBeCloseTo(59 / 60, 5);
    expect(report.shadowQualityGatePassed).toBe(true);
    expect(report.certifiedForAutoScoring).toBe(false);
    expect(report.blockers.join(' ')).toContain('animal detection');
    expect(report.blockers.join(' ')).toContain('real-dog QA');
  });
});
