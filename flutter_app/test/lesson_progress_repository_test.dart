import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_record.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_repository.dart';

void main() {
  test('lesson progress survives a persistence round trip', () async {
    final storage = _MemoryStorage();
    final repository = LessonProgressRepository(storage: storage);

    final record = _record();

    await repository.save(record);

    final loaded = await repository.loadForDog(
      ownerId: 'owner-1',
      dogId: 'dog-1',
    );

    expect(loaded, hasLength(1));
    expect(loaded.single.id, 'progress-1');
    expect(loaded.single.lessonId, 'recall-name-response');
    expect(loaded.single.attempts, 3);
    expect(loaded.single.successfulCompletions, 2);
    expect(loaded.single.bestPerformanceRating, 4);
    expect(loaded.single.status, LessonProgressStatus.inProgress);
  });

  test('persisted record maps into unlock-engine snapshot', () {
    final snapshot = _record().toSnapshot();

    expect(snapshot.lessonId, 'recall-name-response');
    expect(snapshot.attempts, 3);
    expect(snapshot.successfulCompletions, 2);
    expect(snapshot.bestPerformanceRating, 4);
    expect(snapshot.isInProgress, isTrue);
  });

  test('repository preserves records belonging to another dog', () async {
    final storage = _MemoryStorage();
    final repository = LessonProgressRepository(storage: storage);

    await repository.save(_record());

    await repository.save(
      _record(id: 'progress-2', dogId: 'dog-2', lessonId: 'focus-check-in'),
    );

    await repository.replaceForDog(
      ownerId: 'owner-1',
      dogId: 'dog-1',
      records: <LessonProgressRecord>[
        _record(attempts: 4, successfulCompletions: 3),
      ],
    );

    final all = await repository.loadAll();

    expect(all, hasLength(2));

    expect(
      all.firstWhere((record) => record.dogId == 'dog-2').lessonId,
      'focus-check-in',
    );
  });

  test('repository rejects duplicate dog and lesson records', () async {
    final storage = _MemoryStorage();

    storage.values['good_dog_academy.flutter.lesson_progress.v1'] = jsonEncode(
      <String, Object?>{
        'schemaVersion': 1,
        'records': <Object?>[
          _record().toJson(),
          _record(id: 'different-id').toJson(),
        ],
      },
    );

    final repository = LessonProgressRepository(storage: storage);

    expect(
      repository.loadAll,
      throwsA(isA<LessonProgressPersistenceException>()),
    );
  });

  test('repository fails closed on corrupt stored data', () async {
    final storage = _MemoryStorage();

    storage.values['good_dog_academy.flutter.lesson_progress.v1'] =
        '{"schemaVersion":1,"records":"broken"}';

    final repository = LessonProgressRepository(storage: storage);

    expect(
      repository.loadAll,
      throwsA(isA<LessonProgressPersistenceException>()),
    );
  });
}

LessonProgressRecord _record({
  String id = 'progress-1',
  String dogId = 'dog-1',
  String lessonId = 'recall-name-response',
  int attempts = 3,
  int successfulCompletions = 2,
}) {
  return LessonProgressRecord(
    id: id,
    ownerId: 'owner-1',
    dogId: dogId,
    lessonId: lessonId,
    status: LessonProgressStatus.inProgress,
    attempts: attempts,
    successfulCompletions: successfulCompletions,
    lastAttemptedAt: '2026-10-03T04:00:00.000Z',
    lastCompletedAt: null,
    bestPerformanceRating: 4,
    currentDifficultyAdjustment: 0,
    unlockedAt: '2026-10-01T04:00:00.000Z',
    createdAt: '2026-10-01T04:00:00.000Z',
    updatedAt: '2026-10-03T04:00:00.000Z',
  );
}

class _MemoryStorage implements LessonProgressStringStorage {
  final Map<String, String> values = <String, String>{};

  @override
  Future<String?> read(String key) async {
    return values[key];
  }

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}
