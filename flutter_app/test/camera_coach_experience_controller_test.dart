import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_orchestrator.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/expected_cue_response.dart';
import 'package:good_dog_academy/features/camera_coach/domain/live_coach_engine.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/camera_frame_source.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera_coach_experience_controller.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera_coach_runtime_controller.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera_coach_session_persistence_service.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/dog_vision_engine.dart';
import 'package:good_dog_academy/features/lessons/session/training_session_record.dart';

class _FrameSource implements CameraFrameSource {
  @override
  Future<void> start() async {}

  @override
  Future<void> stop() async {}

  @override
  CameraFrameSubscription subscribe(CameraFrameListener listener) => () {};
}

class _Vision implements DogVisionEngine {
  @override
  Future<void> warmup() async {}

  @override
  Future<DogVisionResult> detect(CameraFrame frame) async {
    return DogVisionResult(
      frameId: frame.id,
      analysedAt: frame.capturedAt,
      dogDetected: true,
      detectionConfidence: 0.95,
      dogBoundingBox: const NormalizedDogBox(
        left: 0.3,
        top: 0.2,
        width: 0.4,
        height: 0.5,
      ),
      detectionSource: DogDetectionSource.dedicatedDetector,
      trackingConfidence: 0.93,
      trackingState: DogTrackingState.tracking,
      posture: DogPosture.sitLike,
      postureConfidence: 0.94,
      stressSignal: VisionStressSignal.none,
      stressConfidence: null,
    );
  }

  @override
  Future<void> dispose() async {}
}

class _PersistCall {
  const _PersistCall({
    required this.sessionId,
    required this.startedAt,
    required this.completedAt,
  });

  final String sessionId;
  final String startedAt;
  final DateTime? completedAt;
}

class _Persister implements CameraCoachSessionPersister {
  _Persister({this.failuresBeforeSuccess = 0});

  int failuresBeforeSuccess;
  final calls = <_PersistCall>[];

  @override
  Future<CameraCoachPersistenceResult> persistCompletedSession({
    required String ownerId,
    required String dogId,
    required LiveCoachSession session,
    required String startedAt,
    String? dailyPlanId,
    DateTime? completedAt,
    String notes = 'Completed with Camera Coach.',
    bool allowPrerequisiteBypass = false,
  }) async {
    calls.add(
      _PersistCall(
        sessionId: session.id,
        startedAt: startedAt,
        completedAt: completedAt,
      ),
    );
    if (failuresBeforeSuccess > 0) {
      failuresBeforeSuccess--;
      throw StateError('save failed');
    }
    return CameraCoachPersistenceResult(
      sessionId: session.id,
      outcome: TrainingOutcome.success,
      rating: 5,
      repCount: session.reps.length,
    );
  }
}

CameraFrame _frame() => const CameraFrame(
  id: 'frame-1',
  capturedAt: '2026-10-04T10:00:01.000Z',
  width: 1280,
  height: 720,
  rotationDegrees: 0,
);

CameraCoachRuntimeController _runtime({
  String lessonId = 'production-lesson',
  ExpectedCueResponse? cue,
}) {
  return CameraCoachRuntimeController(
    frameSource: _FrameSource(),
    orchestrator: CameraCoachOrchestrator.withDefaults(
      session: createLiveCoachSession(
        id: 'camera-session',
        dogId: 'dog-1',
        lessonId: lessonId,
        targetReps: 1,
      ),
      visionEngine: _Vision(),
      minFrameIntervalMs: 0,
    ),
    dogName: 'Scout',
    cueResponse: cue,
  );
}

