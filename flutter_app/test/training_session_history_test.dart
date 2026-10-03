import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_record.dart';
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

LessonProgressRecord _progress({
  String dogId = 'dog-1',
  int attempts = 1,
}) => LessonProgressRecord(
  id: 'progress-$dogId-recall',
  ownerId: 'owner-1',
  dogId: dogId,
  lessonId: 'recall-name-response',
  status: LessonProgressStatus.completed,
  attempts: attempts,
  successfulCompletions: attempts,
  lastAttemptedAt: '2026-10-04T00:05:00.000Z',
  lastCompletedAt: '2026-10-04T00:05:00.000Z',
  bestPerformanceRating: 5,
  currentDifficultyAdjustment: 0,
  unlockedAt: '2026-10-04T00:00:00.000Z',
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:05:00.000Z',
);

TrainingSessionRecord _session({
  String id = 'session-1',
  String dogId = 'dog-1',
  String lessonId = 'recall-name-response',
}) => TrainingSessionRecord(
  id: id,
  dogId: dogId,
  lessonId: lessonId,
  dailyPlanId: null,
  startedAt: '2026-10-04T00:00:00.000Z',
  completedAt: '2026-10-04T00:05:00.000Z',
  durationMinutes: 5,
  outcome: TrainingOutcome.success,
  notes: 'Guided check-ins: 4 successful; 0 needed help.',
);

void main() {
  test('schema v1 progress migrates safely with empty session history', () async {
    final storage = _MemoryStorage();
    const key = 'good_dog_academy.flutter.lesson_progress.v1';
    storage.values[key] = jsonEncode(<String, Object?>{
      'schemaVersion': 1,
      'records': <Object?>[_progress().toJson()],
    });
    final repository = LessonProgressRepository(storage: storage);

    final data = await repository.loadTrainingDataForDog(
      ownerId: 'owner-1',
      dogId: 'dog-1',
    );

    expect(data.records, hasLength(1));
    expect(data.sessions, isEmpty);
  });

  test('progress and completed session are committed in one store write', () async {
    final storage = _MemoryStorage();
    final repository = LessonProgressRepository(storage: storage);

    final result = await repository.saveCompletedSessionWithProgress(
      ownerId: 'owner-1',
      progress: _progress(),
      session: _session(),
    );

    expect(result.idempotent, isFalse);
    expect(result.data.records, hasLength(1));
    expect(result.data.sessions, hasLength(1));

    final raw = jsonDecode(storage.values.values.single) as Map<String, dynamic>;
    expect(raw['schemaVersion'], 2);
    expect(raw['records'], hasLength(1));
    expect(raw['sessions'], hasLength(1));
  });

  test('same completed session is idempotent and does not duplicate history', () async {
    final storage = _MemoryStorage();
    final repository = LessonProgressRepository(storage: storage);

    await repository.saveCompletedSessionWithProgress(
      ownerId: 'owner-1',
      progress: _progress(),
      session: _session(),
    );
    final second = await repository.saveCompletedSessionWithProgress(
      ownerId: 'owner-1',
      progress: _progress(attempts: 2),
      session: _session(),
    );

    expect(second.idempotent, isTrue);
    expect(second.data.records.single.attempts, 1);
    expect(second.data.sessions, hasLength(1));
  });

  test('session id conflict fails closed', () async {
    final storage = _MemoryStorage();
    final repository = LessonProgressRepository(storage: storage);

    await repository.saveCompletedSessionWithProgress(
      ownerId: 'owner-1',
      progress: _progress(),
      session: _session(),
    );

    expect(
      () => repository.saveCompletedSessionWithProgress(
        ownerId: 'owner-1',
        progress: _progress(),
        session: _session(lessonId: 'focus-check-in'),
      ),
      throwsA(isA<LessonProgressPersistenceException>()),
    );
  });

  test('session history is isolated by dog', () async {
    final storage = _MemoryStorage();
    final repository = LessonProgressRepository(storage: storage);

    await repository.saveCompletedSessionWithProgress(
      ownerId: 'owner-1',
      progress: _progress(),
      session: _session(),
    );
    await repository.saveCompletedSessionWithProgress(
      ownerId: 'owner-1',
      progress: _progress(dogId: 'dog-2'),
      session: _session(id: 'session-2', dogId: 'dog-2'),
    );

    expect(
      await repository.loadSessionsForDog(
        ownerId: 'owner-1',
        dogId: 'dog-1',
      ),
      hasLength(1),
    );
    expect(
      await repository.loadSessionsForDog(
        ownerId: 'owner-1',
        dogId: 'dog-2',
      ),
      hasLength(1),
    );
  });
}
