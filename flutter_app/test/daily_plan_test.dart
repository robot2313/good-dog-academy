import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/assessment/assessment_catalogue.dart';
import 'package:good_dog_academy/features/assessment/assessment_controller.dart';
import 'package:good_dog_academy/features/assessment/assessment_models.dart';
import 'package:good_dog_academy/features/assessment/assessment_repository.dart';
import 'package:good_dog_academy/features/daily_plan/daily_plan_generation_service.dart';
import 'package:good_dog_academy/features/daily_plan/daily_plan_recommendation_service.dart';
import 'package:good_dog_academy/features/daily_plan/daily_plan_repository.dart';
import 'package:good_dog_academy/features/lessons/data/production_lessons.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_record.dart';

import 'identity_fixtures.dart';

class _PlanStorage implements DailyPlanStringStorage {
  final values = <String, String>{};
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

class _AssessmentStorage implements AssessmentStringStorage {
  final values = <String, String>{};
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

Map<String, AssessmentOption> _answers() => <String, AssessmentOption>{
  for (final question in assessmentQuestions)
    question.id: question.skill == 'recall'
        ? AssessmentOption.rarely
        : AssessmentOption.often,
};

Future<(BehaviourProfileRecord, BehaviourAssessmentRecord)> _assessed() async {
  final controller = AssessmentController(
    repository: AssessmentRepository(storage: _AssessmentStorage()),
  );
  await controller.loadForDog(ownerId: 'owner-1', dog: dogRecord());
  await controller.complete(
    ownerId: 'owner-1',
    dog: dogRecord(),
    answers: _answers(),
    now: DateTime.parse('2026-10-04T00:00:00Z'),
  );
  return (controller.profile!, controller.assessment!);
}

LessonProgressRecord _progress({
  required String lessonId,
  LessonProgressStatus status = LessonProgressStatus.inProgress,
  int attempts = 3,
  int completions = 0,
  String? lastCompletedAt,
}) => LessonProgressRecord(
  id: 'progress-$lessonId',
  ownerId: 'owner-1',
  dogId: 'dog-1',
  lessonId: lessonId,
  status: status,
  attempts: attempts,
  successfulCompletions: completions,
  lastAttemptedAt: '2026-10-03T00:00:00Z',
  lastCompletedAt: lastCompletedAt,
  bestPerformanceRating: completions > 0 ? 4 : 2,
  currentDifficultyAdjustment: 0,
  unlockedAt: '2026-10-01T00:00:00Z',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-03T00:00:00Z',
);

void main() {
  test('weak in-progress skill is prioritised deterministically', () async {
    final assessed = await _assessed();
    final recall = productionLessons.firstWhere(
      (lesson) => lesson.id == 'recall-name-response',
    );
    final service = DailyPlanRecommendationService(productionLessons);

    final result = service.recommend(
      dogAgeMonths: 36,
      behaviourProfile: assessed.$1,
      progressRecords: <LessonProgressRecord>[
        _progress(lessonId: recall.id),
      ],
      now: DateTime.parse('2026-10-04T00:00:00Z'),
      targetMinutes: 20,
    );

    expect(result.recommendations.first.skill, 'recall');
    expect(result.recommendations.first.reasons, contains('IN_PROGRESS'));
    expect(result.recommendations.first.reasons, contains('NEEDS_PRACTICE'));
  });

  test('completed lessons are reinforcement candidates', () async {
    final assessed = await _assessed();
    final first = productionLessons.first;
    final service = DailyPlanRecommendationService([first]);

    final result = service.recommend(
      dogAgeMonths: 36,
      behaviourProfile: assessed.$1,
      progressRecords: <LessonProgressRecord>[
        _progress(
          lessonId: first.id,
          status: LessonProgressStatus.completed,
          attempts: 1,
          completions: 1,
          lastCompletedAt: '2026-09-01T00:00:00Z',
        ),
      ],
      now: DateTime.parse('2026-10-04T00:00:00Z'),
    );

    expect(result.recommendations.single.kind, 'reinforcement');
    expect(
      result.recommendations.single.reasons,
      contains('REINFORCEMENT_DUE'),
    );
  });

  test('generation persists and reuses one plan per dog local day', () async {
    final assessed = await _assessed();
    final repository = DailyPlanRepository(storage: _PlanStorage());
    final service = DailyPlanGenerationService(repository: repository);

    final first = await service.getOrCreate(
      owner: ownerRecord(),
      dog: dogRecord(),
      profile: assessed.$1,
      assessment: assessed.$2,
      progress: const <LessonProgressRecord>[],
      now: DateTime.parse('2026-10-04T12:00:00Z'),
    );
    final second = await service.getOrCreate(
      owner: ownerRecord(),
      dog: dogRecord(),
      profile: assessed.$1,
      assessment: assessed.$2,
      progress: const <LessonProgressRecord>[],
      now: DateTime.parse('2026-10-04T13:00:00Z'),
      targetMinutes: 30,
    );

    expect(second.toJson(), first.toJson());
    expect(await repository.loadAll(), hasLength(1));
    expect(first.items.first.role, 'primary');
    expect(first.sourceAssessmentId, assessed.$2.id);
  });

  test('recent plan occurrence applies rotation penalty', () async {
    final assessed = await _assessed();
    final service = DailyPlanRecommendationService(productionLessons);
    final baseline = service.recommend(
      dogAgeMonths: 36,
      behaviourProfile: assessed.$1,
      progressRecords: const <LessonProgressRecord>[],
      now: DateTime.parse('2026-10-04T00:00:00Z'),
      maximumLessons: 1,
    );
    final candidate = baseline.recommendations.single;
    final recent = await DailyPlanGenerationService(
      repository: DailyPlanRepository(storage: _PlanStorage()),
    ).getOrCreate(
      owner: ownerRecord(),
      dog: dogRecord(),
      profile: assessed.$1,
      assessment: assessed.$2,
      progress: const <LessonProgressRecord>[],
      now: DateTime.parse('2026-10-03T00:00:00Z'),
    );

    final rotated = service.recommend(
      dogAgeMonths: 36,
      behaviourProfile: assessed.$1,
      progressRecords: const <LessonProgressRecord>[],
      now: DateTime.parse('2026-10-04T00:00:00Z'),
      maximumLessons: 1,
      recentPlans: [recent],
    );

    if (recent.items.any((item) => item.lessonId == candidate.lessonId)) {
      expect(
        rotated.recommendations.single.reasons,
        isNot(contains('RECENTLY_PLANNED_PENALTY')),
      );
    }
  });
}
