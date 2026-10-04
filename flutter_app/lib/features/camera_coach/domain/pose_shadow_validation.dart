import 'camera_coach_models.dart';

enum PoseShadowOwnerLabel { correct, incorrect }

enum PoseShadowGroundTruth {
  standLike,
  sitLike,
  downLike,
  noDog,
  unsure,
}

class PoseShadowValidationSample {
  const PoseShadowValidationSample({
    required this.id,
    required this.expectedPosture,
    required this.predictedPosture,
    required this.confidence,
    this.groundTruth,
    this.ownerLabel,
  });

  final String id;
  final DogPosture expectedPosture;
  final DogPosture? predictedPosture;
  final double? confidence;
  final PoseShadowGroundTruth? groundTruth;
  final PoseShadowOwnerLabel? ownerLabel;

  void validate() {
    if (id.trim().isEmpty) {
      throw const PoseShadowValidationException(
        'Validation sample id must not be empty.',
      );
    }
    final value = confidence;
    if (value != null && (!value.isFinite || value < 0 || value > 1)) {
      throw const PoseShadowValidationException(
        'Validation confidence must be between 0 and 1.',
      );
    }
    if (groundTruth == null && ownerLabel == null) {
      throw const PoseShadowValidationException(
        'Validation sample requires owner ground truth or a legacy label.',
      );
    }
    if (groundTruth != null && ownerLabel != null) {
      throw const PoseShadowValidationException(
        'Validation sample must use ground truth or legacy label, not both.',
      );
    }
  }
}

class PoseShadowValidationPolicy {
  const PoseShadowValidationPolicy({
    this.candidateConfidence = 0.85,
    this.minimumSamples = 50,
    this.maximumFalsePositiveRate = 0.02,
    this.minimumPrecision = 0.98,
  });

  final double candidateConfidence;
  final int minimumSamples;
  final double maximumFalsePositiveRate;
  final double minimumPrecision;
}

const defaultPoseShadowValidationPolicy = PoseShadowValidationPolicy();

class PoseShadowValidationReport {
  const PoseShadowValidationReport({
    required this.samples,
    required this.labelledSamples,
    required this.unsureSamples,
    required this.noDogSamples,
    required this.successfulOwnerReps,
    required this.autoCandidates,
    required this.truePositiveCandidates,
    required this.falsePositiveCandidates,
    required this.missedSuccessfulReps,
    required this.precision,
    required this.falsePositiveRate,
    required this.coverage,
    required this.shadowQualityGatePassed,
    required this.certifiedForAutoScoring,
    required this.blockers,
  });

  final int samples;
  final int labelledSamples;
  final int unsureSamples;
  final int noDogSamples;
  final int successfulOwnerReps;
  final int autoCandidates;
  final int truePositiveCandidates;
  final int falsePositiveCandidates;
  final int missedSuccessfulReps;
  final double? precision;
  final double? falsePositiveRate;
  final double? coverage;
  final bool shadowQualityGatePassed;
  final bool certifiedForAutoScoring;
  final List<String> blockers;
}

class PoseShadowValidationSummary {
  const PoseShadowValidationSummary({
    required this.overall,
    required this.byPosture,
    required this.posturesPassingShadowGate,
    required this.allPosturesPassShadowGate,
    required this.productionAutoScoringEnabled,
  });

  final PoseShadowValidationReport overall;
  final Map<DogPosture, PoseShadowValidationReport> byPosture;
  final int posturesPassingShadowGate;
  final bool allPosturesPassShadowGate;
  final bool productionAutoScoringEnabled;
}

class PoseShadowValidationException implements Exception {
  const PoseShadowValidationException(this.message);

  final String message;

  @override
  String toString() => 'PoseShadowValidationException: $message';
}

const _productionAutoScoringBlocker =
    'Production auto-scoring remains disabled until animal detection, '
    'cue-level validation, licensing review, and physical-device real-dog QA '
    'are complete.';

