import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_pose.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/camera_frame_source.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/detector_first_dog_vision_engine.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/dog_detector.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/quadruped_pose_model.dart';

CameraFrame _frame(String id) => CameraFrame(
  id: id,
  capturedAt: '2026-10-04T10:00:00.000Z',
  width: 1280,
  height: 720,
  rotationDegrees: 0,
);

DogDetection _dog({double left = 0.25, double confidence = 0.94}) =>
    DogDetection(
      box: NormalizedDogBox(left: left, top: 0.20, width: 0.45, height: 0.45),
      confidence: confidence,
      source: DogDetectionSource.dedicatedDetector,
    );

QuadrupedPose _standingPose() {
  final keypoints = <QuadrupedJoint, PoseKeypoint>{
    for (var i = 0; i < QuadrupedJoint.values.length; i++)
      QuadrupedJoint.values[i]: PoseKeypoint(
        x: 0.35 + (i % 3) * 0.1,
        y: 0.5,
        confidence: 0.95,
      ),
  };
  keypoints.addAll(<QuadrupedJoint, PoseKeypoint>{
    QuadrupedJoint.neck: const PoseKeypoint(x: 0.42, y: 0.24, confidence: 0.95),
    QuadrupedJoint.tailRoot: const PoseKeypoint(
      x: 0.67,
      y: 0.31,
      confidence: 0.95,
    ),
    QuadrupedJoint.leftShoulder: const PoseKeypoint(
      x: 0.43,
      y: 0.30,
      confidence: 0.95,
    ),
    QuadrupedJoint.rightShoulder: const PoseKeypoint(
      x: 0.47,
      y: 0.30,
      confidence: 0.95,
    ),
    QuadrupedJoint.leftHip: const PoseKeypoint(
      x: 0.63,
      y: 0.32,
      confidence: 0.95,
    ),
    QuadrupedJoint.rightHip: const PoseKeypoint(
      x: 0.67,
      y: 0.32,
      confidence: 0.95,
    ),
    QuadrupedJoint.leftFrontPaw: const PoseKeypoint(
      x: 0.43,
      y: 0.85,
      confidence: 0.95,
    ),
    QuadrupedJoint.rightFrontPaw: const PoseKeypoint(
      x: 0.47,
      y: 0.85,
      confidence: 0.95,
    ),
    QuadrupedJoint.leftBackPaw: const PoseKeypoint(
      x: 0.63,
      y: 0.86,
      confidence: 0.95,
    ),
    QuadrupedJoint.rightBackPaw: const PoseKeypoint(
      x: 0.67,
      y: 0.86,
      confidence: 0.95,
    ),
  });
  return QuadrupedPose(keypoints: keypoints);
}

class _FakeDetector implements DogDetector {
  _FakeDetector(this.results);

  final List<DogDetectorResult> results;
  int warmups = 0;
  int calls = 0;
  int disposals = 0;

  @override
  Future<void> warmup() async {
    warmups++;
  }

  @override
  Future<DogDetectorResult> detect(CameraFrame frame) async {
    final index = calls < results.length ? calls : results.length - 1;
    calls++;
    return results[index];
  }

  @override
  Future<void> dispose() async {
    disposals++;
  }
}

class _FakePoseModel implements QuadrupedPoseModel {
  _FakePoseModel({this.pose, this.throwOnInfer = false});

  final QuadrupedPose? pose;
  final bool throwOnInfer;
  int warmups = 0;
  int calls = 0;
  int disposals = 0;
  NormalizedDogBox? lastBox;

  @override
  Future<void> warmup() async {
    warmups++;
  }

  @override
  Future<QuadrupedPoseInference> infer(
    CameraFrame frame,
    NormalizedDogBox dogBoundingBox,
  ) async {
    calls++;
    lastBox = dogBoundingBox;
    if (throwOnInfer) {
      throw StateError('pose runtime failed');
    }
    return QuadrupedPoseInference(
      dogDetected: true,
      detectionConfidence: 0.9,
      dogBoundingBox: dogBoundingBox,
      pose: pose,
      inferenceMs: 12,
    );
  }

  @override
  Future<void> dispose() async {
    disposals++;
  }
}

