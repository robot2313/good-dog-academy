import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_orchestrator.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/expected_cue_response.dart';
import 'package:good_dog_academy/features/camera_coach/domain/live_coach_engine.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/camera_frame_source.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera_coach_runtime_controller.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/dog_vision_engine.dart';
import 'package:good_dog_academy/features/lessons/session/training_session_record.dart';

class _FakeFrameSource implements CameraFrameSource {
  CameraFrameListener? listener;
  int starts = 0;
  int stops = 0;

  @override
  Future<void> start() async {
    starts++;
  }

  @override
  Future<void> stop() async {
    stops++;
  }

  @override
  CameraFrameSubscription subscribe(CameraFrameListener value) {
    listener = value;
    return () => listener = null;
  }
}

class _FakeVisionEngine implements DogVisionEngine {
  _FakeVisionEngine({
    this.postureConfidence = 0.94,
  });

  final double? postureConfidence;
  int warmups = 0;
  int detections = 0;
  int disposals = 0;

  @override
  Future<void> warmup() async {
    warmups++;
  }

  @override
  Future<DogVisionResult> detect(CameraFrame frame) async {
    detections++;
    return DogVisionResult(
      frameId: frame.id,
      analysedAt: frame.capturedAt,
      dogDetected: true,
      detectionConfidence: 0.95,
      dogBoundingBox: const NormalizedDogBox(
        left: 0.30,
        top: 0.25,
        width: 0.35,
        height: 0.40,
      ),
      detectionSource: DogDetectionSource.dedicatedDetector,
      trackingConfidence: 0.92,
      trackingState: DogTrackingState.tracking,
      posture: DogPosture.sitLike,
      postureConfidence: postureConfidence,
      stressSignal: VisionStressSignal.none,
      stressConfidence: null,
    );
  }

  @override
  Future<void> dispose() async {
    disposals++;
  }
}

CameraFrame _frame(int second) => CameraFrame(
  id: 'frame-$second',
  capturedAt: '2026-10-04T10:00:0$second.000Z',
  width: 1280,
  height: 720,
  rotationDegrees: 0,
);

ExpectedCueResponse _sitCue() => const ExpectedCueResponse(
  cueId: 'qa-camera-sit',
  cueLabel: 'Sit',
  expectedPosture: DogPosture.sitLike,
  responseWindowMs: 5000,
);

CameraCoachRuntimeController _controller({
  ExpectedCueResponse? cue,
  _FakeFrameSource? source,
  _FakeVisionEngine? engine,
}) {
  final vision = engine ?? _FakeVisionEngine();
  return CameraCoachRuntimeController(
    frameSource: source ?? _FakeFrameSource(),
    orchestrator: CameraCoachOrchestrator.withDefaults(
      session: createLiveCoachSession(
        id: 'runtime',
        dogId: 'dog-1',
        lessonId: cue?.cueId ?? 'production-lesson',
        targetReps: 5,
      ),
      visionEngine: vision,
      minFrameIntervalMs: 0,
    ),
    dogName: 'Scout',
    cueResponse: cue,
  );
}

void main() {
  test('start warms vision and starts frame source', () async {
    final source = _FakeFrameSource();
    final engine = _FakeVisionEngine();
    final controller = _controller(
      cue: _sitCue(),
      source: source,
      engine: engine,
    );

    await controller.start();

    expect(controller.status, CameraCoachRuntimeStatus.ready);
    expect(engine.warmups, 1);
    expect(source.starts, 1);

    await controller.shutdown();
  });

  test('passive frames update smart framing without scoring a rep', () async {
    final controller = _controller(cue: _sitCue());
    await controller.start();

    await controller.processFrame(_frame(1));

    expect(controller.session.reps, isEmpty);
    expect(controller.framing?.ready, isTrue);
    expect(controller.status, CameraCoachRuntimeStatus.ready);

    await controller.shutdown();
  });

  test('QA cue records one rep after temporal consensus', () async {
    final controller = _controller(cue: _sitCue());
    await controller.start();
    expect(
      await controller.beginCue(
        now: DateTime.parse('2026-10-04T10:00:00Z'),
      ),
      isTrue,
    );

    await controller.processFrame(_frame(1));
    await controller.processFrame(_frame(2));
    await controller.processFrame(_frame(3));

    expect(controller.session.reps, hasLength(1));
    expect(controller.status, CameraCoachRuntimeStatus.ready);
    expect(controller.hasActiveCue, isFalse);

    await controller.shutdown();
  });

  test('uncertain rep waits for owner confirmation then records outcome', () async {
    final controller = _controller(
      cue: _sitCue(),
      engine: _FakeVisionEngine(postureConfidence: 0.30),
    );
    await controller.start();
    await controller.beginCue(
      now: DateTime.parse('2026-10-04T10:00:00Z'),
    );

    await controller.processFrame(_frame(1));

    expect(
      controller.status,
      CameraCoachRuntimeStatus.awaitingOwnerConfirmation,
    );
    expect(controller.session.reps, isEmpty);

    expect(
      await controller.confirmPending(
        TrainingOutcome.partialSuccess,
        now: DateTime.parse('2026-10-04T10:00:02Z'),
      ),
      isTrue,
    );
    expect(controller.session.reps, hasLength(1));
    expect(
      controller.session.reps.single.evidence.observedOutcome,
      TrainingOutcome.partialSuccess,
    );
    expect(controller.status, CameraCoachRuntimeStatus.ready);

    await controller.shutdown();
  });

  test('pause cancels active cue and suppresses frame processing', () async {
    final engine = _FakeVisionEngine();
    final controller = _controller(cue: _sitCue(), engine: engine);
    await controller.start();
    await controller.beginCue(
      now: DateTime.parse('2026-10-04T10:00:00Z'),
    );

    await controller.pause();
    await controller.processFrame(_frame(1));

    expect(controller.status, CameraCoachRuntimeStatus.paused);
    expect(controller.hasActiveCue, isFalse);
    expect(engine.detections, 0);

    await controller.resume();
    expect(controller.status, CameraCoachRuntimeStatus.ready);

    await controller.shutdown();
  });

  test('unconfigured production lesson uses owner-confirmed scoring', () async {
    final controller = _controller();
    await controller.start();

    expect(controller.automaticScoringEnabled, isFalse);
    expect(
      await controller.beginCue(
        now: DateTime.parse('2026-10-04T10:00:00Z'),
      ),
      isTrue,
    );

    await controller.processFrame(_frame(1));

    expect(
      controller.status,
      CameraCoachRuntimeStatus.awaitingOwnerConfirmation,
    );
    expect(controller.session.reps, isEmpty);

    expect(
      await controller.confirmPending(
        TrainingOutcome.success,
        now: DateTime.parse('2026-10-04T10:00:02Z'),
      ),
      isTrue,
    );
    expect(controller.session.reps, hasLength(1));
    expect(
      controller.session.reps.single.evidence.source,
      EvidenceSource.ownerConfirmed,
    );

    await controller.shutdown();
  });

  test('stop closes the live session and frame source', () async {
    final source = _FakeFrameSource();
    final controller = _controller(cue: _sitCue(), source: source);
    await controller.start();

    await controller.stop();

    expect(controller.status, CameraCoachRuntimeStatus.complete);
    expect(controller.session.status, LiveCoachSessionStatus.complete);
    expect(controller.session.endReason, LiveCoachEndReason.ownerStopped);
    expect(source.stops, 1);

    await controller.shutdown();
  });
}
