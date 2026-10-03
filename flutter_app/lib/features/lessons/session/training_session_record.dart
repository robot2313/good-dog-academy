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

enum TrainingEvidenceSource {
  ownerConfirmed,
  cameraAuto,
  voiceAuto,
  multimodalAuto,
}

String trainingEvidenceSourceStorageValue(TrainingEvidenceSource source) {
  switch (source) {
    case TrainingEvidenceSource.ownerConfirmed:
      return 'owner_confirmed';
    case TrainingEvidenceSource.cameraAuto:
      return 'camera_auto';
    case TrainingEvidenceSource.voiceAuto:
      return 'voice_auto';
    case TrainingEvidenceSource.multimodalAuto:
      return 'multimodal_auto';
  }
}

TrainingEvidenceSource trainingEvidenceSourceFromStorage(String value) {
  switch (value) {
    case 'owner_confirmed':
      return TrainingEvidenceSource.ownerConfirmed;
    case 'camera_auto':
      return TrainingEvidenceSource.cameraAuto;
    case 'voice_auto':
      return TrainingEvidenceSource.voiceAuto;
    case 'multimodal_auto':
      return TrainingEvidenceSource.multimodalAuto;
  }
  throw TrainingSessionDataException('Unknown evidence source: $value');
}

enum StoredDogPosture { standLike, sitLike, downLike, unknown }

String storedDogPostureValue(StoredDogPosture posture) {
  switch (posture) {
    case StoredDogPosture.standLike:
      return 'stand_like';
    case StoredDogPosture.sitLike:
      return 'sit_like';
    case StoredDogPosture.downLike:
      return 'down_like';
    case StoredDogPosture.unknown:
      return 'unknown';
  }
}

StoredDogPosture storedDogPostureFromValue(String value) {
  switch (value) {
    case 'stand_like':
      return StoredDogPosture.standLike;
    case 'sit_like':
      return StoredDogPosture.sitLike;
    case 'down_like':
      return StoredDogPosture.downLike;
    case 'unknown':
      return StoredDogPosture.unknown;
  }
  throw TrainingSessionDataException('Unknown stored dog posture: $value');
}

class RepEvidenceRecord {
  const RepEvidenceRecord({
    required this.source,
    required this.confidence,
    required this.observedOutcome,
    required this.observedAt,
    required this.cueAt,
    required this.responseAt,
    required this.markerAt,
    required this.rewardAt,
    required this.cueCount,
    required this.signal,
    required this.posture,
    required this.poseConfidence,
    required this.notes,
  });

  final TrainingEvidenceSource source;
  final double? confidence;
  final TrainingOutcome observedOutcome;
  final String observedAt;
  final String? cueAt;
  final String? responseAt;
  final String? markerAt;
  final String? rewardAt;
  final int? cueCount;
  final String? signal;
  final StoredDogPosture? posture;
  final double? poseConfidence;
  final String? notes;

  Map<String, Object?> toJson() => <String, Object?>{
    'source': trainingEvidenceSourceStorageValue(source),
    'confidence': confidence,
    'observedOutcome': trainingOutcomeStorageValue(observedOutcome),
    'observedAt': observedAt,
    'cueAt': cueAt,
    'responseAt': responseAt,
    'markerAt': markerAt,
    'rewardAt': rewardAt,
    'cueCount': cueCount,
    'signal': signal,
    'posture': posture == null ? null : storedDogPostureValue(posture!),
    'poseConfidence': poseConfidence,
    'notes': notes,
  };

  factory RepEvidenceRecord.fromJson(Map<String, Object?> json) {
    final postureValue = json['posture'];
    final record = RepEvidenceRecord(
      source: trainingEvidenceSourceFromStorage(
        _requiredString(json, 'source'),
      ),
      confidence: _nullableDouble(json, 'confidence'),
      observedOutcome: trainingOutcomeFromStorage(
        _requiredString(json, 'observedOutcome'),
      ),
      observedAt: _requiredString(json, 'observedAt'),
      cueAt: _nullableString(json, 'cueAt'),
      responseAt: _nullableString(json, 'responseAt'),
      markerAt: _nullableString(json, 'markerAt'),
      rewardAt: _nullableString(json, 'rewardAt'),
      cueCount: _nullableInt(json, 'cueCount'),
      signal: _nullableString(json, 'signal'),
      posture: postureValue == null
          ? null
          : postureValue is String
          ? storedDogPostureFromValue(postureValue)
          : throw const TrainingSessionDataException(
              'Evidence posture must be a string or null.',
            ),
      poseConfidence: _nullableDouble(json, 'poseConfidence'),
      notes: _nullableString(json, 'notes'),
    );
    record.validate();
    return record;
  }

  void validate() {
    if (DateTime.tryParse(observedAt) == null) {
      throw const TrainingSessionDataException(
        'Evidence observation time is invalid.',
      );
    }
    _validateOptionalTimestamp(cueAt, 'Evidence cue time is invalid.');
    _validateOptionalTimestamp(
      responseAt,
      'Evidence response time is invalid.',
    );
    _validateOptionalTimestamp(markerAt, 'Evidence marker time is invalid.');
    _validateOptionalTimestamp(rewardAt, 'Evidence reward time is invalid.');
    _validateConfidence(confidence, 'Evidence confidence is invalid.');
    _validateConfidence(
      poseConfidence,
      'Evidence pose confidence is invalid.',
    );
    final count = cueCount;
    if (count != null && count < 0) {
      throw const TrainingSessionDataException(
        'Evidence cue count must not be negative.',
      );
    }
  }
}

