import '../domain/lesson_models.dart';

class LessonUnlockService {
  const LessonUnlockService(this.lessons);

  final List<LessonDefinition> lessons;

  Map<String, LessonLibraryItem> resolve(
    Iterable<LessonProgressSnapshot> progressRecords,
  ) {
    final definitionsById = <String, LessonDefinition>{
      for (final lesson in lessons) lesson.id: lesson,
    };

    final progressByLesson = <String, LessonProgressSnapshot>{};

    for (final progress in progressRecords) {
      if (!definitionsById.containsKey(progress.lessonId)) {
        throw StateError(
          'Progress references missing lesson ${progress.lessonId}.',
        );
      }

      if (progressByLesson.containsKey(progress.lessonId)) {
        throw StateError(
          'Duplicate progress for lesson ${progress.lessonId}.',
        );
      }

      progressByLesson[progress.lessonId] = progress;
    }

    final resolved = <String, LessonLibraryItem>{};

    for (final definition in lessons) {
      resolved[definition.id] = _resolveLesson(
        definition,
        definitionsById,
        progressByLesson,
      );
    }

    return Map.unmodifiable(resolved);
  }

  LessonLibraryItem _resolveLesson(
    LessonDefinition definition,
    Map<String, LessonDefinition> definitionsById,
    Map<String, LessonProgressSnapshot> progressByLesson,
  ) {
    if (!definition.isActive) {
      return LessonLibraryItem(
        definition: definition,
        state: LessonState.locked,
        lockReason: 'This lesson is not currently available.',
      );
    }

    final current = progressByLesson[definition.id];

    if (current != null && _meetsCompletionCriteria(definition, current)) {
      return LessonLibraryItem(
        definition: definition,
        state: LessonState.completed,
      );
    }

    final missingPrerequisites = definition.prerequisites.where(
      (prerequisite) {
        final progress = progressByLesson[prerequisite.lessonId];

        return progress == null ||
            progress.successfulCompletions <
                prerequisite.minimumSuccessfulCompletions;
      },
    ).toList(growable: false);

    if (missingPrerequisites.isNotEmpty) {
      final names = missingPrerequisites
          .map(
            (prerequisite) =>
                definitionsById[prerequisite.lessonId]?.title ??
                prerequisite.lessonId,
          )
          .toList(growable: false);

      return LessonLibraryItem(
        definition: definition,
        state: LessonState.locked,
        lockReason: 'Complete ${_formatNames(names)} first.',
      );
    }

    if (current != null &&
        (current.attempts > 0 || current.isInProgress)) {
      return LessonLibraryItem(
        definition: definition,
        state: LessonState.inProgress,
      );
    }

    return LessonLibraryItem(
      definition: definition,
      state: LessonState.available,
    );
  }

  bool _meetsCompletionCriteria(
    LessonDefinition definition,
    LessonProgressSnapshot progress,
  ) {
    if (progress.successfulCompletions <
        definition.minimumSuccessfulCompletions) {
      return false;
    }

    final minimumRating = definition.minimumPerformanceRating;

    if (minimumRating == null) {
      return true;
    }

    return (progress.bestPerformanceRating ?? 0) >= minimumRating;
  }

  String _formatNames(List<String> names) {
    if (names.isEmpty) {
      return 'the prerequisite lesson';
    }

    if (names.length == 1) {
      return names.first;
    }

    if (names.length == 2) {
      return '${names[0]} and ${names[1]}';
    }

    return '${names.sublist(0, names.length - 1).join(', ')}, '
        'and ${names.last}';
  }
}
