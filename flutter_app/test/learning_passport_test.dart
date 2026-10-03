import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/progress/learning_passport_service.dart';
import 'package:good_dog_academy/features/lessons/data/production_lessons.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_record.dart';

import 'identity_fixtures.dart';

LessonProgressRecord passportRecord({
  String dogId = 'dog-1',
  String ownerId = 'owner-1',
  String lessonId = 'recall-name-response',
  int completions = 1,
}) => LessonProgressRecord(
  id: '$dogId-$lessonId',
  ownerId: ownerId,
  dogId: dogId,
  lessonId: lessonId,
  status: completions > 0
      ? LessonProgressStatus.completed
      : LessonProgressStatus.inProgress,
  attempts: 1,
  successfulCompletions: completions,
  bestPerformanceRating: 4,
  lastAttemptedAt: '2026-01-01T00:00:00Z',
  lastCompletedAt: completions > 0 ? '2026-01-01T00:00:00Z' : null,
  currentDifficultyAdjustment: 0,
  unlockedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
);
void main() {
  const service = LearningPassportService();
  test('lesson-only metrics and skill/stage aggregation use real records', () {
    final passport = service.query(
      owner: ownerRecord(),
      dog: dogRecord(),
      catalogue: productionLessons,
      progress: [
        passportRecord(),
        passportRecord(lessonId: 'recall-short-distance', completions: 0),
      ],
    );
    expect(passport.total, 60);
    expect(passport.completed, 1);
    expect(passport.inProgress, 1);
    expect(passport.completionFraction, 1 / 60);
    expect(
      passport.skills.fold<int>(0, (sum, skill) => sum + skill.completed),
      1,
    );
    expect(
      passport.stages.fold<int>(0, (sum, stage) => sum + stage.completed),
      1,
    );
    expect(passport.continueLessons.single.id, 'recall-short-distance');
  });
  test('new dog has genuinely empty lesson state', () {
    final passport = service.query(
      owner: ownerRecord(),
      dog: dogRecord(id: 'dog-2'),
      catalogue: productionLessons,
      progress: [],
    );
    expect(passport.completed, 0);
    expect(passport.inProgress, 0);
    expect(passport.continueLessons, isEmpty);
    expect(passport.dogId, 'dog-2');
  });
  test(
    'mixed dog, owner mismatch, duplicates and unknown lessons fail closed',
    () {
      for (final records in [
        [passportRecord(dogId: 'dog-2')],
        [passportRecord(ownerId: 'other')],
        [passportRecord(), passportRecord()],
        [passportRecord(lessonId: 'missing')],
      ]) {
        expect(
          () => service.query(
            owner: ownerRecord(),
            dog: dogRecord(),
            catalogue: productionLessons,
            progress: records,
          ),
          throwsStateError,
        );
      }
      expect(
        () => service.query(
          owner: ownerRecord(),
          dog: dogRecord(ownerId: 'other'),
          catalogue: productionLessons,
          progress: [],
        ),
        throwsStateError,
      );
    },
  );
  test('zero catalogue does not divide by zero', () {
    expect(
      service
          .query(
            owner: ownerRecord(),
            dog: dogRecord(),
            catalogue: [],
            progress: [],
          )
          .completionFraction,
      0,
    );
  });
}
