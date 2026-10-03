import '../assessment/assessment_models.dart';
import '../lessons/domain/lesson_models.dart';
import '../lessons/logic/lesson_unlock_service.dart';
import '../lessons/progress/lesson_progress_record.dart';
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
          priority += (practiceGap * 3).clamp(0, 15);
        }
      } else {
        kind = 'reinforcement';
        reasons.add('REINFORCEMENT_DUE');
        priority += _daysSince(
          progress?.lastCompletedAt,
          now,
        ).clamp(0, 20);
      }

      priority -= (lesson.difficulty - 1) * 2;

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

  int _daysSince(String? timestamp, DateTime now) {
    if (timestamp == null) return 20;
    final parsed = DateTime.tryParse(timestamp);
    if (parsed == null) return 20;
    final days = now.toUtc().difference(parsed.toUtc()).inDays;
    return days < 0 ? 0 : days;
  }
}