void main() {
  test('completed owner-confirmed production rep is persisted once', () async {
    final persister = _Persister();
    var tick = 0;
    final times = <DateTime>[
      DateTime.parse('2026-10-04T10:00:00Z'),
      DateTime.parse('2026-10-04T10:00:00Z'),
      DateTime.parse('2026-10-04T10:00:02Z'),
      DateTime.parse('2026-10-04T10:00:03Z'),
    ];
    final experience = CameraCoachExperienceController(
      runtime: _runtime(),
      persister: persister,
      ownerId: 'owner-1',
      dogId: 'dog-1',
      now: () => times[tick++],
    );

    await experience.start();
    expect(await experience.beginCue(), isTrue);
    await experience.runtime.processFrame(_frame());
    expect(
      experience.runtime.status,
      CameraCoachRuntimeStatus.awaitingOwnerConfirmation,
    );

    expect(
      await experience.confirmPending(TrainingOutcome.success),
      isTrue,
    );

    expect(experience.saveState, CameraCoachSaveState.saved);
    expect(persister.calls, hasLength(1));
    expect(persister.calls.single.sessionId, 'camera-session');
    expect(
      persister.calls.single.startedAt,
      '2026-10-04T10:00:00.000Z',
    );

    await experience.stop();
    expect(persister.calls, hasLength(1));

    await experience.shutdown();
  });

  test('failed save can retry with frozen completion timestamp', () async {
    final persister = _Persister(failuresBeforeSuccess: 1);
    var tick = 0;
    final times = <DateTime>[
      DateTime.parse('2026-10-04T10:00:00Z'),
      DateTime.parse('2026-10-04T10:00:00Z'),
      DateTime.parse('2026-10-04T10:00:02Z'),
      DateTime.parse('2026-10-04T10:00:03Z'),
      DateTime.parse('2026-10-04T10:05:00Z'),
    ];
    final experience = CameraCoachExperienceController(
      runtime: _runtime(),
      persister: persister,
      ownerId: 'owner-1',
      dogId: 'dog-1',
      now: () => times[tick++],
    );

    await experience.start();
    await experience.beginCue();
    await experience.runtime.processFrame(_frame());
    await experience.confirmPending(TrainingOutcome.success);

    expect(experience.saveState, CameraCoachSaveState.error);
    final firstCompletedAt = persister.calls.single.completedAt;

    expect(await experience.retrySave(), isTrue);
    expect(experience.saveState, CameraCoachSaveState.saved);
    expect(persister.calls, hasLength(2));
    expect(persister.calls.last.completedAt, firstCompletedAt);

    await experience.shutdown();
  });

  test('QA completion never calls production persister', () async {
    final persister = _Persister();
    var tick = 0;
    final times = <DateTime>[
      DateTime.parse('2026-10-04T10:00:00Z'),
      DateTime.parse('2026-10-04T10:00:00Z'),
      DateTime.parse('2026-10-04T10:00:02Z'),
      DateTime.parse('2026-10-04T10:00:03Z'),
    ];
    final cue = const ExpectedCueResponse(
      cueId: 'qa-camera-sit',
      cueLabel: 'Sit',
      expectedPosture: DogPosture.sitLike,
      responseWindowMs: 5000,
    );
    final experience = CameraCoachExperienceController(
      runtime: _runtime(lessonId: 'qa-camera-sit', cue: cue),
      persister: persister,
      ownerId: 'owner-1',
      dogId: 'dog-1',
      now: () => times[tick++],
    );

    await experience.start();
    await experience.beginCue();
    await experience.runtime.processFrame(_frame());
    await experience.runtime.processFrame(
      const CameraFrame(
        id: 'frame-2',
        capturedAt: '2026-10-04T10:00:02.000Z',
        width: 1280,
        height: 720,
        rotationDegrees: 0,
      ),
    );
    await experience.runtime.processFrame(
      const CameraFrame(
        id: 'frame-3',
        capturedAt: '2026-10-04T10:00:03.000Z',
        width: 1280,
        height: 720,
        rotationDegrees: 0,
      ),
    );
    await Future<void>.delayed(Duration.zero);

    expect(experience.runtime.status, CameraCoachRuntimeStatus.complete);
    expect(experience.saveState, CameraCoachSaveState.qaComplete);
    expect(persister.calls, isEmpty);

    await experience.shutdown();
  });

  test('stopping before any scored rep does not create training history', () async {
    final persister = _Persister();
    final experience = CameraCoachExperienceController(
      runtime: _runtime(),
      persister: persister,
      ownerId: 'owner-1',
      dogId: 'dog-1',
      now: () => DateTime.parse('2026-10-04T10:00:00Z'),
    );

    await experience.start();
    await experience.stop();

    expect(experience.saveState, CameraCoachSaveState.noTrainingEvidence);
    expect(persister.calls, isEmpty);

    await experience.shutdown();
  });
}
