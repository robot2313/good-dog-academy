import { buildPoseShadowValidationReport, type PoseShadowValidationSample } from './PoseShadowValidation';

function sample(
  index: number,
  groundTruth: PoseShadowValidationSample['groundTruth'] = 'sit_like',
): PoseShadowValidationSample {
  return {
    id: `sample-${index}`,
    expectedPosture: 'sit_like',
    predictedPosture: 'sit_like',
    confidence: 0.93,
    groundTruth,
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

  it('treats owner-confirmed different postures as false positives for a high-confidence prediction', () => {
    const samples = Array.from({ length: 50 }, (_, index) => sample(index));
    samples[49] = sample(49, 'stand_like');
    samples[48] = sample(48, 'down_like');

    const report = buildPoseShadowValidationReport(samples);

    expect(report.falsePositiveCandidates).toBe(2);
    expect(report.falsePositiveRate).toBeCloseTo(0.04, 5);
    expect(report.shadowQualityGatePassed).toBe(false);
  });

  it('counts no-dog labels as false positives and excludes unsure labels from quality statistics', () => {
    const samples = Array.from({ length: 52 }, (_, index) => sample(index));
    samples[50] = sample(50, 'no_dog');
    samples[51] = sample(51, 'unsure');

    const report = buildPoseShadowValidationReport(samples);

    expect(report.samples).toBe(52);
    expect(report.labelledSamples).toBe(51);
    expect(report.noDogSamples).toBe(1);
    expect(report.unsureSamples).toBe(1);
    expect(report.falsePositiveCandidates).toBe(1);
  });

  it('keeps legacy correct/incorrect labels usable while new samples collect richer ground truth', () => {
    const samples: PoseShadowValidationSample[] = [
      {
        id: 'legacy-correct',
        expectedPosture: 'sit_like',
        predictedPosture: 'sit_like',
        confidence: 0.95,
        ownerLabel: 'correct',
      },
      {
        id: 'legacy-wrong',
        expectedPosture: 'sit_like',
        predictedPosture: 'sit_like',
        confidence: 0.95,
        ownerLabel: 'incorrect',
      },
    ];

    const report = buildPoseShadowValidationReport(samples);
    expect(report.labelledSamples).toBe(2);
    expect(report.truePositiveCandidates).toBe(1);
    expect(report.falsePositiveCandidates).toBe(1);
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
