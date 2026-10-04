import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/camera_coach_models.dart';
import '../domain/pose_shadow_validation.dart';

abstract interface class PoseShadowValidationStringStorage {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
}

class SharedPreferencesPoseShadowValidationStorage
    implements PoseShadowValidationStringStorage {
  const SharedPreferencesPoseShadowValidationStorage();

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
      throw StateError('Could not save Camera Coach shadow validation.');
    }
  }
}

class PersistedPoseShadowValidationSample extends PoseShadowValidationSample {
  const PersistedPoseShadowValidationSample({
    required super.id,
    required this.dogId,
    required this.lessonId,
    required super.expectedPosture,
    required super.predictedPosture,
    required super.confidence,
    required this.recordedAt,
    super.groundTruth,
    super.ownerLabel,
  });

  final String dogId;
  final String lessonId;
  final String recordedAt;

  @override
  void validate() {
    super.validate();
    if (dogId.trim().isEmpty || lessonId.trim().isEmpty) {
      throw const PoseShadowValidationException(
        'Persisted shadow validation requires dog and lesson ids.',
      );
    }
    if (DateTime.tryParse(recordedAt) == null) {
      throw const PoseShadowValidationException(
        'Shadow validation recorded time is invalid.',
      );
    }
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'dogId': dogId,
    'lessonId': lessonId,
    'expectedPosture': _postureValue(expectedPosture),
    'predictedPosture': predictedPosture == null
        ? 'unknown'
        : _postureValue(predictedPosture!),
    'confidence': confidence,
    'groundTruth': groundTruth == null ? null : _groundTruthValue(groundTruth!),
    'ownerLabel': ownerLabel?.name,
    'recordedAt': recordedAt,
  };

  factory PersistedPoseShadowValidationSample.fromJson(
    Map<String, Object?> json,
  ) {
    final groundTruthValue = json['groundTruth'];
    final ownerLabelValue = json['ownerLabel'];
    final sample = PersistedPoseShadowValidationSample(
      id: _requiredString(json, 'id'),
      dogId: _requiredString(json, 'dogId'),
      lessonId: _requiredString(json, 'lessonId'),
      expectedPosture: _postureFromValue(
        _requiredString(json, 'expectedPosture'),
      ),
      predictedPosture: _predictedPostureFromValue(
        _requiredString(json, 'predictedPosture'),
      ),
      confidence: _nullableDouble(json, 'confidence'),
      groundTruth: groundTruthValue == null
          ? null
          : _groundTruthFromValue(
              _stringValue(groundTruthValue, 'groundTruth'),
            ),
      ownerLabel: ownerLabelValue == null
          ? null
          : _ownerLabelFromValue(_stringValue(ownerLabelValue, 'ownerLabel')),
      recordedAt: _requiredString(json, 'recordedAt'),
    );
    sample.validate();
    return sample;
  }
}

class PoseShadowValidationRepository {
  const PoseShadowValidationRepository({
    required this.storage,
    this.namespace = storageKey,
  });

  static const storageKey =
      'good_dog_academy.flutter.pose_shadow_validation.v1';
  static const schemaVersion = 1;
  static const maximumSamplesPerDog = 500;

  final PoseShadowValidationStringStorage storage;
  final String namespace;

  Future<List<PersistedPoseShadowValidationSample>> loadForDog(
    String dogId,
  ) async {
    final root = await _readRoot();
    return List<PersistedPoseShadowValidationSample>.unmodifiable(
      root[dogId] ?? const <PersistedPoseShadowValidationSample>[],
    );
  }

  Future<List<PersistedPoseShadowValidationSample>> record(
    PersistedPoseShadowValidationSample sample,
  ) async {
    sample.validate();
    final root = await _readRoot();
    final current =
        root[sample.dogId] ?? const <PersistedPoseShadowValidationSample>[];
    final next =
        <PersistedPoseShadowValidationSample>[
          sample,
          ...current.where((item) => item.id != sample.id),
        ]..sort(
          (a, b) =>
              DateTime.parse(b.recordedAt)
                  .compareTo(DateTime.parse(a.recordedAt)),
        );
    final limited = next.take(maximumSamplesPerDog).toList(growable: false);

    await _writeRoot(<String, List<PersistedPoseShadowValidationSample>>{
      ...root,
      sample.dogId: limited,
    });
    return List<PersistedPoseShadowValidationSample>.unmodifiable(limited);
  }

  Future<PoseShadowValidationReport> loadReport(
    String dogId, {
    DogPosture? expectedPosture,
  }) async {
    final samples = await loadForDog(dogId);
    final filtered = expectedPosture == null
        ? samples
        : samples
              .where((sample) => sample.expectedPosture == expectedPosture)
              .toList(growable: false);
    return buildPoseShadowValidationReport(filtered);
  }

