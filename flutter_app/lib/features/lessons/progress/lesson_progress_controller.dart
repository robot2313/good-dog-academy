import 'package:flutter/widgets.dart';

import '../domain/lesson_models.dart';
import '../data/production_lessons.dart';
import '../logic/lesson_unlock_service.dart';
import 'lesson_progress_record.dart';
import 'lesson_progress_repository.dart';
import '../session/training_session_record.dart';

class LessonProgressController extends ChangeNotifier {
  LessonProgressController({required this.repository});

  final LessonProgressRepository repository;

  bool _loading = true;
  Object? _error;
  String? _ownerId;
  String? _dogId;
  List<LessonProgressRecord> _records = const <LessonProgressRecord>[];
  List<TrainingSessionRecord> _sessions = const <TrainingSessionRecord>[];

  bool get loading => _loading;

  Object? get error => _error;

  String? get ownerId => _ownerId;

  String? get dogId => _dogId;

  List<LessonProgressRecord> get records => _records;

  List<TrainingSessionRecord> get sessions => _sessions;

  List<LessonProgressSnapshot> get snapshots {
    return _records
        .map((record) => record.toSnapshot())
        .toList(growable: false);
  }

  int _generation = 0;
  bool _disposed = false;

  void clear() {
    _generation++;
    _ownerId = null;
    _dogId = null;
    _records = const [];
    _sessions = const [];
    _error = null;
    _loading = false;
    if (!_disposed) notifyListeners();
  }

