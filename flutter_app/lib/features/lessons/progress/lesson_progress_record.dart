import '../domain/lesson_models.dart';

enum LessonProgressStatus { locked, available, inProgress, completed }

class LessonProgressRecord {
  const LessonProgressRecord({
    required this.id,
    required this.ownerId,
    required this.dogId,
    required this.lessonId,
    required this.status,
    required this.attempts,
    required this.successfulCompletions,
    required this.lastAttemptedAt,
    required this.lastCompletedAt,
    required this.bestPerformanceRating,
    required this.currentDifficultyAdjustment,
    required this.unlockedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String ownerId;
  final String dogId;
  final String lessonId;
  final LessonProgressStatus status;
  final int attempts;
  final int successfulCompletions;
  final String? lastAttemptedAt;
  final String? lastCompletedAt;
  final int? bestPerformanceRating;
  final int currentDifficultyAdjustment;
  final String? unlockedAt;
  final String createdAt;
  final String updatedAt;

  LessonProgressSnapshot toSnapshot() {
    return LessonProgressSnapshot(
      lessonId: lessonId,
      attempts: attempts,
      successfulCompletions: successfulCompletions,
      bestPerformanceRating: bestPerformanceRating,
      isInProgress: status == LessonProgressStatus.inProgress,
    );
  }

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'id': id,
      'ownerId': ownerId,
      'dogId': dogId,
      'lessonId': lessonId,
      'status': status.name,
      'attempts': attempts,
      'successfulCompletions': successfulCompletions,
      'lastAttemptedAt': lastAttemptedAt,
      'lastCompletedAt': lastCompletedAt,
      'bestPerformanceRating': bestPerformanceRating,
      'currentDifficultyAdjustment': currentDifficultyAdjustment,
      'unlockedAt': unlockedAt,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  factory LessonProgressRecord.fromJson(Map<String, Object?> json) {
    final record = LessonProgressRecord(
      id: _requiredString(json, 'id'),
      ownerId: _requiredString(json, 'ownerId'),
      dogId: _requiredString(json, 'dogId'),
      lessonId: _requiredString(json, 'lessonId'),
      status: _readStatus(_requiredString(json, 'status')),
      attempts: _requiredInt(json, 'attempts'),
      successfulCompletions: _requiredInt(json, 'successfulCompletions'),
      lastAttemptedAt: _nullableString(json, 'lastAttemptedAt'),
      lastCompletedAt: _nullableString(json, 'lastCompletedAt'),
      bestPerformanceRating: _nullableInt(json, 'bestPerformanceRating'),
      currentDifficultyAdjustment: _requiredInt(
        json,
        'currentDifficultyAdjustment',
      ),
      unlockedAt: _nullableString(json, 'unlockedAt'),
      createdAt: _requiredString(json, 'createdAt'),
      updatedAt: _requiredString(json, 'updatedAt'),
    );

    record.validate();
    return record;
  }

  void validate() {
    if (id.trim().isEmpty ||
        ownerId.trim().isEmpty ||
        dogId.trim().isEmpty ||
        lessonId.trim().isEmpty) {
      throw const LessonProgressDataException(
        'Progress identity fields must not be empty.',
      );
    }

    if (attempts < 0) {
      throw const LessonProgressDataException('Attempts must not be negative.');
    }

    if (successfulCompletions < 0 || successfulCompletions > attempts) {
      throw const LessonProgressDataException(
        'Successful completions are invalid.',
      );
    }

    final rating = bestPerformanceRating;
    if (rating != null && (rating < 1 || rating > 5)) {
      throw const LessonProgressDataException(
        'Performance rating must be between 1 and 5.',
      );
    }

    if (currentDifficultyAdjustment < -2 || currentDifficultyAdjustment > 2) {
      throw const LessonProgressDataException(
        'Difficulty adjustment must be between -2 and 2.',
      );
    }

    _validateTimestamp(createdAt, 'createdAt');
    _validateTimestamp(updatedAt, 'updatedAt');

    if (lastAttemptedAt != null) {
      _validateTimestamp(lastAttemptedAt!, 'lastAttemptedAt');
    }

    if (lastCompletedAt != null) {
      _validateTimestamp(lastCompletedAt!, 'lastCompletedAt');
    }

    if (unlockedAt != null) {
      _validateTimestamp(unlockedAt!, 'unlockedAt');
    }
  }
}

class LessonProgressDataException implements Exception {
  const LessonProgressDataException(this.message);

  final String message;

  @override
  String toString() => 'LessonProgressDataException: $message';
}

LessonProgressStatus _readStatus(String value) {
  for (final status in LessonProgressStatus.values) {
    if (status.name == value) {
      return status;
    }
  }

  throw LessonProgressDataException('Unknown lesson progress status: $value');
}

String _requiredString(Map<String, Object?> json, String key) {
  final value = json[key];

  if (value is! String) {
    throw LessonProgressDataException('$key must be a string.');
  }

  return value;
}

String? _nullableString(Map<String, Object?> json, String key) {
  final value = json[key];

  if (value == null) {
    return null;
  }

  if (value is! String) {
    throw LessonProgressDataException('$key must be a string or null.');
  }

  return value;
}

int _requiredInt(Map<String, Object?> json, String key) {
  final value = json[key];

  if (value is! int) {
    throw LessonProgressDataException('$key must be an integer.');
  }

  return value;
}

int? _nullableInt(Map<String, Object?> json, String key) {
  final value = json[key];

  if (value == null) {
    return null;
  }

  if (value is! int) {
    throw LessonProgressDataException('$key must be an integer or null.');
  }

  return value;
}

void _validateTimestamp(String value, String field) {
  if (DateTime.tryParse(value) == null) {
    throw LessonProgressDataException('$field must be a valid timestamp.');
  }
}
