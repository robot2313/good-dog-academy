const behaviourSkills = <String>[
  'recall',
  'loose-lead-walking',
  'jumping',
  'barking',
  'chewing',
  'reactivity',
  'house-training',
  'confidence',
  'impulse-control',
  'focus',
];

enum AssessmentOption {
  never,
  rarely,
  sometimes,
  often,
  almostAlways,
  notSure,
}

enum ScoringDirection { positive, negative }

String assessmentOptionStorageValue(AssessmentOption option) {
  switch (option) {
    case AssessmentOption.almostAlways:
      return 'almost-always';
    case AssessmentOption.notSure:
      return 'not-sure';
    default:
      return option.name;
  }
}

AssessmentOption assessmentOptionFromStorage(String value) {
  switch (value) {
    case 'never':
      return AssessmentOption.never;
    case 'rarely':
      return AssessmentOption.rarely;
    case 'sometimes':
      return AssessmentOption.sometimes;
    case 'often':
      return AssessmentOption.often;
    case 'almost-always':
      return AssessmentOption.almostAlways;
    case 'not-sure':
      return AssessmentOption.notSure;
  }
  throw AssessmentDataException('Unknown assessment option: $value');
}

int? assessmentFrequencyValue(AssessmentOption option) {
  switch (option) {
    case AssessmentOption.never:
      return 0;
    case AssessmentOption.rarely:
      return 1;
    case AssessmentOption.sometimes:
      return 2;
    case AssessmentOption.often:
      return 3;
    case AssessmentOption.almostAlways:
      return 4;
    case AssessmentOption.notSure:
      return null;
  }
}

class AssessmentResponseRecord {
  const AssessmentResponseRecord({
    required this.questionId,
    required this.skill,
    required this.selectedOption,
    required this.frequencyValue,
    required this.scoringDirection,
  });

  final String questionId;
  final String skill;
  final AssessmentOption selectedOption;
  final int? frequencyValue;
  final ScoringDirection scoringDirection;

  Map<String, Object?> toJson() => <String, Object?>{
    'questionId': questionId,
    'skill': skill,
    'selectedOption': assessmentOptionStorageValue(selectedOption),
    'frequencyValue': frequencyValue,
    'scoringDirection': scoringDirection.name,
  };

  factory AssessmentResponseRecord.fromJson(Map<String, Object?> json) {
    final selected = assessmentOptionFromStorage(_requiredString(json, 'selectedOption'));
    final record = AssessmentResponseRecord(
      questionId: _requiredString(json, 'questionId'),
      skill: _requiredString(json, 'skill'),
      selectedOption: selected,
      frequencyValue: _nullableInt(json, 'frequencyValue'),
      scoringDirection: _directionFromStorage(_requiredString(json, 'scoringDirection')),
    );
    record.validate();
    return record;
  }

  void validate() {
    if (questionId.trim().isEmpty || !behaviourSkills.contains(skill)) {
      throw const AssessmentDataException('Assessment response identity is invalid.');
    }
    if (frequencyValue != assessmentFrequencyValue(selectedOption)) {
      throw const AssessmentDataException('Assessment frequency does not match the selected option.');
    }
  }
}

class BehaviourAssessmentRecord {
  const BehaviourAssessmentRecord({
    required this.id,
    required this.ownerId,
    required this.dogId,
    required this.responses,
    required this.calculatedScores,
    required this.unknownSkills,
    required this.completedAt,
    this.schemaVersion = 1,
  });

  final String id;
  final String ownerId;
  final String dogId;
  final List<AssessmentResponseRecord> responses;
  final Map<String, int> calculatedScores;
  final List<String> unknownSkills;
  final String completedAt;
  final int schemaVersion;

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'ownerId': ownerId,
    'dogId': dogId,
    'responses': responses.map((item) => item.toJson()).toList(growable: false),
    'calculatedScores': calculatedScores,
    'unknownSkills': unknownSkills,
    'completedAt': completedAt,
    'schemaVersion': schemaVersion,
  };

  factory BehaviourAssessmentRecord.fromJson(Map<String, Object?> json) {
    final responsesRaw = json['responses'];
    final scoresRaw = json['calculatedScores'];
    final unknownRaw = json['unknownSkills'];
    if (responsesRaw is! List || scoresRaw is! Map || unknownRaw is! List) {
      throw const AssessmentDataException('Assessment collections are invalid.');
    }

    final record = BehaviourAssessmentRecord(
      id: _requiredString(json, 'id'),
      ownerId: _requiredString(json, 'ownerId'),
      dogId: _requiredString(json, 'dogId'),
      responses: responsesRaw.map((item) {
        if (item is! Map) {
          throw const AssessmentDataException('Assessment response must be an object.');
        }
        return AssessmentResponseRecord.fromJson(item.cast<String, Object?>());
      }).toList(growable: false),
      calculatedScores: scoresRaw.map<String, int>((key, value) {
        if (key is! String || value is! int) {
          throw const AssessmentDataException('Assessment score entry is invalid.');
        }
        return MapEntry(key, value);
      }),
      unknownSkills: unknownRaw.map((item) {
        if (item is! String) {
          throw const AssessmentDataException('Unknown skill must be a string.');
        }
        return item;
      }).toList(growable: false),
      completedAt: _requiredString(json, 'completedAt'),
      schemaVersion: _requiredInt(json, 'schemaVersion'),
    );
    record.validate();
    return record;
  }

  void validate() {
    if (id.trim().isEmpty || ownerId.trim().isEmpty || dogId.trim().isEmpty) {
      throw const AssessmentDataException('Assessment identity fields must not be empty.');
    }
    if (schemaVersion != 1) {
      throw const AssessmentDataException('Unsupported behaviour assessment schema.');
    }
    if (DateTime.tryParse(completedAt) == null) {
      throw const AssessmentDataException('Assessment completion time is invalid.');
    }
    if (responses.length != behaviourSkills.length) {
      throw const AssessmentDataException('A completed assessment must contain ten responses.');
    }
    final questionIds = <String>{};
    final responseSkills = <String>{};
    for (final response in responses) {
      response.validate();
      if (!questionIds.add(response.questionId) || !responseSkills.add(response.skill)) {
        throw const AssessmentDataException('Assessment responses must be unique.');
      }
    }
    _validateScores(calculatedScores);
    final unknown = unknownSkills.toSet();
    if (unknown.length != unknownSkills.length ||
        unknown.any((skill) => !behaviourSkills.contains(skill))) {
      throw const AssessmentDataException('Unknown assessment skills are invalid.');
    }
  }
}

