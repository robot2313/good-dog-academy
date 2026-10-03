import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_orchestrator.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_evidence.dart';
import 'package:good_dog_academy/features/camera_coach/domain/live_coach_engine.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/camera_frame_source.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/dog_vision_engine.dart';
import 'package:good_dog_academy/features/lessons/session/training_session_record.dart';

CameraFrame _frame(String id, String capturedAt) => CameraFrame(
  id: id,
  capturedAt: capturedAt,
  width: 1280,
  height: 720,
  rotationDegrees: 0,
);

CameraRepObservation _observation({
  String observedAt = '2026-10-04T10:00:01.000Z',
  String? cueAt = '2026-10-04T10:00:00.000Z',
  String? responseAt = '2026-10-04T10:00:01.000Z',
}) => CameraRepObservation(
  outcome: TrainingOutcome.success,
  expectedPosture: DogPosture.sitLike,
  observedAt: observedAt,
  cueAt: cueAt,
  responseAt: responseAt,
  markerAt: null,
  rewardAt: null,
  cueCount: 1,
  signal: null,
);

DogVisionResult _vision({
  bool dogDetected = true,
  double? detectionConfidence = 0.94,
  DogPosture? posture = DogPosture.sitLike,
  double? postureConfidence = 0.91,
  VisionStressSignal stressSignal = VisionStressSignal.none,
}) => DogVisionResult(
  frameId: 'frame',
  analysedAt: '2026-10-04T10:00:01.000Z',
  dogDetected: dogDetected,
  detectionConfidence: detectionConfidence,
  dogBoundingBox: const NormalizedDogBox(
    left: 0.25,
    top: 0.20,
    width: 0.45,
    height: 0.45,
  ),
  detectionSource: DogDetectionSource.dedicatedDetector,
  trackingConfidence: 0.9,
  trackingState: DogTrackingState.tracking,
  posture: posture,
  postureConfidence: postureConfidence,
  stressSignal: stressSignal,
  stressConfidence: null,
);

class _FakeVisionEngine implements DogVisionEngine {
  _FakeVisionEngine(this.result);
  final DogVisionResult result;
  int detections = 0;

  @override
  Future<void> warmup() async {}

  @override
  Future<DogVisionResult> detect(CameraFrame frame) async {
    detections++;
    return DogVisionResult(
      frameId: frame.id,
      analysedAt: result.analysedAt,
      dogDetected: result.dogDetected,
      detectionConfidence: result.detectionConfidence,
      dogBoundingBox: result.dogBoundingBox,
      detectionSource: result.detectionSource,
      trackingConfidence: result.trackingConfidence,
      trackingState: result.trackingState,
      posture: result.posture,
      postureConfidence: result.postureConfidence,
      stressSignal: result.stressSignal,
      stressConfidence: result.stressConfidence,
    );
  }

  @override
  Future<void> dispose() async {}
}