class EvidenceCorrectionRecord {
  const EvidenceCorrectionRecord({
    required this.correctedAt,
    required this.correctedOutcome,
    required this.reason,
  });

  final String correctedAt;
  final TrainingOutcome correctedOutcome;
  final String? reason;

  Map<String, Object?> toJson() => <String, Object?>{
    'correctedAt': correctedAt,
    'correctedOutcome': trainingOutcomeStorageValue(correctedOutcome),
    'reason': reason,
    'source': 'owner',
  };

  factory EvidenceCorrectionRecord.fromJson(Map<String, Object?> json) {
    if (_requiredString(json, 'source') != 'owner') {
      throw const TrainingSessionDataException(
        'Evidence correction source must be owner.',
      );
    }
    final record = EvidenceCorrectionRecord(
      correctedAt: _requiredString(json, 'correctedAt'),
      correctedOutcome: trainingOutcomeFromStorage(
        _requiredString(json, 'correctedOutcome'),
      ),
      reason: _nullableString(json, 'reason'),
    );
    record.validate();
    return record;
  }

  void validate() {
    if (DateTime.tryParse(correctedAt) == null) {
      throw const TrainingSessionDataException(
        'Evidence correction time is invalid.',
      );
    }
  }
}

class TrainingRepRecord {
  const TrainingRepRecord({
    required this.id,
    required this.repNumber,
    required this.evidence,
    required this.correction,
  });

  final String id;
  final int repNumber;
  final RepEvidenceRecord evidence;
  final EvidenceCorrectionRecord? correction;

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'repNumber': repNumber,
    'evidence': evidence.toJson(),
    'correction': correction?.toJson(),
  };

  factory TrainingRepRecord.fromJson(Map<String, Object?> json) {
    final evidenceValue = json['evidence'];
    final correctionValue = json['correction'];
    if (evidenceValue is! Map) {
      throw const TrainingSessionDataException(
        'Training rep evidence must be an object.',
      );
    }
    if (correctionValue != null && correctionValue is! Map) {
      throw const TrainingSessionDataException(
        'Training rep correction must be an object or null.',
      );
    }

    final record = TrainingRepRecord(
      id: _requiredString(json, 'id'),
      repNumber: _requiredInt(json, 'repNumber'),
      evidence: RepEvidenceRecord.fromJson(
        evidenceValue.cast<String, Object?>(),
      ),
      correction: correctionValue == null
          ? null
          : EvidenceCorrectionRecord.fromJson(
              correctionValue.cast<String, Object?>(),
            ),
    );
    record.validate();
    return record;
  }

  void validate() {
    if (id.trim().isEmpty || repNumber < 1) {
      throw const TrainingSessionDataException(
        'Training rep identity is invalid.',
      );
    }
    evidence.validate();
    correction?.validate();
  }
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
    this.reps = const <TrainingRepRecord>[],
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
  final List<TrainingRepRecord> reps;

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
    'reps': reps.map((rep) => rep.toJson()).toList(growable: false),
  };

  factory TrainingSessionRecord.fromJson(Map<String, Object?> json) {
    final outcomeValue = json['outcome'];
    final repsValue = json['reps'];
    final reps = <TrainingRepRecord>[];
    if (repsValue != null) {
      if (repsValue is! List) {
        throw const TrainingSessionDataException(
          'Training session reps must be a list.',
        );
      }
      for (final item in repsValue) {
        if (item is! Map) {
          throw const TrainingSessionDataException(
            'Training session rep must be an object.',
          );
        }
        reps.add(
          TrainingRepRecord.fromJson(item.cast<String, Object?>()),
        );
      }
    }

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
      reps: List.unmodifiable(reps),
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
    if (reps.isNotEmpty && completed == null) {
      throw const TrainingSessionDataException(
        'Persisted rep evidence requires a completed session.',
      );
    }

    final repIds = <String>{};
    final repNumbers = <int>{};
    for (final rep in reps) {
      rep.validate();
      if (!repIds.add(rep.id) || !repNumbers.add(rep.repNumber)) {
        throw const TrainingSessionDataException(
          'Training session reps must have unique ids and numbers.',
        );
      }
    }
  }
}

class TrainingSessionDataException implements Exception {
  const TrainingSessionDataException(this.message);

  final String message;

  @override
  String toString() => 'TrainingSessionDataException: $message';
}

void _validateOptionalTimestamp(String? value, String message) {
  if (value != null && DateTime.tryParse(value) == null) {
    throw TrainingSessionDataException(message);
  }
}

void _validateConfidence(double? value, String message) {
  if (value != null && (!value.isFinite || value < 0 || value > 1)) {
    throw TrainingSessionDataException(message);
  }
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

int? _nullableInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) return null;
  if (value is! int) {
    throw TrainingSessionDataException('$key must be an integer or null.');
  }
  return value;
}

double? _nullableDouble(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) return null;
  if (value is! num) {
    throw TrainingSessionDataException('$key must be numeric or null.');
  }
  return value.toDouble();
}
