import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/live_coach_engine.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera_coach_session_persistence_service.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_controller.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_repository.dart';
import 'package:good_dog_academy/features/lessons/session/training_session_record.dart';

class _MemoryStorage implements LessonProgressStringStorage {
  final values = <String, String>{};

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

TrainingRep _rep(
  int number,
  TrainingOutcome outcome, {
  EvidenceSource source = EvidenceSource.cameraAuto,
}) {
  return TrainingRep(
    id: 'rep-$number',
    repNumber: number,
    evidence: RepEvidence(
      source: source,
      confidence: source == EvidenceSource.ownerConfirmed ? null : 0.91,
      observedOutcome: outcome,
      observedAt: '2026-10-04T10:00:0$number.000Z',
      cueAt: '2026-10-04T10:00:00.000Z',
      responseAt: '2026-10-04T10:00:0$number.000Z',
      markerAt: null,
      rewardAt: null,
      cueCount: 1,
      signal: 'recall',
      posture: DogPosture.standLike,
      poseConfidence: 0.89,
      notes: null,
    ),
  );
}

LiveCoachSession _completeSession({
  String id = 'camera-session-1',
  String lessonId = 'recall-name-response',
  List<TrainingOutcome> outcomes = const <TrainingOutcome>[
    TrainingOutcome.success,
    TrainingOutcome.success,
  ],
}) {
  var session = createLiveCoachSession(
    id: id,
    dogId: 'dog-1',
    lessonId: lessonId,
    targetReps: outcomes.length,
  );
  for (var index = 0; index < outcomes.length; index++) {
    session = applyRepToLiveSession(
      session,
      _rep(index + 1, outcomes[index]),
    ).session;
  }
  return session;
}

void main() {
  test('RN-compatible overall outcome requires 75 percent success', () {
    expect(
      overallCameraCoachOutcome(
        _completeSession(
          outcomes: const <TrainingOutcome>[
            TrainingOutcome.success,
            TrainingOutcome.success,
            TrainingOutcome.success,
            TrainingOutcome.partialSuccess,
          ],
        ),
      ),
      TrainingOutcome.success,
    );

    expect(
      overallCameraCoachOutcome(
        _completeSession(
          outcomes: const <TrainingOutcome>[
            TrainingOutcome.success,
            TrainingOutcome.partialSuccess,
            TrainingOutcome.unsuccessful,
            TrainingOutcome.unsuccessful,
          ],
        ),
      ),
      TrainingOutcome.partialSuccess,
    );
  });

  test('ended-early session cannot be overall success', () {
    var session = createLiveCoachSession(
      id: 'early',
      dogId: 'dog-1',
      lessonId: 'recall-name-response',
      targetReps: 5,
    );
    session = applyRepToLiveSession(
      session,
      _rep(1, TrainingOutcome.success),
    ).session;
    session = stopLiveCoachSession(session);

    expect(
      overallCameraCoachOutcome(session),
      TrainingOutcome.partialSuccess,
    );
  });

  test('completed Camera Coach session saves rep evidence atomically', () async {
    final storage = _MemoryStorage();
    final progress = LessonProgressController(
      repository: LessonProgressRepository(storage: storage),
    );
    await progress.loadForDog(ownerId: 'owner-1', dogId: 'dog-1');
    final service = CameraCoachSessionPersistenceService(
      progressController: progress,
    );
    final session = _completeSession();

    final result = await service.persistCompletedSession(
      ownerId: 'owner-1',
      dogId: 'dog-1',
      session: session,
      startedAt: '2026-10-04T10:00:00.000Z',
      completedAt: DateTime.parse('2026-10-04T10:05:00.000Z'),
    );

    expect(result.outcome, TrainingOutcome.success);
    expect(result.rating, 5);
    expect(result.repCount, 2);
    expect(progress.records.single.attempts, 1);
    expect(progress.sessions, hasLength(1));
    expect(progress.sessions.single.id, session.id);
    expect(progress.sessions.single.reps, hasLength(2));
    expect(
      progress.sessions.single.reps.first.evidence.source,
      TrainingEvidenceSource.cameraAuto,
    );
    expect(
      progress.sessions.single.reps.first.evidence.posture,
      StoredDogPosture.standLike,
    );
  });

  test('retrying the same Camera Coach session is idempotent', () async {
    final storage = _MemoryStorage();
    final progress = LessonProgressController(
      repository: LessonProgressRepository(storage: storage),
    );
    await progress.loadForDog(ownerId: 'owner-1', dogId: 'dog-1');
    final service = CameraCoachSessionPersistenceService(
      progressController: progress,
    );
    final session = _completeSession();

    for (var attempt = 0; attempt < 2; attempt++) {
      await service.persistCompletedSession(
        ownerId: 'owner-1',
        dogId: 'dog-1',
        session: session,
        startedAt: '2026-10-04T10:00:00.000Z',
        completedAt: DateTime.parse('2026-10-04T10:05:00.000Z'),
      );
    }

    expect(progress.sessions, hasLength(1));
    expect(progress.records.single.attempts, 1);
  });

  test('QA Camera Coach sessions never enter production history', () async {
    final storage = _MemoryStorage();
    final progress = LessonProgressController(
      repository: LessonProgressRepository(storage: storage),
    );
    await progress.loadForDog(ownerId: 'owner-1', dogId: 'dog-1');
    final service = CameraCoachSessionPersistenceService(
      progressController: progress,
    );
    final qa = _completeSession(
      id: 'qa-session',
      lessonId: 'qa-camera-sit',
      outcomes: const <TrainingOutcome>[TrainingOutcome.success],
    );

    await expectLater(
      service.persistCompletedSession(
        ownerId: 'owner-1',
        dogId: 'dog-1',
        session: qa,
        startedAt: '2026-10-04T10:00:00.000Z',
        completedAt: DateTime.parse('2026-10-04T10:01:00.000Z'),
      ),
      throwsA(isA<CameraCoachSessionPersistenceException>()),
    );

    expect(progress.sessions, isEmpty);
    expect(progress.records, isEmpty);
  });
}
