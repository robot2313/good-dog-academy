enum LessonState { available, locked, inProgress, completed }

class LessonPrerequisite {
  const LessonPrerequisite({
    required this.lessonId,
    required this.minimumSuccessfulCompletions,
  });

  final String lessonId;
  final int minimumSuccessfulCompletions;
}

class LessonDefinition {
  const LessonDefinition({
    required this.id,
    required this.title,
    required this.description,
    required this.skill,
    required this.difficulty,
    required this.estimatedMinutes,
    required this.prerequisites,
    required this.tags,
    required this.isActive,
    required this.minimumSuccessfulCompletions,
    required this.minimumPerformanceRating,
  });

  final String id;
  final String title;
  final String description;
  final String skill;
  final int difficulty;
  final int estimatedMinutes;
  final List<LessonPrerequisite> prerequisites;
  final List<String> tags;
  final bool isActive;
  final int minimumSuccessfulCompletions;
  final int? minimumPerformanceRating;
}

class LessonProgressSnapshot {
  const LessonProgressSnapshot({
    required this.lessonId,
    this.attempts = 0,
    this.successfulCompletions = 0,
    this.bestPerformanceRating,
    this.isInProgress = false,
  });

  final String lessonId;
  final int attempts;
  final int successfulCompletions;
  final int? bestPerformanceRating;
  final bool isInProgress;
}

class LessonLibraryItem {
  const LessonLibraryItem({
    required this.definition,
    required this.state,
    this.lockReason,
  });

  final LessonDefinition definition;
  final LessonState state;
  final String? lockReason;
}
