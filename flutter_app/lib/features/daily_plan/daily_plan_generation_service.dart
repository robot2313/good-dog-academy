import 'dart:math' as math;

import '../adaptive_training/adaptive_lesson_switch.dart';
import '../adaptive_training/adaptive_training_memory.dart';
import '../assessment/assessment_models.dart';
import '../identity/app_identity_record.dart';
import '../lessons/data/production_lessons.dart';
import '../lessons/domain/lesson_models.dart';
import '../lessons/logic/lesson_unlock_service.dart';
import '../lessons/progress/lesson_progress_record.dart';
import '../lessons/session/training_session_record.dart';
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
  final List<LessonDefinition> catalogue;

  Future<DailyPlanRecord> getOrCreate({
    required AppOwnerRecord owner,
    required AppDogRecord dog,
    required BehaviourProfileRecord profile,
    required BehaviourAssessmentRecord assessment,
    required List<LessonProgressRecord> progress,
    required DateTime now,
    List<TrainingSessionRecord> trainingSessions =
        const <TrainingSessionRecord>[],
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

    final adaptive = buildAdaptiveTrainingSnapshot(
      dogId: dog.id,
      sessions: trainingSessions,
    );
    final adaptiveSkills = <String>{
      for (final skill in adaptive.memory.skills.keys)
        if (adaptive.history
                .where((record) => record.skillId == skill)
                .length >=
            2)
          skill,
    };
    final skillByLesson = <String, String>{
      for (final lesson in catalogue) lesson.id: lesson.skill,
    };
    final legacyTrainingSessions = trainingSessions.where((session) {
      final skill = skillByLesson[session.lessonId];
      return skill == null || !adaptiveSkills.contains(skill);
    }).toList(growable: false);

    final recommendations = DailyPlanRecommendationService(
      catalogue,
    ).recommend(
      dogAgeMonths: _dogAgeMonths(dog, localNow),
      behaviourProfile: profile,
      progressRecords: progress,
      now: now,
      targetMinutes: 30,
      maximumLessons: 2,
      recentPlans: recentPlans,
      trainingSessions: legacyTrainingSessions,
    ).recommendations;

    DailyPlanRecommendation? primary;
    for (final item in recommendations) {
      if (item.reasons.contains('RECENT_SESSION_STEP_DOWN')) {
        primary = item;
        break;
      }
    }
    for (final item in recommendations) {
      if (primary == null && item.kind == 'new-learning') {
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

    primary = _applyAdaptiveCameraCoachOverride(
      primary: primary,
      progress: progress,
      adaptive: adaptive,
    );

    final items = <DailyPlanItemRecord>[
      DailyPlanItemRecord(
        lessonId: primary.lessonId,
        skill: primary.skill,
        role: 'primary',
        plannedMinutes: math.min(primary.estimatedMinutes, targetMinutes),
        reasonCodes: primary.reasons,
        order: 1,
      ),
    ];

    final remaining = targetMinutes - items.first.plannedMinutes;
    for (final candidate in recommendations) {
      if (candidate.lessonId == primary.lessonId ||
          candidate.skill == primary.skill ||
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

  DailyPlanRecommendation _applyAdaptiveCameraCoachOverride({
    required DailyPlanRecommendation primary,
    required List<LessonProgressRecord> progress,
    required AdaptiveTrainingSnapshot adaptive,
  }) {
    final recentForSkill = adaptive.history
        .where((record) => record.skillId == primary.skill)
        .toList(growable: false);
    if (recentForSkill.length < 2) return primary;

    final resolved = LessonUnlockService(catalogue).resolve(
      progress.map((record) => record.toSnapshot()),
    );
    final candidates = <AdaptiveLessonCandidate>[];
    for (final lesson in catalogue) {
      final item = resolved[lesson.id];
      if (lesson.skill != primary.skill ||
          !lesson.isActive ||
          item == null ||
          item.state == LessonState.locked) {
        continue;
      }
      candidates.add(
        AdaptiveLessonCandidate(
          lessonId: lesson.id,
          skillId: lesson.skill,
          difficultyLevel: lesson.difficulty,
        ),
      );
    }

    final currentLesson = catalogue
        .where((lesson) => lesson.id == primary.lessonId)
        .firstOrNull;
    if (currentLesson == null) return primary;

    final decision = decideAdaptiveLessonSwitch(
      current: AdaptiveLessonCandidate(
        lessonId: currentLesson.id,
        skillId: currentLesson.skill,
        difficultyLevel: currentLesson.difficulty,
      ),
      candidates: candidates,
      memory: adaptive.memory,
      history: adaptive.history,
    );
    if (decision.action != AdaptiveLessonSwitchAction.switchLesson ||
        decision.lessonId == primary.lessonId) {
      return primary;
    }

    final target = catalogue
        .where((lesson) => lesson.id == decision.lessonId)
        .firstOrNull;
    final targetState = target == null ? null : resolved[target.id]?.state;
    if (target == null ||
        targetState == null ||
        targetState == LessonState.locked) {
      return primary;
    }

    final reasons = <String>[
      'CAMERA_COACH_EVIDENCE',
      _adaptiveReasonCode(decision.reason),
      if (targetState == LessonState.completed)
        'REINFORCEMENT_DUE'
      else if (targetState == LessonState.inProgress)
        'IN_PROGRESS'
      else
        'AVAILABLE_NEW_LEARNING',
    ];

    return DailyPlanRecommendation(
      lessonId: target.id,
      kind: targetState == LessonState.completed
          ? 'reinforcement'
          : 'new-learning',
      skill: target.skill,
      estimatedMinutes: target.estimatedMinutes,
      priorityScore: primary.priorityScore,
      reasons: List.unmodifiable(reasons),
    );
  }

  String _adaptiveReasonCode(LessonSwitchReason reason) {
    return switch (reason) {
      LessonSwitchReason.safetyOverride => 'ADAPTIVE_SAFETY_OVERRIDE',
      LessonSwitchReason.decliningPerformance =>
        'ADAPTIVE_DECLINING_PERFORMANCE',
      LessonSwitchReason.cueRepetition => 'ADAPTIVE_CUE_REPETITION',
      LessonSwitchReason.slowResponse => 'ADAPTIVE_SLOW_RESPONSE',
      LessonSwitchReason.stayCurrent => 'ADAPTIVE_STAY_CURRENT',
      LessonSwitchReason.insufficientEvidence =>
        'ADAPTIVE_INSUFFICIENT_EVIDENCE',
    };
  }

  int _dogAgeMonths(AppDogRecord dog, DateTime localNow) {
    final date = dog.dateOfBirth;
    if (date == null) {
      return math.min(360, math.max(0, ((dog.estimatedAgeYears ?? 0) * 12).round()));
    }
    final parts = date.split('-').map(int.parse).toList(growable: false);
    var months =
        (localNow.year - parts[0]) * 12 + localNow.month - parts[1];
    if (localNow.day < parts[2]) months--;
    return math.min(360, math.max(0, months));
  }
}
