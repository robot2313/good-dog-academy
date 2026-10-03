import '../lessons/session/training_session_record.dart';
import 'adaptive_training_memory.dart';

enum LessonSwitchReason {
  stayCurrent,
  safetyOverride,
  decliningPerformance,
  cueRepetition,
  slowResponse,
  insufficientEvidence,
}

enum AdaptiveLessonSwitchAction { stay, switchLesson }

class AdaptiveLessonCandidate {
  const AdaptiveLessonCandidate({
    required this.lessonId,
    required this.skillId,
    required this.difficultyLevel,
  });

  final String lessonId;
  final String skillId;
  final int difficultyLevel;
}

class AdaptiveLessonSwitchDecision {
  const AdaptiveLessonSwitchDecision({
    required this.action,
    required this.lessonId,
    required this.reason,
    required this.explanation,
  });

  final AdaptiveLessonSwitchAction action;
  final String lessonId;
  final LessonSwitchReason reason;
  final String explanation;
}

AdaptiveLessonSwitchDecision decideAdaptiveLessonSwitch({
  required AdaptiveLessonCandidate current,
  required List<AdaptiveLessonCandidate> candidates,
  required AdaptiveTrainingMemory memory,
  required List<AdaptiveSessionHistoryRecord> history,
}) {
  final recent = history
      .where((record) => record.skillId == current.skillId)
      .toList(growable: false)
    ..sort((a, b) => b.completedAt.compareTo(a.completedAt));
  final recentThree = recent.take(3).toList(growable: false);
  final skill = memory.skills[current.skillId];

  final fallbackCandidates = candidates
      .where(
        (candidate) =>
            candidate.skillId == current.skillId &&
            candidate.lessonId != current.lessonId &&
            candidate.difficultyLevel <= current.difficultyLevel,
      )
      .toList(growable: false)
    ..sort((a, b) => a.difficultyLevel.compareTo(b.difficultyLevel));
  final fallback = fallbackCandidates.isEmpty
      ? null
      : fallbackCandidates.first;

  if (skill == null || recentThree.length < 2) {
    return AdaptiveLessonSwitchDecision(
      action: AdaptiveLessonSwitchAction.stay,
      lessonId: current.lessonId,
      reason: LessonSwitchReason.insufficientEvidence,
      explanation:
          'There is not enough recent evidence to change lessons safely.',
    );
  }

  final recentStress = recentThree.any(
    (record) =>
        record.endReason == CameraCoachEndReason.stress ||
        record.stressSignalRate >= 0.2,
  );
  if (recentStress && fallback != null) {
    return AdaptiveLessonSwitchDecision(
      action: AdaptiveLessonSwitchAction.switchLesson,
      lessonId: fallback.lessonId,
      reason: LessonSwitchReason.safetyOverride,
      explanation:
          'Recent stress or discomfort-tagged evidence overrides progression, so the plan switches to an easier lesson for the same skill.',
    );
  }

  final recentClean = recentThree
          .map((record) => record.cleanRepRate)
          .reduce((a, b) => a + b) /
      recentThree.length;
  if (recentClean < 0.55 && fallback != null) {
    return AdaptiveLessonSwitchDecision(
      action: AdaptiveLessonSwitchAction.switchLesson,
      lessonId: fallback.lessonId,
      reason: LessonSwitchReason.decliningPerformance,
      explanation:
          'Recent clean-rep performance is below the reliability threshold, so the plan returns to an easier lesson.',
    );
  }

  if (skill.repeatedCueRate >= 0.4 && fallback != null) {
    return AdaptiveLessonSwitchDecision(
      action: AdaptiveLessonSwitchAction.switchLesson,
      lessonId: fallback.lessonId,
      reason: LessonSwitchReason.cueRepetition,
      explanation:
          'Repeated cues are common enough that a simpler lesson is preferred before adding challenge.',
    );
  }

  if (skill.slowResponseRate >= 0.4 && fallback != null) {
    return AdaptiveLessonSwitchDecision(
      action: AdaptiveLessonSwitchAction.switchLesson,
      lessonId: fallback.lessonId,
      reason: LessonSwitchReason.slowResponse,
      explanation:
          'Responses are frequently slow, so the plan switches to a lower-demand lesson to rebuild fluency.',
    );
  }

  return AdaptiveLessonSwitchDecision(
    action: AdaptiveLessonSwitchAction.stay,
    lessonId: current.lessonId,
    reason: LessonSwitchReason.stayCurrent,
    explanation: 'Current evidence does not justify changing lessons.',
  );
}
