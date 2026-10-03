import '../../lessons/session/training_session_record.dart';
import 'dog_tracking.dart';

enum DogPosture { standLike, sitLike, downLike }

enum VisionStressSignal {
  none,
  avoidanceLike,
  freezingLike,
  escapeLike,
  uncertain,
}

enum EvidenceSource { ownerConfirmed, cameraAuto, voiceAuto, multimodalAuto }

class DogVisionResult {
  const DogVisionResult({
    required this.frameId,
    required this.analysedAt,
    required this.dogDetected,
    required this.detectionConfidence,
    required this.posture,
    required this.postureConfidence,
    required this.stressSignal,
    required this.stressConfidence,
    this.dogBoundingBox,
    this.detectionSource,
    this.trackingConfidence,
    this.trackingState,
  });

  final String frameId;
  final String analysedAt;
  final bool dogDetected;
  final double? detectionConfidence;
  final NormalizedDogBox? dogBoundingBox;
  final DogDetectionSource? detectionSource;
  final double? trackingConfidence;
  final DogTrackingState? trackingState;
  final DogPosture? posture;
  final double? postureConfidence;
  final VisionStressSignal stressSignal;
  final double? stressConfidence;
}

class RepEvidence {
  const RepEvidence({
    required this.source,
    required this.confidence,
    required this.observedOutcome,
    required this.observedAt,
    required this.cueAt,
    required this.responseAt,
    required this.markerAt,
    required this.rewardAt,
    required this.cueCount,
    required this.signal,
    required this.posture,
    required this.poseConfidence,
    required this.notes,
  });

  final EvidenceSource source;
  final double? confidence;
  final TrainingOutcome observedOutcome;
  final String observedAt;
  final String? cueAt;
  final String? responseAt;
  final String? markerAt;
  final String? rewardAt;
  final int? cueCount;
  final String? signal;
  final DogPosture? posture;
  final double? poseConfidence;
  final String? notes;
}

double? clampEvidenceConfidence(double? value) {
  if (value == null || !value.isFinite) return null;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
