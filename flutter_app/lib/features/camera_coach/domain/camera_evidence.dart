import '../../lessons/session/training_session_record.dart';
import 'camera_coach_models.dart';

enum CameraEvidenceDecisionKind { accept, askOwner }

enum CameraEvidenceUncertainty {
  dogNotDetected,
  lowDetectionConfidence,
  unknownPosture,
  unstablePosture,
  lowPostureConfidence,
  stressSignal,
  expectedPostureNotConfigured,
  postureMismatch,
  responseWindowExceeded,
}

class CameraEvidencePolicy {
  const CameraEvidencePolicy({
    this.minDetectionConfidence = 0.70,
    this.minPostureConfidence = 0.72,
  });

  final double minDetectionConfidence;
  final double minPostureConfidence;
}

class CameraRepObservation {
  const CameraRepObservation({
    required this.outcome,
    required this.observedAt,
    required this.cueAt,
    required this.responseAt,
    required this.markerAt,
    required this.rewardAt,
    required this.cueCount,
    required this.signal,
    this.expectedPosture,
    this.responseWindowMs,
    this.notes,
  });

  final TrainingOutcome outcome;
  final DogPosture? expectedPosture;
  final int? responseWindowMs;
  final String observedAt;
  final String? cueAt;
  final String? responseAt;
  final String? markerAt;
  final String? rewardAt;
  final int? cueCount;
  final String? signal;
  final String? notes;
}

class CameraEvidenceDecision {
  const CameraEvidenceDecision._({
    required this.kind,
    this.evidence,
    this.reason,
  });

  const CameraEvidenceDecision.accept(RepEvidence evidence)
      : this._(
          kind: CameraEvidenceDecisionKind.accept,
          evidence: evidence,
        );

  const CameraEvidenceDecision.askOwner(CameraEvidenceUncertainty reason)
      : this._(
          kind: CameraEvidenceDecisionKind.askOwner,
          reason: reason,
        );

  final CameraEvidenceDecisionKind kind;
  final RepEvidence? evidence;
  final CameraEvidenceUncertainty? reason;
}

CameraEvidenceDecision decideCameraRepEvidence(
  DogVisionResult vision,
  CameraRepObservation observation, {
  CameraEvidencePolicy policy = const CameraEvidencePolicy(),
}) {
  final detectionConfidence =
      clampEvidenceConfidence(vision.detectionConfidence);
  final postureConfidence = clampEvidenceConfidence(vision.postureConfidence);

  if (!vision.dogDetected) {
    return const CameraEvidenceDecision.askOwner(
      CameraEvidenceUncertainty.dogNotDetected,
    );
  }

  if (detectionConfidence == null ||
      detectionConfidence < policy.minDetectionConfidence) {
    return const CameraEvidenceDecision.askOwner(
      CameraEvidenceUncertainty.lowDetectionConfidence,
    );
  }

  if (vision.stressSignal != VisionStressSignal.none) {
    return const CameraEvidenceDecision.askOwner(
      CameraEvidenceUncertainty.stressSignal,
    );
  }

  if (vision.posture == null) {
    return const CameraEvidenceDecision.askOwner(
      CameraEvidenceUncertainty.unknownPosture,
    );
  }

  if (postureConfidence == null ||
      postureConfidence < policy.minPostureConfidence) {
    return const CameraEvidenceDecision.askOwner(
      CameraEvidenceUncertainty.lowPostureConfidence,
    );
  }

  if (observation.expectedPosture == null) {
    return const CameraEvidenceDecision.askOwner(
      CameraEvidenceUncertainty.expectedPostureNotConfigured,
    );
  }

  if (!_responseFallsInsideWindow(observation)) {
    return const CameraEvidenceDecision.askOwner(
      CameraEvidenceUncertainty.responseWindowExceeded,
    );
  }

  if (vision.posture != observation.expectedPosture) {
    return const CameraEvidenceDecision.askOwner(
      CameraEvidenceUncertainty.postureMismatch,
    );
  }

  return CameraEvidenceDecision.accept(
    RepEvidence(
      source: EvidenceSource.cameraAuto,
      confidence: detectionConfidence < postureConfidence
          ? detectionConfidence
          : postureConfidence,
      observedOutcome: TrainingOutcome.success,
      observedAt: observation.observedAt,
      cueAt: observation.cueAt,
      responseAt: observation.responseAt,
      markerAt: observation.markerAt,
      rewardAt: observation.rewardAt,
      cueCount: observation.cueCount,
      signal: observation.signal,
      posture: vision.posture,
      poseConfidence: postureConfidence,
      notes: observation.notes,
    ),
  );
}

bool _responseFallsInsideWindow(CameraRepObservation observation) {
  final responseWindowMs = observation.responseWindowMs;
  if (responseWindowMs == null) return true;

  final cueAt = observation.cueAt == null
      ? null
      : DateTime.tryParse(observation.cueAt!);
  final responseAt = observation.responseAt == null
      ? null
      : DateTime.tryParse(observation.responseAt!);
  if (cueAt == null || responseAt == null) return false;

  final elapsed = responseAt.difference(cueAt).inMilliseconds;
  final safeWindow = responseWindowMs < 0 ? 0 : responseWindowMs;
  return elapsed >= 0 && elapsed <= safeWindow;
}
