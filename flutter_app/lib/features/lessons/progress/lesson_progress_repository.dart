import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'lesson_progress_record.dart';

abstract interface class LessonProgressStringStorage {
  Future<String?> read(String key);

  Future<void> write(String key, String value);
}

class SharedPreferencesLessonProgressStorage
    implements LessonProgressStringStorage {
  const SharedPreferencesLessonProgressStorage();

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
      throw const LessonProgressPersistenceException(
        'The lesson progress write was not accepted.',
      );
    }
  }
}

class LessonProgressRepository {
  const LessonProgressRepository({
    required this.storage,
    this.storageKey = 'good_dog_academy.flutter.lesson_progress.v1',
  });

  final LessonProgressStringStorage storage;
  final String storageKey;

  static const int schemaVersion = 1;

  Future<List<LessonProgressRecord>> loadAll() async {
    final raw = await storage.read(storageKey);

    if (raw == null) {
      return const <LessonProgressRecord>[];
    }

    Object? decoded;

    try {
      decoded = jsonDecode(raw);
    } on FormatException catch (cause) {
      throw LessonProgressPersistenceException(
        'Stored lesson progress is not valid JSON.',
        cause: cause,
      );
    }

    if (decoded is! Map<String, dynamic>) {
      throw const LessonProgressPersistenceException(
        'Stored lesson progress must be an object.',
      );
    }

    final version = decoded['schemaVersion'];

    if (version != schemaVersion) {
      throw LessonProgressPersistenceException(
        'Unsupported lesson progress schema: $version.',
      );
    }

    final recordsValue = decoded['records'];

    if (recordsValue is! List<dynamic>) {
      throw const LessonProgressPersistenceException(
        'Stored lesson progress records must be a list.',
      );
    }

    final records = <LessonProgressRecord>[];

    for (final item in recordsValue) {
      if (item is! Map<String, dynamic>) {
        throw const LessonProgressPersistenceException(
          'Stored lesson progress record must be an object.',
        );
      }

      try {
        records.add(
          LessonProgressRecord.fromJson(item.cast<String, Object?>()),
        );
      } on LessonProgressDataException catch (cause) {
        throw LessonProgressPersistenceException(
          'Stored lesson progress failed validation.',
          cause: cause,
        );
      }
    }

    _validateUniqueRecords(records);

    return List<LessonProgressRecord>.unmodifiable(records);
  }

  Future<List<LessonProgressRecord>> loadForDog({
    required String ownerId,
    required String dogId,
  }) async {
    final all = await loadAll();

    final dogRecords = all
        .where((record) => record.dogId == dogId)
        .toList(growable: false);

    if (dogRecords.any((record) => record.ownerId != ownerId)) {
      throw const LessonProgressPersistenceException(
        'Stored lesson progress ownership is inconsistent.',
      );
    }

    return dogRecords;
  }

  Future<void> save(LessonProgressRecord record) async {
    record.validate();

    final all = await loadAll();

    for (final existing in all) {
      final sameDogLesson =
          existing.dogId == record.dogId &&
          existing.lessonId == record.lessonId;

      if (sameDogLesson && existing.id != record.id) {
        throw const LessonProgressPersistenceException(
          'Duplicate progress exists for this dog and lesson.',
        );
      }
    }

    final next = <LessonProgressRecord>[
      for (final existing in all)
        if (existing.id != record.id) existing,
      record,
    ];

    await _writeAll(next);
  }

  Future<void> replaceForDog({
    required String ownerId,
    required String dogId,
    required Iterable<LessonProgressRecord> records,
  }) async {
    final replacement = records.toList(growable: false);

    for (final record in replacement) {
      record.validate();

      if (record.ownerId != ownerId || record.dogId != dogId) {
        throw const LessonProgressPersistenceException(
          'Replacement lesson progress ownership is invalid.',
        );
      }
    }

    _validateUniqueRecords(replacement);

    final current = await loadAll();

    final next = <LessonProgressRecord>[
      for (final record in current)
        if (record.dogId != dogId) record,
      ...replacement,
    ];

    _validateUniqueRecords(next);

    await _writeAll(next);
  }

  Future<void> _writeAll(List<LessonProgressRecord> records) async {
    _validateUniqueRecords(records);

    final encoded = jsonEncode(<String, Object?>{
      'schemaVersion': schemaVersion,
      'records': records
          .map((record) => record.toJson())
          .toList(growable: false),
    });

    await storage.write(storageKey, encoded);
  }

  void _validateUniqueRecords(Iterable<LessonProgressRecord> records) {
    final ids = <String>{};
    final dogLessons = <String>{};

    for (final record in records) {
      if (!ids.add(record.id)) {
        throw const LessonProgressPersistenceException(
          'Duplicate lesson progress record id.',
        );
      }

      final dogLesson = '${record.dogId}\u0000${record.lessonId}';

      if (!dogLessons.add(dogLesson)) {
        throw const LessonProgressPersistenceException(
          'Duplicate progress exists for a dog and lesson.',
        );
      }
    }
  }
}

class LessonProgressPersistenceException implements Exception {
  const LessonProgressPersistenceException(this.message, {this.cause});

  final String message;
  final Object? cause;

  @override
  String toString() => 'LessonProgressPersistenceException: $message';
}
