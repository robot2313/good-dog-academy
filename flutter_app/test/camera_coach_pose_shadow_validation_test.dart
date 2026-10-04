import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/pose_shadow_validation.dart';

PoseShadowValidationSample _sample(
  int index, {
  PoseShadowGroundTruth groundTruth = PoseShadowGroundTruth.sitLike,
  DogPosture? predicted = DogPosture.sitLike,
  double confidence = 0.93,
}) {
  return PoseShadowValidationSample(
    id: 'sample-${index}',
    expectedPosture: DogPosture.sitLike,
    predictedPosture: predicted,
    confidence: confidence,
    groundTruth: groundTruth,
  );
}

void main() {
  test('requires at least 50 owner-labelled reps', () {
    final report = buildPoseShadowValidationReport(
      List<PoseShadowValidationSample>.generate(
        20,
        (index) => _sample(index),
      ),
    );

    expect(report.shadowQualityGatePassed, isFalse);
    expect(report.certifiedForAutoScoring, isFalse);
    expect(report.blockers.join(' '), contains('50'));
    expect(report.precision, 1);
  });

  test('different owner-confirmed posture is a false positive', () {
    final samples = List<PoseShadowValidationSample>.generate(
      50,
      (index) => _sample(index),
    );
    samples[49] = _sample(
      49,
      groundTruth: PoseShadowGroundTruth.standLike,
    );
    samples[48] = _sample(
      48,
      groundTruth: PoseShadowGroundTruth.downLike,
    );

    final report = buildPoseShadowValidationReport(samples);

    expect(report.falsePositiveCandidates, 2);
    expect(report.falsePositiveRate, closeTo(0.04, 0.00001));
    expect(report.shadowQualityGatePassed, isFalse);
  });

  test('no-dog is false positive and unsure is excluded', () {
    final samples = List<PoseShadowValidationSample>.generate(
      52,
      (index) => _sample(index),
    );
    samples[50] = _sample(
      50,
      groundTruth: PoseShadowGroundTruth.noDog,
    );
    samples[51] = _sample(
      51,
      groundTruth: PoseShadowGroundTruth.unsure,
    );

    final report = buildPoseShadowValidationReport(samples);

    expect(report.samples, 52);
    expect(report.labelledSamples, 51);
    expect(report.noDogSamples, 1);
    expect(report.unsureSamples, 1);
    expect(report.falsePositiveCandidates, 1);
  });

  test('legacy correct and incorrect labels remain usable', () {
    final samples = <PoseShadowValidationSample>[
      const PoseShadowValidationSample(
        id: 'legacy-correct',
        expectedPosture: DogPosture.sitLike,
        predictedPosture: DogPosture.sitLike,
        confidence: 0.95,
        ownerLabel: PoseShadowOwnerLabel.correct,
      ),
      const PoseShadowValidationSample(
        id: 'legacy-wrong',
        expectedPosture: DogPosture.sitLike,
        predictedPosture: DogPosture.sitLike,
        confidence: 0.95,
        ownerLabel: PoseShadowOwnerLabel.incorrect,
      ),
    ];

    final report = buildPoseShadowValidationReport(samples);

    expect(report.labelledSamples, 2);
    expect(report.truePositiveCandidates, 1);
    expect(report.falsePositiveCandidates, 1);
  });

  test('statistical shadow gate can pass without production certification', () {
    final samples = List<PoseShadowValidationSample>.generate(
      60,
      (index) => _sample(index),
    );
    samples[59] = _sample(59, predicted: null, confidence: 0.4);

    final report = buildPoseShadowValidationReport(samples);

    expect(report.autoCandidates, 59);
    expect(report.falsePositiveCandidates, 0);
    expect(report.precision, 1);
    expect(report.coverage, closeTo(59 / 60, 0.00001));
    expect(report.shadowQualityGatePassed, isTrue);
    expect(report.certifiedForAutoScoring, isFalse);
    expect(report.blockers.join(' '), contains('animal detection'));
    expect(report.blockers.join(' '), contains('real-dog QA'));
  });

  test('summary requires every calibrated posture to pass separately', () {
    final samples = <PoseShadowValidationSample>[
      for (var index = 0; index < 50; index++)
        PoseShadowValidationSample(
          id: 'sit-${index}',
          expectedPosture: DogPosture.sitLike,
          predictedPosture: DogPosture.sitLike,
          confidence: 0.95,
          groundTruth: PoseShadowGroundTruth.sitLike,
        ),
    ];

    final summary = buildPoseShadowValidationSummary(samples);

    expect(
      summary.byPosture[DogPosture.sitLike]!.shadowQualityGatePassed,
      isTrue,
    );
    expect(
      summary.byPosture[DogPosture.standLike]!.shadowQualityGatePassed,
      isFalse,
    );
    expect(summary.posturesPassingShadowGate, 1);
    expect(summary.allPosturesPassShadowGate, isFalse);
    expect(summary.productionAutoScoringEnabled, isFalse);
  });
}