void main() {
  test('three stable frames record one high-confidence camera rep', () async {
    final engine = _FakeVisionEngine(_vision());
    final orchestrator = CameraCoachOrchestrator.withDefaults(
      session: createLiveCoachSession(
        id: 'session-1',
        dogId: 'dog-1',
        lessonId: 'sit',
      ),
      visionEngine: engine,
      minFrameIntervalMs: 0,
      makeRepId: (number) => 'rep-$number',
    );

    final first = await orchestrator.processFrame(
      _frame('f1', '2026-10-04T10:00:01.000Z'),
      _observation(),
    );
    final second = await orchestrator.processFrame(
      _frame('f2', '2026-10-04T10:00:02.000Z'),
      _observation(
        observedAt: '2026-10-04T10:00:02.000Z',
        responseAt: '2026-10-04T10:00:02.000Z',
      ),
    );
    final third = await orchestrator.processFrame(
      _frame('f3', '2026-10-04T10:00:03.000Z'),
      _observation(
        observedAt: '2026-10-04T10:00:03.000Z',
        responseAt: '2026-10-04T10:00:03.000Z',
      ),
    );

    expect(first.kind, CameraCoachFrameKind.waitingForTemporal);
    expect(second.kind, CameraCoachFrameKind.waitingForTemporal);
    expect(third.kind, CameraCoachFrameKind.repRecorded);
    expect(third.rep!.id, 'rep-1');
    expect(third.rep!.evidence.source, EvidenceSource.cameraAuto);
    expect(third.decision!.action, SessionDirectorAction.hold);
    expect(orchestrator.getSession().reps, hasLength(1));
  });

  test('posture held before cue requires departure before scoring', () async {
    final orchestrator = CameraCoachOrchestrator.withDefaults(
      session: createLiveCoachSession(
        id: 'pre-cue',
        dogId: 'dog-1',
        lessonId: 'sit',
      ),
      visionEngine: _FakeVisionEngine(_vision()),
      minFrameIntervalMs: 0,
    );

    for (var index = 1; index <= 3; index++) {
      await orchestrator.processFrame(
        _frame('pre-$index', '2026-10-04T09:59:5$index.000Z'),
        _observation(
          cueAt: null,
          responseAt: null,
          observedAt: '2026-10-04T09:59:5$index.000Z',
        ),
      );
    }

    final afterCue = await orchestrator.processFrame(
      _frame('cue', '2026-10-04T10:00:01.000Z'),
      _observation(),
    );

    expect(afterCue.kind, CameraCoachFrameKind.waitingForTransition);
    expect(orchestrator.getSession().reps, isEmpty);
  });

  test('held posture cannot be counted twice on the same cue', () async {
    final orchestrator = CameraCoachOrchestrator.withDefaults(
      session: createLiveCoachSession(
        id: 'duplicate',
        dogId: 'dog-1',
        lessonId: 'sit',
      ),
      visionEngine: _FakeVisionEngine(_vision()),
      minFrameIntervalMs: 0,
    );

    for (var index = 1; index <= 3; index++) {
      await orchestrator.processFrame(
        _frame('sit-$index', '2026-10-04T10:00:0$index.000Z'),
        _observation(
          observedAt: '2026-10-04T10:00:0$index.000Z',
          responseAt: '2026-10-04T10:00:0$index.000Z',
        ),
      );
    }

    final duplicate = await orchestrator.processFrame(
      _frame('sit-4', '2026-10-04T10:00:04.000Z'),
      _observation(
        observedAt: '2026-10-04T10:00:04.000Z',
        responseAt: '2026-10-04T10:00:04.000Z',
      ),
    );

    expect(duplicate.kind, CameraCoachFrameKind.waitingForTransition);
    expect(orchestrator.getSession().reps, hasLength(1));
  });

  test('no dog never records a rep', () async {
    final orchestrator = CameraCoachOrchestrator.withDefaults(
      session: createLiveCoachSession(
        id: 'no-dog',
        dogId: 'dog-1',
        lessonId: 'sit',
      ),
      visionEngine: _FakeVisionEngine(
        _vision(
          dogDetected: false,
          detectionConfidence: 0.1,
          posture: null,
          postureConfidence: null,
        ),
      ),
    );

    final result = await orchestrator.processFrame(
      _frame('none', '2026-10-04T10:00:01.000Z'),
      _observation(),
    );

    expect(result.kind, CameraCoachFrameKind.dogNotInView);
    expect(orchestrator.getSession().reps, isEmpty);
    expect(orchestrator.getPendingConfirmation(), isNull);
  });

  test('low posture confidence asks owner without mutating session', () async {
    final orchestrator = CameraCoachOrchestrator.withDefaults(
      session: createLiveCoachSession(
        id: 'low',
        dogId: 'dog-1',
        lessonId: 'sit',
      ),
      visionEngine: _FakeVisionEngine(_vision(postureConfidence: 0.3)),
    );

    final result = await orchestrator.processFrame(
      _frame('low', '2026-10-04T10:00:01.000Z'),
      _observation(),
    );

    expect(result.kind, CameraCoachFrameKind.ownerConfirmation);
    expect(
      orchestrator.getPendingConfirmation()!.reason,
      CameraEvidenceUncertainty.lowPostureConfidence,
    );
    expect(orchestrator.getSession().reps, isEmpty);
  });

  test('owner-confirmed stress produces a safety break decision', () async {
    final orchestrator = CameraCoachOrchestrator.withDefaults(
      session: createLiveCoachSession(
        id: 'stress',
        dogId: 'dog-1',
        lessonId: 'sit',
        startDifficulty: const DifficultyVector(
          distance: 2,
          duration: 2,
          distraction: 2,
        ),
      ),
      visionEngine: _FakeVisionEngine(
        _vision(stressSignal: VisionStressSignal.avoidanceLike),
      ),
    );

    final automatic = await orchestrator.processFrame(
      _frame('stress', '2026-10-04T10:00:01.000Z'),
      _observation(),
    );
    expect(automatic.kind, CameraCoachFrameKind.ownerConfirmation);

    final confirmed = orchestrator.confirmPendingByOwner(
      TrainingOutcome.success,
      '2026-10-04T10:00:02.000Z',
    );

    expect(confirmed.kind, CameraCoachFrameKind.repRecorded);
    expect(confirmed.rep!.evidence.source, EvidenceSource.ownerConfirmed);
    expect(confirmed.rep!.evidence.signal, contains('stress:'));
    expect(confirmed.decision!.action, SessionDirectorAction.safetyBreak);
    expect(confirmed.session.difficulty.distraction, 1);
  });

  test('configured frame interval throttles analysis', () async {
    final engine = _FakeVisionEngine(_vision());
    final orchestrator = CameraCoachOrchestrator.withDefaults(
      session: createLiveCoachSession(
        id: 'throttle',
        dogId: 'dog-1',
        lessonId: 'sit',
      ),
      visionEngine: engine,
      minFrameIntervalMs: 500,
    );

    await orchestrator.processFrame(
      _frame('a', '2026-10-04T10:00:01.000Z'),
      _observation(),
    );
    final second = await orchestrator.processFrame(
      _frame('b', '2026-10-04T10:00:01.200Z'),
      _observation(),
    );

    expect(second.kind, CameraCoachFrameKind.throttled);
    expect(engine.detections, 1);
  });

  test('owner stop clears pending evidence and completes session', () async {
    final orchestrator = CameraCoachOrchestrator.withDefaults(
      session: createLiveCoachSession(
        id: 'stop',
        dogId: 'dog-1',
        lessonId: 'sit',
      ),
      visionEngine: _FakeVisionEngine(_vision(postureConfidence: 0.2)),
    );

    await orchestrator.processFrame(
      _frame('pending', '2026-10-04T10:00:01.000Z'),
      _observation(),
    );
    expect(orchestrator.getPendingConfirmation(), isNotNull);

    final stopped = orchestrator.stopByOwner();
    expect(stopped.status, LiveCoachSessionStatus.complete);
    expect(stopped.endedEarly, isTrue);
    expect(stopped.endReason, LiveCoachEndReason.ownerStopped);
    expect(orchestrator.getPendingConfirmation(), isNull);
  });
}
