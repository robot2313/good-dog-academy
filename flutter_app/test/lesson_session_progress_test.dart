import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/lessons/data/production_lesson_content.dart';
import 'package:good_dog_academy/features/lessons/data/production_lessons.dart';
import 'package:good_dog_academy/features/lessons/logic/lesson_unlock_service.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_controller.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_record.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_repository.dart';

class _MemoryStorage implements LessonProgressStringStorage {
  final values = <String, String>{};

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

void main() {
  test('all production lessons have complete migrated lesson content', () {
    expect(productionLessonContent, hasLength(productionLessons.length));
    for (final lesson in productionLessons) {
      final content = lessonContentById(lesson.id);
      expect(content.goal.trim(), isNotEmpty, reason: lesson.id);
      expect(content.steps, isNotEmpty, reason: lesson.id);
      expect(content.equipment, isNotEmpty, reason: lesson.id);
      expect(content.completionDescription.trim(), isNotEmpty, reason: lesson.id);
      expect(content.contentVersion, 1);
    }
  });

  test('guided result persists progress and unlocks the next recall lesson', () async {
    final repository = LessonProgressRepository(storage: _MemoryStorage());
    final controller = LessonProgressController(repository: repository);
    await controller.loadForDog(ownerId: 'owner-1', dogId: 'dog-1');

    await controller.recordLessonAttempt(
      ownerId: 'owner-1',
      dogId: 'dog-1',
      lessonId: 'recall-name-response',
      rating: 5,
      attemptedAt: '2026-10-04T00:00:00.000Z',
    );

    expect(controller.records, hasLength(1));
    final record = controller.records.single;
    expect(record.status, LessonProgressStatus.completed);
    expect(record.attempts, 1);
    expect(record.successfulCompletions, 1);
    expect(record.bestPerformanceRating, 5);

    final resolved =
        const LessonUnlockService(productionLessons).resolve(controller.snapshots);
    expect(resolved['recall-short-distance']?.state, LessonState.available);
  });

  test('failed attempt records progress without counting a completion', () async {
    final repository = LessonProgressRepository(storage: _MemoryStorage());
    final controller = LessonProgressController(repository: repository);
    await controller.loadForDog(ownerId: 'owner-1', dogId: 'dog-1');

    await controller.recordLessonAttempt(
      ownerId: 'owner-1',
      dogId: 'dog-1',
      lessonId: 'recall-name-response',
      rating: 2,
      attemptedAt: '2026-10-04T00:00:00.000Z',
    );

    final record = controller.records.single;
    expect(record.status, LessonProgressStatus.inProgress);
    expect(record.attempts, 1);
    expect(record.successfulCompletions, 0);
    expect(record.bestPerformanceRating, 2);
  });

  test('locked lesson requires explicit self-directed bypass', () async {
    final repository = LessonProgressRepository(storage: _MemoryStorage());
    final controller = LessonProgressController(repository: repository);
    await controller.loadForDog(ownerId: 'owner-1', dogId: 'dog-1');

    await expectLater(
      controller.recordLessonAttempt(
        ownerId: 'owner-1',
        dogId: 'dog-1',
        lessonId: 'recall-short-distance',
        rating: 5,
        attemptedAt: '2026-10-04T00:00:00.000Z',
      ),
      throwsA(isA<LessonProgressSelectionException>()),
    );

    await controller.recordLessonAttempt(
      ownerId: 'owner-1',
      dogId: 'dog-1',
      lessonId: 'recall-short-distance',
      rating: 5,
      attemptedAt: '2026-10-04T00:01:00.000Z',
      allowPrerequisiteBypass: true,
    );

    expect(controller.records.single.lessonId, 'recall-short-distance');
    expect(controller.records.single.status, LessonProgressStatus.completed);
  });
}