  Future<PoseShadowValidationSummary> loadSummary(String dogId) async {
    final samples = await loadForDog(dogId);
    return buildPoseShadowValidationSummary(samples);
  }

  Future<Map<String, List<PersistedPoseShadowValidationSample>>>
  _readRoot() async {
    final raw = await storage.read(namespace);
    if (raw == null || raw.trim().isEmpty) {
      return <String, List<PersistedPoseShadowValidationSample>>{};
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) return {};
      final root = decoded.cast<String, Object?>();
      if (root['schemaVersion'] != schemaVersion) return {};
      final dogsValue = root['dogs'];
      if (dogsValue is! Map) return {};

      final result = <String, List<PersistedPoseShadowValidationSample>>{};
      for (final entry in dogsValue.entries) {
        final dogId = entry.key;
        final samplesValue = entry.value;
        if (dogId is! String || samplesValue is! List) continue;

        final valid = <PersistedPoseShadowValidationSample>[];
        for (final value in samplesValue) {
          if (value is! Map) continue;
          try {
            final sample = PersistedPoseShadowValidationSample.fromJson(
              value.cast<String, Object?>(),
            );
            if (sample.dogId == dogId) valid.add(sample);
          } catch (_) {
            // Corrupt calibration samples are ignored, never trusted.
          }
        }
        valid.sort(
          (a, b) =>
              DateTime.parse(b.recordedAt)
                  .compareTo(DateTime.parse(a.recordedAt)),
        );
        if (valid.isNotEmpty) {
          result[dogId] = valid
              .take(maximumSamplesPerDog)
              .toList(growable: false);
        }
      }
      return result;
    } catch (_) {
      return <String, List<PersistedPoseShadowValidationSample>>{};
    }
  }

  Future<void> _writeRoot(
    Map<String, List<PersistedPoseShadowValidationSample>> root,
  ) {
    return storage.write(
      namespace,
      jsonEncode(<String, Object?>{
        'schemaVersion': schemaVersion,
        'dogs': <String, Object?>{
          for (final entry in root.entries)
            entry.key: entry.value.map((sample) => sample.toJson()).toList(),
        },
      }),
    );
  }
}

String _postureValue(DogPosture posture) {
  return switch (posture) {
    DogPosture.standLike => 'stand_like',
    DogPosture.sitLike => 'sit_like',
    DogPosture.downLike => 'down_like',
  };
}

DogPosture _postureFromValue(String value) {
  return switch (value) {
    'stand_like' => DogPosture.standLike,
    'sit_like' => DogPosture.sitLike,
    'down_like' => DogPosture.downLike,
    _ => throw const PoseShadowValidationException(
      'Unknown expected dog posture.',
    ),
  };
}

DogPosture? _predictedPostureFromValue(String value) {
  if (value == 'unknown') return null;
  return _postureFromValue(value);
}

String _groundTruthValue(PoseShadowGroundTruth truth) {
  return switch (truth) {
    PoseShadowGroundTruth.standLike => 'stand_like',
    PoseShadowGroundTruth.sitLike => 'sit_like',
    PoseShadowGroundTruth.downLike => 'down_like',
    PoseShadowGroundTruth.noDog => 'no_dog',
    PoseShadowGroundTruth.unsure => 'unsure',
  };
}

PoseShadowGroundTruth _groundTruthFromValue(String value) {
  return switch (value) {
    'stand_like' => PoseShadowGroundTruth.standLike,
    'sit_like' => PoseShadowGroundTruth.sitLike,
    'down_like' => PoseShadowGroundTruth.downLike,
    'no_dog' => PoseShadowGroundTruth.noDog,
    'unsure' => PoseShadowGroundTruth.unsure,
    _ => throw const PoseShadowValidationException(
      'Unknown shadow-validation ground truth.',
    ),
  };
}

PoseShadowOwnerLabel _ownerLabelFromValue(String value) {
  return switch (value) {
    'correct' => PoseShadowOwnerLabel.correct,
    'incorrect' => PoseShadowOwnerLabel.incorrect,
    _ => throw const PoseShadowValidationException(
      'Unknown shadow-validation owner label.',
    ),
  };
}

String _requiredString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! String) {
    throw PoseShadowValidationException('$key must be a string.');
  }
  return value;
}

String _stringValue(Object value, String key) {
  if (value is! String) {
    throw PoseShadowValidationException('$key must be a string.');
  }
  return value;
}

double? _nullableDouble(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) return null;
  if (value is! num) {
    throw PoseShadowValidationException('$key must be numeric or null.');
  }
  return value.toDouble();
}
