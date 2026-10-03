enum TrainingExperience {
  beginner,
  intermediate,
  experienced,
}

enum PrimaryGoal {
  familyCompanion,
  basicObedience,
  behaviourHelp,
  adventure,
  dogSport,
}

enum DogSex {
  female,
  male,
  unknown,
}

enum WeightUnit {
  kg,
  lb,
}

enum DogEnergyLevel {
  low,
  medium,
  high,
}

class AppOwnerRecord {
  const AppOwnerRecord({
    required this.id,
    required this.email,
    required this.displayName,
    required this.trainingExperience,
    required this.primaryGoal,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String? email;
  final String displayName;
  final TrainingExperience trainingExperience;
  final PrimaryGoal primaryGoal;
  final String createdAt;
  final String updatedAt;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'id': id,
      'email': email,
      'displayName': displayName,
      'trainingExperience': trainingExperience.name,
      'primaryGoal': _primaryGoalStorageValue(primaryGoal),
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  factory AppOwnerRecord.fromJson(
    Map<String, Object?> json,
  ) {
    final record = AppOwnerRecord(
      id: _requiredString(json, 'id'),
      email: _nullableString(json, 'email'),
      displayName: _requiredString(json, 'displayName'),
      trainingExperience: _trainingExperienceFromStorage(
        _requiredString(json, 'trainingExperience'),
      ),
      primaryGoal: _primaryGoalFromStorage(
        _requiredString(json, 'primaryGoal'),
      ),
      createdAt: _requiredString(json, 'createdAt'),
      updatedAt: _requiredString(json, 'updatedAt'),
    );

    record.validate();
    return record;
  }

  void validate() {
    if (id.trim().isEmpty) {
      throw const AppIdentityDataException(
        'Owner id must not be empty.',
      );
    }

    if (displayName.trim().isEmpty) {
      throw const AppIdentityDataException(
        'Owner display name must not be empty.',
      );
    }

    final ownerEmail = email;

    if (ownerEmail != null) {
      if (ownerEmail.trim().isEmpty ||
          !RegExp(
            r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
          ).hasMatch(ownerEmail)) {
        throw const AppIdentityDataException(
          'Owner email must be valid or null.',
        );
      }
    }

    _validateTimestamp(createdAt, 'createdAt');
    _validateTimestamp(updatedAt, 'updatedAt');
  }
}

class AppDogRecord {
  const AppDogRecord({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.breed,
    required this.breedUnknown,
    required this.dateOfBirth,
    required this.birthdayEstimated,
    required this.estimatedAgeYears,
    required this.sex,
    required this.weightKg,
    required this.weightUnit,
    required this.energyLevel,
    required this.photoUri,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String ownerId;
  final String name;
  final String breed;
  final bool breedUnknown;
  final String? dateOfBirth;
  final bool birthdayEstimated;
  final double? estimatedAgeYears;
  final DogSex sex;
  final double? weightKg;
  final WeightUnit weightUnit;
  final DogEnergyLevel energyLevel;
  final String? photoUri;
  final String createdAt;
  final String updatedAt;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'id': id,
      'ownerId': ownerId,
      'name': name,
      'breed': breed,
      'breedUnknown': breedUnknown,
      'dateOfBirth': dateOfBirth,
      'birthdayEstimated': birthdayEstimated,
      'estimatedAgeYears': estimatedAgeYears,
      'sex': sex.name,
      'weightKg': weightKg,
      'weightUnit': weightUnit.name,
      'energyLevel': energyLevel.name,
      'photoUri': photoUri,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  factory AppDogRecord.fromJson(
    Map<String, Object?> json,
  ) {
    final record = AppDogRecord(
      id: _requiredString(json, 'id'),
      ownerId: _requiredString(json, 'ownerId'),
      name: _requiredString(json, 'name'),
      breed: _requiredString(json, 'breed'),
      breedUnknown: _requiredBool(
        json,
        'breedUnknown',
      ),
      dateOfBirth: _nullableString(
        json,
        'dateOfBirth',
      ),
      birthdayEstimated: _requiredBool(
        json,
        'birthdayEstimated',
      ),
      estimatedAgeYears: _nullableDouble(
        json,
        'estimatedAgeYears',
      ),
      sex: _dogSexFromStorage(
        _requiredString(json, 'sex'),
      ),
      weightKg: _nullableDouble(
        json,
        'weightKg',
      ),
      weightUnit: _weightUnitFromStorage(
        _requiredString(json, 'weightUnit'),
      ),
      energyLevel: _energyLevelFromStorage(
        _requiredString(json, 'energyLevel'),
      ),
      photoUri: _nullableString(
        json,
        'photoUri',
      ),
      createdAt: _requiredString(json, 'createdAt'),
      updatedAt: _requiredString(json, 'updatedAt'),
    );

    record.validate();
    return record;
  }

  void validate() {
    if (id.trim().isEmpty ||
        ownerId.trim().isEmpty ||
        name.trim().isEmpty) {
      throw const AppIdentityDataException(
        'Dog identity fields must not be empty.',
      );
    }

    if (!breedUnknown && breed.trim().isEmpty) {
      throw const AppIdentityDataException(
        'Dog breed is required unless marked unknown.',
      );
    }

    final birthday = dateOfBirth;

    if (birthday != null) {
      if (!_isValidDateOnly(birthday)) {
        throw const AppIdentityDataException(
          'Dog date of birth must use a valid YYYY-MM-DD date.',
        );
      }

      final parsed = DateTime.parse(
        '${birthday}T00:00:00.000Z',
      );

      final now = DateTime.now().toUtc();
      final today = DateTime.utc(
        now.year,
        now.month,
        now.day,
      );

      if (parsed.isAfter(today)) {
        throw const AppIdentityDataException(
          'Dog date of birth cannot be in the future.',
        );
      }
    }

    final age = estimatedAgeYears;

    if (age != null &&
        (!age.isFinite || age <= 0 || age > 30)) {
      throw const AppIdentityDataException(
        'Estimated dog age must be greater than 0 '
        'and at most 30 years.',
      );
    }

    if (birthdayEstimated && age == null) {
      throw const AppIdentityDataException(
        'Estimated dog age is required when birthday is estimated.',
      );
    }

    if (!birthdayEstimated && birthday == null) {
      throw const AppIdentityDataException(
        'Dog date of birth is required when birthday is not estimated.',
      );
    }

    final weight = weightKg;

    if (weight != null &&
        (!weight.isFinite || weight <= 0)) {
      throw const AppIdentityDataException(
        'Dog weight must be positive or null.',
      );
    }

    final photo = photoUri;

    if (photo != null && photo.trim().isEmpty) {
      throw const AppIdentityDataException(
        'Dog photo URI must be non-empty or null.',
      );
    }

    _validateTimestamp(createdAt, 'createdAt');
    _validateTimestamp(updatedAt, 'updatedAt');
  }
}

class AppIdentityState {
  const AppIdentityState({
    required this.owner,
    required this.dogs,
    required this.selectedDogId,
  });

  const AppIdentityState.empty()
      : owner = null,
        dogs = const <AppDogRecord>[],
        selectedDogId = null;

  final AppOwnerRecord? owner;
  final List<AppDogRecord> dogs;
  final String? selectedDogId;

  AppDogRecord? get selectedDog {
    final id = selectedDogId;

    if (id == null) {
      return null;
    }

    for (final dog in dogs) {
      if (dog.id == id) {
        return dog;
      }
    }

    return null;
  }

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'owner': owner?.toJson(),
      'dogs': dogs
          .map((dog) => dog.toJson())
          .toList(growable: false),
      'selectedDogId': selectedDogId,
    };
  }

  void validate() {
    final currentOwner = owner;

    if (currentOwner == null) {
      if (dogs.isNotEmpty || selectedDogId != null) {
        throw const AppIdentityDataException(
          'Dogs or dog selection cannot exist without an owner.',
        );
      }

      return;
    }

    currentOwner.validate();

    final ids = <String>{};

    for (final dog in dogs) {
      dog.validate();

      if (dog.ownerId != currentOwner.id) {
        throw const AppIdentityDataException(
          'Dog ownership does not match the saved owner.',
        );
      }

      if (!ids.add(dog.id)) {
        throw const AppIdentityDataException(
          'Duplicate dog id.',
        );
      }
    }

    final selected = selectedDogId;

    if (selected != null && !ids.contains(selected)) {
      throw const AppIdentityDataException(
        'Selected dog does not exist.',
      );
    }
  }
}

class AppIdentityDataException implements Exception {
  const AppIdentityDataException(this.message);

  final String message;

  @override
  String toString() =>
      'AppIdentityDataException: $message';
}

String _primaryGoalStorageValue(
  PrimaryGoal goal,
) {
  switch (goal) {
    case PrimaryGoal.familyCompanion:
      return 'family-companion';
    case PrimaryGoal.basicObedience:
      return 'basic-obedience';
    case PrimaryGoal.behaviourHelp:
      return 'behaviour-help';
    case PrimaryGoal.adventure:
      return 'adventure';
    case PrimaryGoal.dogSport:
      return 'dog-sport';
  }
}

PrimaryGoal _primaryGoalFromStorage(
  String value,
) {
  switch (value) {
    case 'family-companion':
      return PrimaryGoal.familyCompanion;
    case 'basic-obedience':
      return PrimaryGoal.basicObedience;
    case 'behaviour-help':
      return PrimaryGoal.behaviourHelp;
    case 'adventure':
      return PrimaryGoal.adventure;
    case 'dog-sport':
      return PrimaryGoal.dogSport;
  }

  throw AppIdentityDataException(
    'Unknown primary goal: $value',
  );
}

TrainingExperience _trainingExperienceFromStorage(
  String value,
) {
  for (final item in TrainingExperience.values) {
    if (item.name == value) {
      return item;
    }
  }

  throw AppIdentityDataException(
    'Unknown training experience: $value',
  );
}

DogSex _dogSexFromStorage(
  String value,
) {
  for (final item in DogSex.values) {
    if (item.name == value) {
      return item;
    }
  }

  throw AppIdentityDataException(
    'Unknown dog sex: $value',
  );
}

WeightUnit _weightUnitFromStorage(
  String value,
) {
  for (final item in WeightUnit.values) {
    if (item.name == value) {
      return item;
    }
  }

  throw AppIdentityDataException(
    'Unknown weight unit: $value',
  );
}

DogEnergyLevel _energyLevelFromStorage(
  String value,
) {
  for (final item in DogEnergyLevel.values) {
    if (item.name == value) {
      return item;
    }
  }

  throw AppIdentityDataException(
    'Unknown dog energy level: $value',
  );
}

String _requiredString(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];

  if (value is! String) {
    throw AppIdentityDataException(
      '$key must be a string.',
    );
  }

  return value;
}

String? _nullableString(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];

  if (value == null) {
    return null;
  }

  if (value is! String) {
    throw AppIdentityDataException(
      '$key must be a string or null.',
    );
  }

  return value;
}

bool _requiredBool(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];

  if (value is! bool) {
    throw AppIdentityDataException(
      '$key must be a boolean.',
    );
  }

  return value;
}

double? _nullableDouble(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];

  if (value == null) {
    return null;
  }

  if (value is! num) {
    throw AppIdentityDataException(
      '$key must be a number or null.',
    );
  }

  return value.toDouble();
}

void _validateTimestamp(
  String value,
  String field,
) {
  if (DateTime.tryParse(value) == null) {
    throw AppIdentityDataException(
      '$field must be a valid timestamp.',
    );
  }
}

bool _isValidDateOnly(
  String value,
) {
  final match = RegExp(
    r'^(\d{4})-(\d{2})-(\d{2})$',
  ).firstMatch(value);

  if (match == null) {
    return false;
  }

  final year = int.parse(match.group(1)!);
  final month = int.parse(match.group(2)!);
  final day = int.parse(match.group(3)!);

  final parsed = DateTime.utc(
    year,
    month,
    day,
  );

  return parsed.year == year &&
      parsed.month == month &&
      parsed.day == day;
}
