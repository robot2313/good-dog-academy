import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'assessment_models.dart';

abstract interface class AssessmentStringStorage {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
}

class SharedPreferencesAssessmentStorage implements AssessmentStringStorage {
  const SharedPreferencesAssessmentStorage();

  @override
  Future<String?> read(String key) async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(key);
  }

  @override
  Future<void> write(String key, String value) async {
    final preferences = await SharedPreferences.getInstance();
    final saved = await preferences.setString(key, value);
    if (!saved) {
      throw const AssessmentPersistenceException(
        'The behaviour assessment write was not accepted.',
      );
    }
  }
}

class AssessmentStoreState {
  const AssessmentStoreState({
    required this.assessments,
    required this.profiles,
  });

  const AssessmentStoreState.empty()
      : assessments = const <BehaviourAssessmentRecord>[],
        profiles = const <BehaviourProfileRecord>[];

  final List<BehaviourAssessmentRecord> assessments;
  final List<BehaviourProfileRecord> profiles;

  BehaviourProfileRecord? profileForDog(String dogId) {
    for (final profile in profiles) {
      if (profile.dogId == dogId) return profile;
    }
    return null;
  }

  BehaviourAssessmentRecord? currentAssessmentForDog(String dogId) {
    final profile = profileForDog(dogId);
    final assessmentId = profile?.assessmentId;
    if (assessmentId == null) return null;
    for (final assessment in assessments) {
      if (assessment.id == assessmentId && assessment.dogId == dogId) {
        return assessment;
      }
    }
    return null;
  }
}

class AssessmentRepository {
  const AssessmentRepository({
    required this.storage,
    this.storageKey = 'good_dog_academy.flutter.assessment.v1',
  });

  final AssessmentStringStorage storage;
  final String storageKey;
  static const int schemaVersion = 1;

  Future<AssessmentStoreState> load() async {
    final raw = await storage.read(storageKey);
    if (raw == null) return const AssessmentStoreState.empty();

    Object? decoded;
    try {
      decoded = jsonDecode(raw);
    } on FormatException catch (cause) {
      throw AssessmentPersistenceException(
        'Stored behaviour assessment data is not valid JSON.',
        cause: cause,
      );
    }
    if (decoded is! Map<String, dynamic>) {
      throw const AssessmentPersistenceException(
        'Stored behaviour assessment data must be an object.',
      );
    }
    if (decoded['schemaVersion'] != schemaVersion) {
      throw AssessmentPersistenceException(
        'Unsupported behaviour assessment storage schema: ${decoded['schemaVersion']}.',
      );
    }
    final assessmentsRaw = decoded['assessments'];
    final profilesRaw = decoded['profiles'];
    if (assessmentsRaw is! List || profilesRaw is! List) {
      throw const AssessmentPersistenceException(
        'Stored behaviour assessment collections are invalid.',
      );
    }

    try {
      final state = AssessmentStoreState(
        assessments: assessmentsRaw.map((item) {
          if (item is! Map) {
            throw const AssessmentDataException('Assessment must be an object.');
          }
          return BehaviourAssessmentRecord.fromJson(item.cast<String, Object?>());
        }).toList(growable: false),
        profiles: profilesRaw.map((item) {
          if (item is! Map) {
            throw const AssessmentDataException('Profile must be an object.');
          }
          return BehaviourProfileRecord.fromJson(item.cast<String, Object?>());
        }).toList(growable: false),
      );
      _validateState(state);
      return state;
    } on AssessmentDataException catch (cause) {
      throw AssessmentPersistenceException(
        'Stored behaviour assessment data failed validation.',
        cause: cause,
      );
    }
  }

  Future<void> complete({
    required BehaviourAssessmentRecord assessment,
    required BehaviourProfileRecord profile,
  }) async {
    assessment.validate();
    profile.validate();
    if (assessment.dogId != profile.dogId ||
        profile.assessmentId != assessment.id) {
      throw const AssessmentPersistenceException(
        'Assessment and behaviour profile do not match.',
      );
    }

    final current = await load();
    final next = AssessmentStoreState(
      assessments: <BehaviourAssessmentRecord>[
        ...current.assessments,
        assessment,
      ],
      profiles: <BehaviourProfileRecord>[
        for (final existing in current.profiles)
          if (existing.dogId != profile.dogId) existing,
        profile,
      ],
    );
    _validateState(next);
    await _write(next);
  }

  Future<void> _write(AssessmentStoreState state) async {
    final encoded = jsonEncode(<String, Object?>{
      'schemaVersion': schemaVersion,
      'assessments': state.assessments
          .map((item) => item.toJson())
          .toList(growable: false),
      'profiles': state.profiles
          .map((item) => item.toJson())
          .toList(growable: false),
    });
    await storage.write(storageKey, encoded);
  }

  void _validateState(AssessmentStoreState state) {
    final assessmentIds = <String>{};
    for (final assessment in state.assessments) {
      assessment.validate();
      if (!assessmentIds.add(assessment.id)) {
        throw const AssessmentDataException('Duplicate behaviour assessment id.');
      }
    }

    final profileDogs = <String>{};
    for (final profile in state.profiles) {
      profile.validate();
      if (!profileDogs.add(profile.dogId)) {
        throw const AssessmentDataException('Duplicate behaviour profile for dog.');
      }
      final assessmentId = profile.assessmentId;
      if (assessmentId != null) {
        final matches = state.assessments.where(
          (assessment) =>
              assessment.id == assessmentId &&
              assessment.dogId == profile.dogId,
        );
        if (matches.length != 1) {
          throw const AssessmentDataException(
            'Behaviour profile assessment reference is invalid.',
          );
        }
      }
    }
  }
}

class AssessmentPersistenceException implements Exception {
  const AssessmentPersistenceException(this.message, {this.cause});
  final String message;
  final Object? cause;
  @override
  String toString() => 'AssessmentPersistenceException: $message';
}
