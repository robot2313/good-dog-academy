import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/lessons/data/production_lessons.dart';
import 'package:good_dog_academy/features/lessons/domain/lesson_models.dart';
import 'package:good_dog_academy/features/lessons/logic/lesson_unlock_service.dart';

void main() {
  test('production catalogue matches the verified migration baseline', () {
    expect(productionLessons, hasLength(60));

    final ids = productionLessons.map((lesson) => lesson.id).toSet();

    expect(ids, hasLength(60));

    final skillCounts = <String, int>{};

    for (final lesson in productionLessons) {
      skillCounts.update(lesson.skill, (count) => count + 1, ifAbsent: () => 1);

      expect(lesson.difficulty, inInclusiveRange(1, 5));

      for (final prerequisite in lesson.prerequisites) {
        expect(
          ids.contains(prerequisite.lessonId),
          isTrue,
          reason:
              '${lesson.id} references missing prerequisite '
              '${prerequisite.lessonId}',
        );
      }
    }

    expect(skillCounts, <String, int>{
      'barking': 6,
      'chewing': 6,
      'confidence': 6,
      'focus': 6,
      'house-training': 6,
      'impulse-control': 6,
      'jumping': 6,
      'loose-lead-walking': 6,
      'reactivity': 6,
      'recall': 6,
    });

    final difficultyCounts = <int, int>{};

    for (final lesson in productionLessons) {
      difficultyCounts.update(
        lesson.difficulty,
        (count) => count + 1,
        ifAbsent: () => 1,
      );
    }

    expect(difficultyCounts[1], 10);
    expect(difficultyCounts[2], 20);
    expect(difficultyCounts[3], 20);
    expect(difficultyCounts[4], 10);
    expect(difficultyCounts[5] ?? 0, 0);
  });

  test('recall prerequisite chain resolves like the React Native service', () {
    const service = LessonUnlockService(productionLessons);

    final initial = service.resolve(const <LessonProgressSnapshot>[]);

    expect(initial['recall-name-response']?.state, LessonState.available);

    expect(initial['recall-short-distance']?.state, LessonState.locked);

    expect(
      initial['recall-short-distance']?.lockReason,
      contains('Name Response'),
    );

    final afterNameResponse = service.resolve(const <LessonProgressSnapshot>[
      LessonProgressSnapshot(
        lessonId: 'recall-name-response',
        attempts: 1,
        successfulCompletions: 1,
      ),
    ]);

    expect(
      afterNameResponse['recall-name-response']?.state,
      LessonState.completed,
    );

    expect(
      afterNameResponse['recall-short-distance']?.state,
      LessonState.available,
    );
  });

  test('duplicate progress records fail closed', () {
    const service = LessonUnlockService(productionLessons);

    expect(
      () => service.resolve(const <LessonProgressSnapshot>[
        LessonProgressSnapshot(lessonId: 'recall-name-response'),
        LessonProgressSnapshot(lessonId: 'recall-name-response'),
      ]),
      throwsStateError,
    );
  });
}