class BehaviourProfileRecord {
  const BehaviourProfileRecord({
    required this.id,
    required this.dogId,
    required this.energyLevel,
    required this.foodMotivation,
    required this.challenges,
    required this.skillScores,
    required this.unknownSkills,
    required this.assessmentId,
    required this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String dogId;
  final String energyLevel;
  final String foodMotivation;
  final List<String> challenges;
  final Map<String, int> skillScores;
  final List<String> unknownSkills;
  final String? assessmentId;
  final String notes;
  final String createdAt;
  final String updatedAt;

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'dogId': dogId,
    'energyLevel': energyLevel,
    'foodMotivation': foodMotivation,
    'challenges': challenges,
    'skillScores': skillScores,
    'unknownSkills': unknownSkills,
    'assessmentId': assessmentId,
    'notes': notes,
    'createdAt': createdAt,
    'updatedAt': updatedAt,
  };

  factory BehaviourProfileRecord.fromJson(Map<String, Object?> json) {
    final scoresRaw = json['skillScores'];
    final unknownRaw = json['unknownSkills'];
    final challengesRaw = json['challenges'];
    if (scoresRaw is! Map || unknownRaw is! List || challengesRaw is! List) {
      throw const AssessmentDataException('Behaviour profile collections are invalid.');
    }
    final record = BehaviourProfileRecord(
      id: _requiredString(json, 'id'),
      dogId: _requiredString(json, 'dogId'),
      energyLevel: _requiredString(json, 'energyLevel'),
      foodMotivation: _requiredString(json, 'foodMotivation'),
      challenges: challengesRaw.map((item) {
        if (item is! String) {
          throw const AssessmentDataException('Challenge must be a string.');
        }
        return item;
      }).toList(growable: false),
      skillScores: scoresRaw.map<String, int>((key, value) {
        if (key is! String || value is! int) {
          throw const AssessmentDataException('Behaviour profile score entry is invalid.');
        }
        return MapEntry(key, value);
      }),
      unknownSkills: unknownRaw.map((item) {
        if (item is! String) {
          throw const AssessmentDataException('Unknown skill must be a string.');
        }
        return item;
      }).toList(growable: false),
      assessmentId: _nullableString(json, 'assessmentId'),
      notes: _requiredString(json, 'notes'),
      createdAt: _requiredString(json, 'createdAt'),
      updatedAt: _requiredString(json, 'updatedAt'),
    );
    record.validate();
    return record;
  }

  void validate() {
    if (id.trim().isEmpty || dogId.trim().isEmpty) {
      throw const AssessmentDataException('Behaviour profile identity is invalid.');
    }
    if (!const <String>{'low', 'medium', 'high'}.contains(energyLevel) ||
        !const <String>{'low', 'medium', 'high'}.contains(foodMotivation)) {
      throw const AssessmentDataException('Behaviour profile level is invalid.');
    }
    _validateScores(skillScores);
    if (unknownSkills.toSet().length != unknownSkills.length ||
        unknownSkills.any((skill) => !behaviourSkills.contains(skill))) {
      throw const AssessmentDataException('Behaviour profile unknown skills are invalid.');
    }
    if (DateTime.tryParse(createdAt) == null || DateTime.tryParse(updatedAt) == null) {
      throw const AssessmentDataException('Behaviour profile timestamp is invalid.');
    }
    if (assessmentId != null && assessmentId!.trim().isEmpty) {
      throw const AssessmentDataException('Behaviour profile assessment id is invalid.');
    }
  }
}

Map<String, int> neutralSkillScores() => <String, int>{
  for (final skill in behaviourSkills) skill: 50,
};

void _validateScores(Map<String, int> scores) {
  if (scores.length != behaviourSkills.length ||
      behaviourSkills.any((skill) => !scores.containsKey(skill))) {
    throw const AssessmentDataException('All behaviour skill scores are required.');
  }
  for (final value in scores.values) {
    if (value < 0 || value > 100) {
      throw const AssessmentDataException('Behaviour skill score must be between 0 and 100.');
    }
  }
}

ScoringDirection _directionFromStorage(String value) {
  for (final direction in ScoringDirection.values) {
    if (direction.name == value) {
      return direction;
    }
  }
  throw AssessmentDataException('Unknown scoring direction: $value');
}

String _requiredString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! String) {
    throw AssessmentDataException('$key must be a string.');
  }
  return value;
}

String? _nullableString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! String) {
    throw AssessmentDataException('$key must be a string or null.');
  }
  return value;
}

int _requiredInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int) {
    throw AssessmentDataException('$key must be an integer.');
  }
  return value;
}

int? _nullableInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) return null;
  if (value is! int) {
    throw AssessmentDataException('$key must be an integer or null.');
  }
  return value;
}

class AssessmentDataException implements Exception {
  const AssessmentDataException(this.message);
  final String message;
  @override
  String toString() => 'AssessmentDataException: $message';
}