PoseShadowValidationReport buildPoseShadowValidationReport(
  List<PoseShadowValidationSample> samples, {
  PoseShadowValidationPolicy policy = defaultPoseShadowValidationPolicy,
}) {
  for (final sample in samples) {
    sample.validate();
  }

  final labelled = samples
      .where((sample) => _ownerSaysPredictionIsCorrect(sample) != null)
      .toList(growable: false);
  final unsure = samples
      .where((sample) => sample.groundTruth == PoseShadowGroundTruth.unsure)
      .length;
  final noDog = samples
      .where((sample) => sample.groundTruth == PoseShadowGroundTruth.noDog)
      .length;

  final autoCandidates = labelled.where((sample) {
    final confidence = sample.confidence;
    return confidence != null &&
        confidence >= policy.candidateConfidence &&
        sample.predictedPosture == sample.expectedPosture;
  }).toList(growable: false);

  final successfulOwnerReps = labelled
      .where((sample) => _ownerObservedExpectedPosture(sample) == true)
      .toList(growable: false);
  final truePositiveCandidates = autoCandidates
      .where((sample) => _ownerSaysPredictionIsCorrect(sample) == true)
      .toList(growable: false);
  final falsePositiveCandidates = autoCandidates
      .where((sample) => _ownerSaysPredictionIsCorrect(sample) == false)
      .toList(growable: false);
  final missedSuccessfulReps = successfulOwnerReps
      .where((sample) => !autoCandidates.contains(sample))
      .length;

  final precision = autoCandidates.isEmpty
      ? null
      : truePositiveCandidates.length / autoCandidates.length;
  final falsePositiveRate = autoCandidates.isEmpty
      ? null
      : falsePositiveCandidates.length / autoCandidates.length;
  final coverage = successfulOwnerReps.isEmpty
      ? null
      : truePositiveCandidates.length / successfulOwnerReps.length;

  final qualityBlockers = <String>[];
  if (labelled.length < policy.minimumSamples) {
    qualityBlockers.add(
      'Need at least ${policy.minimumSamples} owner-labelled validation reps.',
    );
  }
  if (autoCandidates.isEmpty) {
    qualityBlockers.add(
      'No high-confidence matching posture predictions have been observed yet.',
    );
  }
  if (precision == null || precision < policy.minimumPrecision) {
    qualityBlockers.add(
      'High-confidence posture precision must be at least '
      '${(policy.minimumPrecision * 100).toStringAsFixed(0)}%.',
    );
  }
  if (falsePositiveRate == null ||
      falsePositiveRate > policy.maximumFalsePositiveRate) {
    qualityBlockers.add(
      'High-confidence false-positive rate must be at most '
      '${(policy.maximumFalsePositiveRate * 100).toStringAsFixed(0)}%.',
    );
  }

  return PoseShadowValidationReport(
    samples: samples.length,
    labelledSamples: labelled.length,
    unsureSamples: unsure,
    noDogSamples: noDog,
    successfulOwnerReps: successfulOwnerReps.length,
    autoCandidates: autoCandidates.length,
    truePositiveCandidates: truePositiveCandidates.length,
    falsePositiveCandidates: falsePositiveCandidates.length,
    missedSuccessfulReps: missedSuccessfulReps,
    precision: precision,
    falsePositiveRate: falsePositiveRate,
    coverage: coverage,
    shadowQualityGatePassed: qualityBlockers.isEmpty,
    certifiedForAutoScoring: false,
    blockers: List<String>.unmodifiable(<String>[
      ...qualityBlockers,
      _productionAutoScoringBlocker,
    ]),
  );
}

PoseShadowValidationSummary buildPoseShadowValidationSummary(
  List<PoseShadowValidationSample> samples, {
  PoseShadowValidationPolicy policy = defaultPoseShadowValidationPolicy,
}) {
  const postures = <DogPosture>[
    DogPosture.standLike,
    DogPosture.sitLike,
    DogPosture.downLike,
  ];

  final byPosture = <DogPosture, PoseShadowValidationReport>{
    for (final posture in postures)
      posture: buildPoseShadowValidationReport(
        samples
            .where((sample) => sample.expectedPosture == posture)
            .toList(growable: false),
        policy: policy,
      ),
  };
  final passing = postures
      .where((posture) => byPosture[posture]!.shadowQualityGatePassed)
      .length;

  return PoseShadowValidationSummary(
    overall: buildPoseShadowValidationReport(samples, policy: policy),
    byPosture: Map<DogPosture, PoseShadowValidationReport>.unmodifiable(
      byPosture,
    ),
    posturesPassingShadowGate: passing,
    allPosturesPassShadowGate: passing == postures.length,
    productionAutoScoringEnabled: false,
  );
}

bool? _ownerSaysPredictionIsCorrect(PoseShadowValidationSample sample) {
  final truth = sample.groundTruth;
  if (truth != null) {
    if (truth == PoseShadowGroundTruth.unsure) return null;
    if (truth == PoseShadowGroundTruth.noDog) return false;
    return sample.predictedPosture == _postureForGroundTruth(truth);
  }
  return switch (sample.ownerLabel) {
    PoseShadowOwnerLabel.correct => true,
    PoseShadowOwnerLabel.incorrect => false,
    null => null,
  };
}

bool? _ownerObservedExpectedPosture(PoseShadowValidationSample sample) {
  final truth = sample.groundTruth;
  if (truth != null) {
    if (truth == PoseShadowGroundTruth.unsure ||
        truth == PoseShadowGroundTruth.noDog) {
      return false;
    }
    return _postureForGroundTruth(truth) == sample.expectedPosture;
  }
  return switch (sample.ownerLabel) {
    PoseShadowOwnerLabel.correct => true,
    PoseShadowOwnerLabel.incorrect => false,
    null => null,
  };
}

DogPosture? _postureForGroundTruth(PoseShadowGroundTruth truth) {
  return switch (truth) {
    PoseShadowGroundTruth.standLike => DogPosture.standLike,
    PoseShadowGroundTruth.sitLike => DogPosture.sitLike,
    PoseShadowGroundTruth.downLike => DogPosture.downLike,
    PoseShadowGroundTruth.noDog || PoseShadowGroundTruth.unsure => null,
  };
}
