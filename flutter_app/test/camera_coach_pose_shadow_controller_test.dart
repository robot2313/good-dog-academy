import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/pose_shadow_validation.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/camera_frame_source.dart';
import 'package:good_dog_academy/features/camera_coach/services/pose_shadow_validation_controller.dart';
import 'package:good_dog_academy/features/camera_coach/services/pose_shadow_validation_repository.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/dog_vision_engine.dart';

class _MemoryStorage implements PoseShadowValidationStringStorage {
  final values = <String, String>{};

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

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

class _FakeVision implements DogVisionEngine {
  _FakeVision({
    this.throwOnDetect = false,
    Completer<void>? gate,
  }) : _gate = gate;

  final bool throwOnDetect;
  final Completer<void>? _gate;
  int warmups = 0;
  int calls = 0;
  int disposals = 0;

  @override
  Future<void> warmup() async {
    warmups++;
  }

  @override
  Future<DogVisionResult> detect(CameraFrame frame) async {
    calls++;
    await _gate?.future;
    if (throwOnDetect) throw StateError('candidate model failed');
    return DogVisionResult(
      frameId: frame.id,
      analysedAt: frame.capturedAt,
      dogDetected: true,
      detectionConfidence: 0.95,
      dogBoundingBox: const NormalizedDogBox(
        left: 0.2,
        top: 0.2,
        width: 0.5,
        height: 0.5,
      ),
      detectionSource: DogDetectionSource.dedicatedDetector,
      trackingConfidence: 0.92,
      trackingState: DogTrackingState.tracking,
      posture: DogPosture.sitLike,
      postureConfidence: 0.94,
      stressSignal: VisionStressSignal.uncertain,
      stressConfidence: null,
    );
  }

  @override
  Future<void> dispose() async {
    disposals++;
  }
}

CameraFrame _frame(String id) => CameraFrame(
  id: id,
  capturedAt: '2026-10-04T10:00:00.000Z',
  width: 1280,
  height: 720,
  rotationDegrees: 0,
);

PoseShadowValidationController _controller({
  _FakeFrameSource? source,
  _FakeVision? vision,
  DateTime Function()? now,
}) {
  return PoseShadowValidationController(
    frameSource: source ?? _FakeFrameSource(),
    visionEngine: vision ?? _FakeVision(),
    repository: PoseShadowValidationRepository(
      storage: _MemoryStorage(),
    ),
    dogId: 'dog-1',
    lessonId: 'qa-camera-sit',
    expectedPosture: DogPosture.sitLike,
    now: now,
  );
}

void main() {
  test('start warms candidate model and starts isolated frame source', () async {
    final source = _FakeFrameSource();
    final vision = _FakeVision();
    final controller = _controller(source: source, vision: vision);

    await controller.start();

    expect(controller.status, PoseShadowControllerStatus.ready);
    expect(source.starts, 1);
    expect(vision.warmups, 1);

    await controller.shutdown();
  });

  test('analysed frame can be labelled once with owner ground truth', () async {
    final controller = _controller(
      now: () => DateTime.parse('2026-10-04T10:00:01Z'),
    );
    await controller.start();

    await controller.processFrame(_frame('frame-1'));

    expect(controller.canLabel, isTrue);
    final sample = await controller.recordGroundTruth(
      PoseShadowGroundTruth.sitLike,
    );

    expect(sample, isNotNull);
    expect(sample!.predictedPosture, DogPosture.sitLike);
    expect(sample.confidence, 0.94);
    expect(sample.groundTruth, PoseShadowGroundTruth.sitLike);
    expect(controller.canLabel, isFalse);
    expect(
      await controller.recordGroundTruth(PoseShadowGroundTruth.sitLike),
      isNull,
    );
    expect(controller.summary?.overall.samples, 1);

    await controller.shutdown();
  });

  test('no-dog owner label is preserved even when model predicted sit', () async {
    final controller = _controller();
    await controller.start();
    await controller.processFrame(_frame('false-positive'));

    final sample = await controller.recordGroundTruth(
      PoseShadowGroundTruth.noDog,
    );

    expect(sample!.predictedPosture, DogPosture.sitLike);
    expect(sample.groundTruth, PoseShadowGroundTruth.noDog);
    expect(controller.summary?.overall.falsePositiveCandidates, 1);

    await controller.shutdown();
  });

  test('busy frames are skipped instead of overlapping candidate inference', () async {
    final gate = Completer<void>();
    final vision = _FakeVision(gate: gate);
    final controller = _controller(vision: vision);
    await controller.start();

    final first = controller.processFrame(_frame('first'));
    await Future<void>.delayed(Duration.zero);
    await controller.processFrame(_frame('second'));

    expect(vision.calls, 1);
    expect(controller.diagnostics.framesSkippedBusy, 1);

    gate.complete();
    await first;
    expect(controller.diagnostics.framesAnalysed, 1);

    await controller.shutdown();
  });

  test('candidate inference failure stops capture and enters error state', () async {
    final source = _FakeFrameSource();
    final controller = _controller(
      source: source,
      vision: _FakeVision(throwOnDetect: true),
    );
    await controller.start();

    await controller.processFrame(_frame('bad'));

    expect(controller.status, PoseShadowControllerStatus.error);
    expect(controller.error, isA<StateError>());
    expect(controller.diagnostics.inferenceErrors, 1);
    expect(source.stops, 1);

    await controller.shutdown();
  });

  test('QA validation never writes training history by construction', () async {
    final controller = _controller();
    await controller.start();
    await controller.processFrame(_frame('frame-1'));
    await controller.recordGroundTruth(PoseShadowGroundTruth.sitLike);

    expect(controller.summary?.overall.samples, 1);
    expect(controller.summary?.productionAutoScoringEnabled, isFalse);

    await controller.shutdown();
  });
}
