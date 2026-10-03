import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_evidence.dart';
import 'package:good_dog_academy/features/lessons/session/training_session_record.dart';

DogVisionResult _vision({
  bool dogDetected = true,
  double? detectionConfidence = 0.94,
  DogPosture? posture = DogPosture.sitLike,
  double? postureConfidence = 0.91,
  VisionStressSignal stressSignal = VisionStressSignal.none,
}) => DogVisionResult(
  frameId: 'frame-1',
  analysedAt: '2026-09-12T10:00:01.000Z',
  dogDetected: dogDetected,
  detectionConfidence: detectionConfidence,
  posture: posture,
  postureConfidence: postureConfidence,
  stressSignal: stressSignal,
  stressConfidence: null,
);

CameraRepObservation _observation({
  DogPosture? expectedPosture = DogPosture.sitLike,
  String? responseAt = '2026-09-12T10:00:00.800Z',
}) => CameraRepObservation(
  outcome: TrainingOutcome.success,
  expectedPosture: expectedPosture,
  responseWindowMs: 2500,
  observedAt: '2026-09-12T10:00:01.000Z',
  cueAt: '2026-09-12T10:00:00.000Z',
  responseAt: responseAt,
  markerAt: '2026-09-12T10:00:00.900Z',
  rewardAt: '2026-09-12T10:00:01.100Z',
  cueCount: 1,
  signal: 'sit',
);

void main() {
  test('matching high-confidence observation is accepted', () {
    final decision = decideCameraRepEvidence(_vision(), _observation());

    expect(decision.kind, CameraEvidenceDecisionKind.accept);
    expect(decision.evidence!.source, EvidenceSource.cameraAuto);
    expect(decision.evidence!.confidence, 0.91);
    expect(decision.evidence!.posture, DogPosture.sitLike);
    expect(decision.evidence!.observedOutcome, TrainingOutcome.success);
  });

  test('dog not reliably detected requires owner confirmation', () {
    final decision = decideCameraRepEvidence(
      _vision(dogDetected: false, detectionConfidence: 0.2),
      _observation(),
    );

    expect(decision.kind, CameraEvidenceDecisionKind.askOwner);
    expect(decision.reason, CameraEvidenceUncertainty.dogNotDetected);
  });

  test('low posture confidence requires owner confirmation', () {
    final decision = decideCameraRepEvidence(
      _vision(postureConfidence: 0.4),
      _observation(),
    );

    expect(decision.reason, CameraEvidenceUncertainty.lowPostureConfidence);
  });

  test('stress-like signal overrides automatic scoring', () {
    final decision = decideCameraRepEvidence(
      _vision(stressSignal: VisionStressSignal.avoidanceLike),
      _observation(),
    );

    expect(decision.reason, CameraEvidenceUncertainty.stressSignal);
  });

  test('unknown posture never auto-scores', () {
    final decision = decideCameraRepEvidence(
      _vision(posture: null, postureConfidence: 0.99),
      _observation(),
    );

    expect(decision.reason, CameraEvidenceUncertainty.unknownPosture);
  });

  test('missing expected posture requires owner confirmation', () {
    final decision = decideCameraRepEvidence(
      _vision(),
      _observation(expectedPosture: null),
    );

    expect(
      decision.reason,
      CameraEvidenceUncertainty.expectedPostureNotConfigured,
    );
  });

  test('confident posture mismatch does not infer failure', () {
    final decision = decideCameraRepEvidence(
      _vision(
        posture: DogPosture.standLike,
        postureConfidence: 0.95,
      ),
      _observation(),
    );

    expect(decision.reason, CameraEvidenceUncertainty.postureMismatch);
  });

  test('response outside configured cue window requires confirmation', () {
    final decision = decideCameraRepEvidence(
      _vision(),
      _observation(responseAt: '2026-09-12T10:00:03.500Z'),
    );

    expect(
      decision.reason,
      CameraEvidenceUncertainty.responseWindowExceeded,
    );
  });

  test('incomplete timing evidence fails closed', () {
    final decision = decideCameraRepEvidence(
      _vision(),
      _observation(responseAt: null),
    );

    expect(
      decision.reason,
      CameraEvidenceUncertainty.responseWindowExceeded,
    );
  });
}
