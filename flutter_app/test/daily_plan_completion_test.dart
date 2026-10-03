import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/assessment/assessment_catalogue.dart';
import 'package:good_dog_academy/features/assessment/assessment_controller.dart';
import 'package:good_dog_academy/features/assessment/assessment_models.dart';
import 'package:good_dog_academy/features/assessment/assessment_repository.dart';
import 'package:good_dog_academy/features/daily_plan/daily_plan_controller.dart';
import 'package:good_dog_academy/features/daily_plan/daily_plan_repository.dart';
import 'package:good_dog_academy/features/lessons/session/training_session_record.dart';

import 'identity_fixtures.dart';

class _AssessmentStorage implements AssessmentStringStorage {
  final values = <String, String>{};

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

class _PlanStorage implements DailyPlanStringStorage {
  final values = <String, String>{};

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

Future<(BehaviourProfileRecord, BehaviourAssessmentRecord)> _assessed() async {
  final controller = AssessmentController(
    repository: AssessmentRepository(storage: _AssessmentStorage()),
  );
  await controller.loadForDog(ownerId: 'owner-1', dog: dogRecord());
  await controller.complete(
    ownerId: 'owner-1',
    dog: dogRecord(),
    answers: <String, AssessmentOption>{
      for (final question in assessmentQuestions)
        question.id: AssessmentOption.sometimes,
    },
    now: DateTime.parse('2026-10-04T00:00:00Z'),
  );
  return (controller.profile!, controller.assessment!);
}

void main() {
  test('daily plan persists completed after every planned item has a session', () async {
    final assessed = await _assessed();
    final repository = DailyPlanRepository(storage: _PlanStorage());
    final controller = DailyPlanController(repository: repository);

    await controller.sync(
      owner: ownerRecord(),
      dog: dogRecord(),
      profile: assessed.$1,
      assessment: assessed.$2,
      progressRecords: const [],
      sessions: const [],
      now: DateTime.parse('2026-10-04T09:00:00Z'),
    );

    final initial = controller.plan!;
    expect(initial.status, 'planned');

    final sessions = <TrainingSessionRecord>[
      for (var index = 0; index < initial.items.length; index++)
        TrainingSessionRecord(
          id: 'session-${index + 1}',
          dogId: initial.dogId,
          lessonId: initial.items[index].lessonId,
          dailyPlanId: initial.id,
          startedAt: '2026-10-04T09:00:00.000Z',
          completedAt: '2026-10-04T09:05:00.000Z',
          durationMinutes: 5,
          outcome: TrainingOutcome.success,
          notes: '',
        ),
    ];

    await controller.sync(
      owner: ownerRecord(),
      dog: dogRecord(),
      profile: assessed.$1,
      assessment: assessed.$2,
      progressRecords: const [],
      sessions: sessions,
      now: DateTime.parse('2026-10-04T09:10:00Z'),
    );

    expect(controller.plan!.status, 'completed');
    final stored = await repository.findForDogDate(
      ownerId: 'owner-1',
      dogId: 'dog-1',
      localDate: controller.plan!.localDate,
    );
    expect(stored?.status, 'completed');
  });

  test('unrelated or partial session history does not complete the plan', () async {
    final assessed = await _assessed();
    final controller = DailyPlanController(
      repository: DailyPlanRepository(storage: _PlanStorage()),
    );

    await controller.sync(
      owner: ownerRecord(),
      dog: dogRecord(),
      profile: assessed.$1,
      assessment: assessed.$2,
      progressRecords: const [],
      sessions: const [],
      now: DateTime.parse('2026-10-04T09:00:00Z'),
    );
    final initial = controller.plan!;

    final session = TrainingSessionRecord(
      id: 'unrelated',
      dogId: initial.dogId,
      lessonId: initial.items.first.lessonId,
      dailyPlanId: 'different-plan',
      startedAt: '2026-10-04T09:00:00.000Z',
      completedAt: '2026-10-04T09:05:00.000Z',
      durationMinutes: 5,
      outcome: TrainingOutcome.success,
      notes: '',
    );

    await controller.sync(
      owner: ownerRecord(),
      dog: dogRecord(),
      profile: assessed.$1,
      assessment: assessed.$2,
      progressRecords: const [],
      sessions: <TrainingSessionRecord>[session],
      now: DateTime.parse('2026-10-04T09:10:00Z'),
    );

    expect(controller.plan!.status, 'planned');
  });
}