DogDetectorResult _result(List<DogDetection> detections) => DogDetectorResult(
  detections: detections,
  inferenceMs: 8,
  model: 'fake-detector',
);

void main() {
  test('warmup prepares detector and pose model', () async {
    final detector = _FakeDetector(<DogDetectorResult>[
      _result(<DogDetection>[]),
    ]);
    final pose = _FakePoseModel(pose: _standingPose());
    final engine = DetectorFirstDogVisionEngine(
      detector: detector,
      tracker: DogTracker(),
      poseModel: pose,
    );

    await engine.warmup();

    expect(detector.warmups, 1);
    expect(pose.warmups, 1);
  });

  test(
    'stable detector lock feeds tracked ROI into pose classification',
    () async {
      var nowMs = 1000;
      final detector = _FakeDetector(<DogDetectorResult>[
        _result(<DogDetection>[_dog()]),
        _result(<DogDetection>[_dog(left: 0.27)]),
      ]);
      final pose = _FakePoseModel(pose: _standingPose());
      final engine = DetectorFirstDogVisionEngine(
        detector: detector,
        tracker: DogTracker(),
        poseModel: pose,
        nowMs: () => nowMs,
        nowIso: () => '2026-10-04T10:00:00.000Z',
      );

      final first = await engine.detect(_frame('f1'));
      nowMs += 100;
      final second = await engine.detect(_frame('f2'));

      expect(first.dogDetected, isTrue);
      expect(first.trackingState, DogTrackingState.acquired);
      expect(first.posture, DogPosture.standLike);
      expect(second.trackingState, DogTrackingState.tracking);
      expect(second.posture, DogPosture.standLike);
      expect(pose.calls, 2);
      expect(pose.lastBox, isNotNull);
      expect(second.stressSignal, VisionStressSignal.uncertain);
    },
  );

  test('no detector lock skips pose and fails closed', () async {
    final detector = _FakeDetector(<DogDetectorResult>[
      _result(<DogDetection>[]),
    ]);
    final pose = _FakePoseModel(pose: _standingPose());
    final engine = DetectorFirstDogVisionEngine(
      detector: detector,
      tracker: DogTracker(),
      poseModel: pose,
      nowMs: () => 1000,
      nowIso: () => '2026-10-04T10:00:00.000Z',
    );

    final result = await engine.detect(_frame('none'));

    expect(result.dogDetected, isFalse);
    expect(result.posture, isNull);
    expect(result.trackingState, DogTrackingState.searching);
    expect(pose.calls, 0);
  });

  test('temporary tracking loss skips pose scoring', () async {
    var nowMs = 1000;
    final detector = _FakeDetector(<DogDetectorResult>[
      _result(<DogDetection>[_dog()]),
      _result(<DogDetection>[]),
    ]);
    final pose = _FakePoseModel(pose: _standingPose());
    final engine = DetectorFirstDogVisionEngine(
      detector: detector,
      tracker: DogTracker(),
      poseModel: pose,
      nowMs: () => nowMs,
      nowIso: () => '2026-10-04T10:00:00.000Z',
    );

    await engine.detect(_frame('locked'));
    nowMs += 500;
    final result = await engine.detect(_frame('gap'));

    expect(result.trackingState, DogTrackingState.temporarilyLost);
    expect(result.dogDetected, isFalse);
    expect(result.posture, isNull);
    expect(pose.calls, 1);
  });

  test(
    'pose runtime failure preserves detector truth but not posture',
    () async {
      final detector = _FakeDetector(<DogDetectorResult>[
        _result(<DogDetection>[_dog()]),
      ]);
      final pose = _FakePoseModel(pose: _standingPose(), throwOnInfer: true);
      final engine = DetectorFirstDogVisionEngine(
        detector: detector,
        tracker: DogTracker(),
        poseModel: pose,
        nowMs: () => 1000,
        nowIso: () => '2026-10-04T10:00:00.000Z',
      );

      final result = await engine.detect(_frame('pose-error'));

      expect(result.dogDetected, isTrue);
      expect(result.posture, isNull);
      expect(result.postureConfidence, isNull);
    },
  );

  test('second dog does not steal the tracked dog or its confidence', () async {
    var nowMs = 1000;
    final detector = _FakeDetector(<DogDetectorResult>[
      _result(<DogDetection>[_dog(left: 0.05, confidence: 0.91)]),
      _result(<DogDetection>[
        _dog(left: 0.55, confidence: 0.99),
        _dog(left: 0.07, confidence: 0.76),
      ]),
      _result(<DogDetection>[_dog(left: 0.55, confidence: 0.99)]),
    ]);
    final pose = _FakePoseModel(pose: _standingPose());
    final engine = DetectorFirstDogVisionEngine(
      detector: detector,
      tracker: DogTracker(),
      poseModel: pose,
      nowMs: () => nowMs,
    );
    await engine.detect(_frame('first'));
    nowMs += 300;
    final matched = await engine.detect(_frame('second'));
    expect(matched.detectionConfidence, 0.76);
    expect(matched.dogBoundingBox!.left, lessThan(0.2));
    nowMs += 300;
    final missing = await engine.detect(_frame('third'));
    expect(missing.trackingState, DogTrackingState.temporarilyLost);
    expect(missing.dogDetected, isFalse);
    expect(missing.detectionConfidence, isNull);
    expect(pose.calls, 2);
  });

  test(
    'QA pose requires two fresh frames and retains joint diagnostics',
    () async {
      var nowMs = 1000;
      const good = PoseKeypoint(x: 0.25, y: 0.35, confidence: 0.94);
      final pose = QuadrupedPose(
        keypoints: {
          QuadrupedJoint.leftShoulder: good,
          QuadrupedJoint.leftElbow: const PoseKeypoint(
            x: 0.25,
            y: 0.58,
            confidence: 0.94,
          ),
          QuadrupedJoint.leftFrontPaw: const PoseKeypoint(
            x: 0.25,
            y: 0.83,
            confidence: 0.94,
          ),
          QuadrupedJoint.leftHip: const PoseKeypoint(
            x: 0.65,
            y: 0.36,
            confidence: 0.94,
          ),
          QuadrupedJoint.leftKnee: const PoseKeypoint(
            x: 0.65,
            y: 0.58,
            confidence: 0.94,
          ),
          QuadrupedJoint.leftBackPaw: const PoseKeypoint(
            x: 0.65,
            y: 0.82,
            confidence: 0.94,
          ),
        },
      );
      final detector = _FakeDetector(<DogDetectorResult>[
        _result(<DogDetection>[_dog()]),
        _result(<DogDetection>[_dog()]),
        _result(<DogDetection>[]),
        _result(<DogDetection>[_dog()]),
      ]);
      final engine = DetectorFirstDogVisionEngine(
        detector: detector,
        tracker: DogTracker(),
        poseModel: _FakePoseModel(pose: pose),
        qaLimbPosture: true,
        nowMs: () => nowMs,
      );
      final first = await engine.detect(_frame('first'));
      expect(first.posture, isNull);
      expect(first.poseDiagnostics?.reason, 'confirming_posture');
      expect(first.poseDiagnostics?.joints, hasLength(6));
      nowMs += 800;
      final confirmed = await engine.detect(_frame('second'));
      expect(confirmed.posture, DogPosture.standLike);
      nowMs += 800;
      expect((await engine.detect(_frame('gap'))).posture, isNull);
      nowMs += 800;
      final reacquired = await engine.detect(_frame('again'));
      expect(reacquired.posture, isNull);
      expect(reacquired.poseDiagnostics?.reason, 'confirming_posture');
    },
  );

  test('reset clears tracking and dispose releases both adapters', () async {
    final detector = _FakeDetector(<DogDetectorResult>[
      _result(<DogDetection>[_dog()]),
    ]);
    final pose = _FakePoseModel(pose: _standingPose());
    final engine = DetectorFirstDogVisionEngine(
      detector: detector,
      tracker: DogTracker(),
      poseModel: pose,
      nowMs: () => 1000,
    );

    await engine.detect(_frame('one'));
    expect(engine.lastTracking, isNotNull);

    engine.resetTracking();
    expect(engine.lastTracking, isNull);

    await engine.dispose();
    expect(detector.disposals, 1);
    expect(pose.disposals, 1);
    expect(engine.lastTracking, isNull);
  });
}
