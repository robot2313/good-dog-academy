import '../assessment/assessment_models.dart';
import '../identity/app_identity_record.dart';
import '../lessons/data/production_lessons.dart';
import '../lessons/progress/lesson_progress_record.dart';
import 'daily_plan_models.dart';
import 'daily_plan_recommendation_service.dart';
import 'daily_plan_repository.dart';

class DailyPlanGenerationException implements Exception {
  const DailyPlanGenerationException(this.message);
  final String message;
}

class DailyPlanGenerationService {
  const DailyPlanGenerationService({
    required this.repository,
    this.catalogue = productionLessons,
  });

  final DailyPlanRepository repository;
  final List catalogue;

  Future<DailyPlanRecord> getOrCreate({
    required AppOwnerRecord owner,
    required AppDogRecord dog,
    required BehaviourProfileRecord profile,
    required BehaviourAssessmentRecord assessment,
    required List<LessonProgressRecord> progress,
    required DateTime now,
    int targetMinutes = 15,
  }) async {
    owner.validate();
    dog.validate();
    profile.validate();
    assessment.validate();

    if (dog.ownerId != owner.id ||
        profile.dogId != dog.id ||
        assessment.ownerId != owner.id ||
        assessment.dogId != dog.id ||
        profile.assessmentId != assessment.id) {
      throw const DailyPlanGenerationException(
        'Daily plan identity and assessment relationships are inconsistent.',
      );
    }

    final localNow = now.toLocal();
    final localDate =
        '${localNow.year.toString().padLeft(4, '0')}-'
        '${localNow.month.toString().padLeft(2, '0')}-'
        '${localNow.day.toString().padLeft(2, '0')}';

    final existing = await repository.findForDogDate(
      ownerId: owner.id,
      dogId: dog.id,
      localDate: localDate,
    );
    if (existing != null) return existing;

    final recentPlans = await repository.recentForDog(
      ownerId: owner.id,
      dogId: dog.id,
      beforeDate: localDate,
    );

    final recommendations = DailyPlanRecommendationService(
      catalogue.cast(),
    ).recommend(
      dogAgeMonths: _dogAgeMonths(dog, localNow),
      behaviourProfile: profile,
      progressRecords: progress,
      now: now,
      targetMinutes: 30,
      maximumLessons: 2,
      recentPlans: recentPlans,
    ).recommendations;

    DailyPlanRecommendation? primary;
    for (final item in recommendations) {
      if (item.kind == 'new-learning') {
        primary = item;
        break;
      }
    }
    primary ??= recommendations.isEmpty ? null : recommendations.first;
    if (primary == null) {
      throw const DailyPlanGenerationException(
        'No eligible lessons are available for a daily plan.',
      );
    }

    final items = <DailyPlanItemRecord>[
      DailyPlanItemRecord(
        lessonId: primary.lessonId,
        skill: primary.skill,
        role: 'primary',
        plannedMinutes: primary.estimatedMinutes.clamp(1, targetMinutes),
        reasonCodes: primary.reasons,
        order: 1,
      ),
    ];

    final remaining = targetMinutes - items.first.plannedMinutes;
    for (final candidate in recommendations) {
      if (candidate.lessonId == primary.lessonId ||
          candidate.kind != 'reinforcement' ||
          candidate.estimatedMinutes > remaining) {
        continue;
      }
      items.add(
        DailyPlanItemRecord(
          lessonId: candidate.lessonId,
          skill: candidate.skill,
          role: 'reinforcement',
          plannedMinutes: candidate.estimatedMinutes,
          reasonCodes: candidate.reasons,
          order: 2,
        ),
      );
      break;
    }

    final timestamp = now.toUtc().toIso8601String();
    final plan = DailyPlanRecord(
      id: 'daily-plan-${dog.id}-$localDate',
      ownerId: owner.id,
      dogId: dog.id,
      localDate: localDate,
      timezone: localNow.timeZoneName.isEmpty ? 'local' : localNow.timeZoneName,
      targetMinutes: targetMinutes,
      estimatedMinutes:
          items.fold<int>(0, (sum, item) => sum + item.plannedMinutes),
      focusSkill: items.first.skill,
      items: List.unmodifiable(items),
      status: 'planned',
      sourceAssessmentId: assessment.id,
      generatedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    );
    await repository.save(plan);
    return plan;
  }

  int _dogAgeMonths(AppDogRecord dog, DateTime localNow) {
    final date = dog.dateOfBirth;
    if (date == null) {
      return ((dog.estimatedAgeYears ?? 0) * 12).round().clamp(0, 360);
    }
    final parts = date.split('-').map(int.parse).toList(growable: false);
    var months =
        (localNow.year - parts[0]) * 12 + localNow.month - parts[1];
    if (localNow.day < parts[2]) months--;
    return months.clamp(0, 360);
  }
}
