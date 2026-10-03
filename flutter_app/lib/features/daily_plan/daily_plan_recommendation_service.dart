import 'dart:math' as math;

import '../assessment/assessment_models.dart';
import '../lessons/domain/lesson_models.dart';
import '../lessons/logic/lesson_unlock_service.dart';
import '../lessons/progress/lesson_progress_record.dart';
import '../lessons/session/training_session_record.dart';
import 'daily_plan_models.dart';

class DailyPlanRecommendation {
  const DailyPlanRecommendation({
    required this.lessonId,
    required this.kind,
    required this.skill,
    required this.estimatedMinutes,
    required this.priorityScore,
    required this.reasons,
  });

  final String lessonId;
  final String kind;
  final String skill;
  final int estimatedMinutes;
  final int priorityScore;
  final List<String> reasons;
}

class DailyPlanRecommendationResult {
  const DailyPlanRecommendationResult({
    required this.recommendations,
    required this.totalEstimatedMinutes,
    required this.targetMinutes,
  });

  final List<DailyPlanRecommendation> recommendations;
  final int totalEstimatedMinutes;
  final int targetMinutes;
}

class DailyPlanRecommendationService {
  const DailyPlanRecommendationService(this.catalogue);

  final List<LessonDefinition> catalogue;

  DailyPlanRecommendationResult recommend({
    required int dogAgeMonths,
    required BehaviourProfileRecord behaviourProfile,
    required List<LessonProgressRecord> progressRecords,
    required DateTime now,
    int targetMinutes = 15,
    int maximumLessons = 2,
    List<DailyPlanRecord> recentPlans = const <DailyPlanRecord>[],
    List<TrainingSessionRecord> trainingSessions =
        const <TrainingSessionRecord>[],
  }) {
    if (!const <int>{5, 10, 15, 20, 30}.contains(targetMinutes)) {
      throw RangeError('targetMinutes must be one of 5, 10, 15, 20, or 30');
    }
    if (maximumLessons < 1 || maximumLessons > 2) {
      throw RangeError('maximumLessons must be one or two');
    }
    if (dogAgeMonths < 0) {
      throw RangeError('dogAgeMonths must be non-negative');
    }
    behaviourProfile.validate();

    final progressByLesson = <String, LessonProgressRecord>{
      for (final progress in progressRecords) progress.lessonId: progress,
    };
    final lessonById = <String, LessonDefinition>{
      for (final lesson in catalogue) lesson.id: lesson,
    };
    final resolved = LessonUnlockService(catalogue).resolve(
      progressRecords.map((progress) => progress.toSnapshot()),
    );
    final ranked = <DailyPlanRecommendation>[];

    for (final lesson in catalogue) {
      final libraryItem = resolved[lesson.id];
      if (libraryItem == null ||
          libraryItem.state == LessonState.locked ||
          !lesson.isActive) {
        continue;
      }

      final progress = progressByLesson[lesson.id];
      final isUnknown =
          behaviourProfile.unknownSkills.contains(lesson.skill);
      final skillScore = isUnknown
          ? 50
          : behaviourProfile.skillScores[lesson.skill] ?? 50;
      var priority = 100 - skillScore;
      final reasons = <String>[];

      if (skillScore <= 50) reasons.add('LOW_SKILL_SCORE');
      if (isUnknown) {
        reasons.add('UNKNOWN_SKILL');
        priority += 8;
      }

      late String kind;
      if (libraryItem.state != LessonState.completed) {
        kind = 'new-learning';
        if (libraryItem.state == LessonState.inProgress) {
          reasons.add('IN_PROGRESS');
          priority += 25;
        } else {
          reasons.add('AVAILABLE_NEW_LEARNING');
          priority += 15;
        }
        final practiceGap =
            (progress?.attempts ?? 0) -
            (progress?.successfulCompletions ?? 0);
        if (practiceGap > 0) {
          reasons.add('NEEDS_PRACTICE');
          priority += math.min(15, math.max(0, practiceGap * 3));
        }
      } else {
        kind = 'reinforcement';
        reasons.add('REINFORCEMENT_DUE');
        priority += math.min(
          20,
          math.max(0, _daysSince(progress?.lastCompletedAt, now)),
        );
      }

      priority -= (lesson.difficulty - 1) * 2;

      final supportDifficulty = _recentSupportDifficulty(
        skill: lesson.skill,
        dogId: behaviourProfile.dogId,
        trainingSessions: trainingSessions,
        lessonById: lessonById,
        now: now,
      );
      if (supportDifficulty != null) {
        if (lesson.difficulty < supportDifficulty) {
          reasons.add('RECENT_SESSION_STEP_DOWN');
          priority += 70;
        } else if (lesson.difficulty == supportDifficulty) {
          reasons.add('RECENT_SESSION_NEEDS_SUPPORT');
          priority += 10;
        } else {
          reasons.add('RECENT_SESSION_HOLD_CHALLENGE');
          priority -= 30;
        }
      }

      var recentOccurrences = 0;
      for (final plan in recentPlans) {
        for (final item in plan.items) {
          if (item.lessonId == lesson.id) recentOccurrences++;
        }
      }
      if (recentOccurrences > 0) {
        reasons.add('RECENTLY_PLANNED_PENALTY');
        priority -= recentOccurrences * 30;
      }

      ranked.add(
        DailyPlanRecommendation(
          lessonId: lesson.id,
          kind: kind,
          skill: lesson.skill,
          estimatedMinutes: lesson.estimatedMinutes,
          priorityScore: priority,
          reasons: List.unmodifiable(reasons),
        ),
      );
    }

    ranked.sort((left, right) {
      final priority = right.priorityScore.compareTo(left.priorityScore);
      if (priority != 0) return priority;
      final duration = left.estimatedMinutes.compareTo(right.estimatedMinutes);
      if (duration != 0) return duration;
      return left.lessonId.compareTo(right.lessonId);
    });

    final selected = <DailyPlanRecommendation>[];
    final selectedSkills = <String>{};
    var totalMinutes = 0;

    for (final candidate in ranked) {
      if (selected.length >= maximumLessons) break;
      if (selectedSkills.contains(candidate.skill)) continue;
      final wouldExceed =
          totalMinutes + candidate.estimatedMinutes > targetMinutes;
      if (wouldExceed && selected.isNotEmpty) continue;
      selected.add(candidate);
      selectedSkills.add(candidate.skill);
      totalMinutes += candidate.estimatedMinutes;
    }

    return DailyPlanRecommendationResult(
      recommendations: List.unmodifiable(selected),
      totalEstimatedMinutes: totalMinutes,
      targetMinutes: targetMinutes,
    );
  }