  Future<void> loadForDog({
    required String ownerId,
    required String dogId,
  }) async {
    final generation = ++_generation;
    _ownerId = ownerId;
    _dogId = dogId;
    _records = const [];
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      if (ownerId.trim().isEmpty || dogId.trim().isEmpty) {
        throw const LessonProgressSelectionException(
          'Explicit owner and dog are required.',
        );
      }
      final data = await repository.loadTrainingDataForDog(
        ownerId: ownerId,
        dogId: dogId,
      );
      if (_disposed || generation != _generation) return;
      // Reject catalogue inconsistencies here, so screens show a recoverable
      // error instead of throwing while resolving unlock states during build.
      const LessonUnlockService(productionLessons)
          .resolve(data.records.map((r) => r.toSnapshot()));
      _records = List.unmodifiable(data.records);
      _sessions = List.unmodifiable(data.sessions);
    } catch (cause) {
      if (_disposed || generation != _generation) return;
      _error = cause;
    } finally {
      if (!_disposed && generation == _generation) {
        _loading = false;
        notifyListeners();
      }
    }
  }

  Future<void> recordLessonAttempt({
    required String ownerId,
    required String dogId,
    required String lessonId,
    required int rating,
    required String attemptedAt,
    String? startedAt,
    String? sessionId,
    String notes = '',
    bool allowPrerequisiteBypass = false,
  }) async {
    if (ownerId != _ownerId || dogId != _dogId) {
      throw const LessonProgressSelectionException(
        'The selected dog changed before this session could be saved.',
      );
    }
    if (rating < 1 || rating > 5) {
      throw const LessonProgressSelectionException(
        'Performance rating must be between 1 and 5.',
      );
    }
    if (DateTime.tryParse(attemptedAt) == null) {
      throw const LessonProgressSelectionException(
        'Attempt time must be a valid timestamp.',
      );
    }

    LessonDefinition? lesson;
    for (final candidate in productionLessons) {
      if (candidate.id == lessonId) {
        lesson = candidate;
        break;
      }
    }
    if (lesson == null || !lesson.isActive) {
      throw const LessonProgressSelectionException(
        'This lesson is not currently available.',
      );
    }

    final resolved = const LessonUnlockService(productionLessons)
        .resolve(snapshots);
    final item = resolved[lessonId];
    if (item == null) {
      throw const LessonProgressSelectionException(
        'This lesson could not be resolved.',
      );
    }
    if (item.state == LessonState.locked && !allowPrerequisiteBypass) {
      throw LessonProgressSelectionException(
        item.lockReason ?? 'This lesson is still locked.',
      );
    }

    LessonProgressRecord? existing;
    for (final record in _records) {
      if (record.lessonId == lessonId) {
        existing = record;
        break;
      }
    }

    final successful = rating >= 3;
    final attempts = (existing?.attempts ?? 0) + 1;
    final successfulCompletions =
        (existing?.successfulCompletions ?? 0) + (successful ? 1 : 0);
    final previousBest = existing?.bestPerformanceRating;
    final bestRating =
        previousBest == null || rating > previousBest ? rating : previousBest;
    final minimumRating = lesson.minimumPerformanceRating;
    final completed =
        successfulCompletions >= lesson.minimumSuccessfulCompletions &&
        (minimumRating == null || bestRating >= minimumRating);

    final record = LessonProgressRecord(
      id: existing?.id ?? 'progress-$dogId-$lessonId',
      ownerId: ownerId,
      dogId: dogId,
      lessonId: lessonId,
      status: completed
          ? LessonProgressStatus.completed
          : LessonProgressStatus.inProgress,
      attempts: attempts,
      successfulCompletions: successfulCompletions,
      lastAttemptedAt: attemptedAt,
      lastCompletedAt: successful
          ? attemptedAt
          : existing?.lastCompletedAt,
      bestPerformanceRating: bestRating,
      currentDifficultyAdjustment:
          existing?.currentDifficultyAdjustment ?? 0,
      unlockedAt: existing?.unlockedAt ?? attemptedAt,
      createdAt: existing?.createdAt ?? attemptedAt,
      updatedAt: attemptedAt,
    );

    final completed = DateTime.parse(attemptedAt).toUtc();
    final started = DateTime.tryParse(startedAt ?? attemptedAt)?.toUtc();
    if (started == null || started.isAfter(completed)) {
      throw const LessonProgressSelectionException(
        'Training session start time is invalid.',
      );
    }
    final resolvedSessionId =
        sessionId ??
        'training-session-$dogId-$lessonId-${started.microsecondsSinceEpoch}';
    final elapsedMilliseconds = completed.difference(started).inMilliseconds;
    final session = TrainingSessionRecord(
      id: resolvedSessionId,
      dogId: dogId,
      lessonId: lessonId,
      dailyPlanId: null,
      startedAt: started.toIso8601String(),
      completedAt: completed.toIso8601String(),
      durationMinutes: (elapsedMilliseconds / 60000).round().clamp(0, 1440),
      outcome: rating >= 4
          ? TrainingOutcome.success
          : rating == 3
          ? TrainingOutcome.partialSuccess
          : TrainingOutcome.unsuccessful,
      notes: notes,
    );

    await repository.saveCompletedSessionWithProgress(
      ownerId: ownerId,
      progress: record,
      session: session,
    );
    await loadForDog(ownerId: ownerId, dogId: dogId);
    if (_error != null) {
      throw LessonProgressSelectionException(
        'The lesson was saved but progress could not be refreshed: $_error',
      );
    }
  }

  Future<void> reload() async {
    final owner = _ownerId;
    final dog = _dogId;
    if (owner == null || dog == null) {
      clear();
      return;
    }
    await loadForDog(ownerId: owner, dogId: dog);
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    super.dispose();
  }
}

class LessonProgressSelectionException implements Exception {
  const LessonProgressSelectionException(this.message);

  final String message;

  @override
  String toString() => 'LessonProgressSelectionException: $message';
}

class LessonProgressScope extends InheritedNotifier<LessonProgressController> {
  const LessonProgressScope({
    super.key,
    required LessonProgressController controller,
    required super.child,
  }) : super(notifier: controller);

  static LessonProgressController? maybeOf(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<LessonProgressScope>()
        ?.notifier;
  }

  static LessonProgressController of(BuildContext context) {
    final controller = maybeOf(context);

    if (controller == null) {
      throw StateError('LessonProgressScope is missing above this context.');
    }

    return controller;
  }
}
