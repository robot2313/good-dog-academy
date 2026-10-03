enum TrainingOutcome { success, partialSuccess, unsuccessful }

String trainingOutcomeStorageValue(TrainingOutcome outcome) {
  switch (outcome) {
    case TrainingOutcome.success:
      return 'success';
    case TrainingOutcome.partialSuccess:
      return 'partial-success';
    case TrainingOutcome.unsuccessful:
      return 'unsuccessful';
  }
}

TrainingOutcome trainingOutcomeFromStorage(String value) {
  switch (value) {
    case 'success':
      return TrainingOutcome.success;
    case 'partial-success':
      return TrainingOutcome.partialSuccess;
    case 'unsuccessful':
      return TrainingOutcome.unsuccessful;
  }
  throw TrainingSessionDataException('Unknown training outcome: $value');
}

class TrainingSessionRecord {
  const TrainingSessionRecord({
    required this.id,
    required this.dogId,
    required this.lessonId,
    required this.dailyPlanId,
    required this.startedAt,
    required this.completedAt,
    required this.durationMinutes,
    required this.outcome,
    required this.notes,
  });

  final String id;
  final String dogId;
  final String lessonId;
  final String? dailyPlanId;
  final String startedAt;
  final String? completedAt;
  final int durationMinutes;
  final TrainingOutcome? outcome;
  final String notes;

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'dogId': dogId,
    'lessonId': lessonId,
    'dailyPlanId': dailyPlanId,
    'startedAt': startedAt,
    'completedAt': completedAt,
    'durationMinutes': durationMinutes,
    'outcome': outcome == null ? null : trainingOutcomeStorageValue(outcome!),
    'notes': notes,
  };

  factory TrainingSessionRecord.fromJson(Map<String, Object?> json) {
    final outcomeValue = json['outcome'];
    final record = TrainingSessionRecord(
      id: _requiredString(json, 'id'),
      dogId: _requiredString(json, 'dogId'),
      lessonId: _requiredString(json, 'lessonId'),
      dailyPlanId: _nullableString(json, 'dailyPlanId'),
      startedAt: _requiredString(json, 'startedAt'),
      completedAt: _nullableString(json, 'completedAt'),
      durationMinutes: _requiredInt(json, 'durationMinutes'),
      outcome: outcomeValue == null
          ? null
          : outcomeValue is String
          ? trainingOutcomeFromStorage(outcomeValue)
          : throw const TrainingSessionDataException(
              'Training outcome must be a string or null.',
            ),
      notes: _requiredString(json, 'notes'),
    );
    record.validate();
    return record;
  }

  void validate() {
    if (id.trim().isEmpty || dogId.trim().isEmpty || lessonId.trim().isEmpty) {
      throw const TrainingSessionDataException(
        'Training session identity fields must not be empty.',
      );
    }
    final planId = dailyPlanId;
    if (planId != null && planId.trim().isEmpty) {
      throw const TrainingSessionDataException(
        'Daily plan id must be non-empty or null.',
      );
    }
    final start = DateTime.tryParse(startedAt);
    if (start == null) {
      throw const TrainingSessionDataException(
        'Training session start time is invalid.',
      );
    }
    final completed = completedAt;
    if (completed != null) {
      final end = DateTime.tryParse(completed);
      if (end == null || end.isBefore(start)) {
        throw const TrainingSessionDataException(
          'Training session completion time is invalid.',
        );
      }
      if (outcome == null) {
        throw const TrainingSessionDataException(
          'Completed training session requires an outcome.',
        );
      }
    } else if (outcome != null) {
      throw const TrainingSessionDataException(
        'Incomplete training session cannot have an outcome.',
      );
    }
    if (durationMinutes < 0) {
      throw const TrainingSessionDataException(
        'Training duration must not be negative.',
      );
    }
  }
}

class TrainingSessionDataException implements Exception {
  const TrainingSessionDataException(this.message);

  final String message;

  @override
  String toString() => 'TrainingSessionDataException: $message';
}

String _requiredString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! String) {
    throw TrainingSessionDataException('$key must be a string.');
  }
  return value;
}

String? _nullableString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) return null;
  if (value is! String) {
    throw TrainingSessionDataException('$key must be a string or null.');
  }
  return value;
}

int _requiredInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int) {
    throw TrainingSessionDataException('$key must be an integer.');
  }
  return value;
}