  int? _recentSupportDifficulty({
    required String skill,
    required String dogId,
    required List<TrainingSessionRecord> trainingSessions,
    required Map<String, LessonDefinition> lessonById,
    required DateTime now,
  }) {
    final cutoff = now.toUtc().subtract(const Duration(days: 14));
    final recent = trainingSessions.where((session) {
      if (session.dogId != dogId ||
          session.completedAt == null ||
          session.outcome == null) {
        return false;
      }
      final lesson = lessonById[session.lessonId];
      if (lesson == null || lesson.skill != skill) return false;
      final completed = DateTime.tryParse(session.completedAt!);
      if (completed == null) return false;
      final utc = completed.toUtc();
      return !utc.isBefore(cutoff) && !utc.isAfter(now.toUtc());
    }).toList(growable: false)
      ..sort((left, right) {
        return right.completedAt!.compareTo(left.completedAt!);
      });

    if (recent.length < 2) return null;
    final latest = recent.take(2).toList(growable: false);
    if (latest.any((session) => session.outcome == TrainingOutcome.success)) {
      return null;
    }

    var difficulty = 1;
    for (final session in latest) {
      final lesson = lessonById[session.lessonId];
      if (lesson != null) {
        difficulty = math.max(difficulty, lesson.difficulty);
      }
    }
    return difficulty;
  }

  int _daysSince(String? timestamp, DateTime now) {
    if (timestamp == null) return 20;
    final parsed = DateTime.tryParse(timestamp);
    if (parsed == null) return 20;
    final days = now.toUtc().difference(parsed.toUtc()).inDays;
    return days < 0 ? 0 : days;
  }
}
