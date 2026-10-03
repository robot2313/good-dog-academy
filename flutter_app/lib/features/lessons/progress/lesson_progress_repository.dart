import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../session/training_session_record.dart';
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

class LessonTrainingData {
  const LessonTrainingData({
    required this.records,
    required this.sessions,
  });

  const LessonTrainingData.empty()
      : records = const <LessonProgressRecord>[],
        sessions = const <TrainingSessionRecord>[];

  final List<LessonProgressRecord> records;
  final List<TrainingSessionRecord> sessions;
}

class LessonSessionSaveResult {
  const LessonSessionSaveResult({
    required this.idempotent,
    required this.data,
  });

  final bool idempotent;
  final LessonTrainingData data;
}

class LessonProgressRepository {
  const LessonProgressRepository({
    required this.storage,
    this.storageKey = 'good_dog_academy.flutter.lesson_progress.v1',
  });

  final LessonProgressStringStorage storage;
  final String storageKey;

  static const int schemaVersion = 3;

  Future<List<LessonProgressRecord>> loadAll() async {
    return (await _loadStore()).records;
  }

  Future<LessonTrainingData> loadTrainingDataForDog({
    required String ownerId,
    required String dogId,
  }) async {
    final store = await _loadStore();

    final dogRecords = store.records
        .where((record) => record.dogId == dogId)
        .toList(growable: false);

    if (dogRecords.any((record) => record.ownerId != ownerId)) {
      throw const LessonProgressPersistenceException(
        'Stored lesson progress ownership is inconsistent.',
      );
    }

    final dogSessions = store.sessions
        .where((session) => session.dogId == dogId)
        .toList(growable: false)
      ..sort((left, right) => right.startedAt.compareTo(left.startedAt));

    return LessonTrainingData(
      records: List.unmodifiable(dogRecords),
      sessions: List.unmodifiable(dogSessions),
    );
  }

  Future<List<LessonProgressRecord>> loadForDog({
    required String ownerId,
    required String dogId,
  }) async {
    return (await loadTrainingDataForDog(
      ownerId: ownerId,
      dogId: dogId,
    )).records;
  }

  Future<List<TrainingSessionRecord>> loadSessionsForDog({
    required String ownerId,
    required String dogId,
  }) async {
    return (await loadTrainingDataForDog(
      ownerId: ownerId,
      dogId: dogId,
    )).sessions;
  }

  Future<void> save(LessonProgressRecord record) async {
    record.validate();

    final store = await _loadStore();

    for (final existing in store.records) {
      final sameDogLesson =
          existing.dogId == record.dogId &&
          existing.lessonId == record.lessonId;

      if (sameDogLesson && existing.id != record.id) {
        throw const LessonProgressPersistenceException(
          'Duplicate progress exists for this dog and lesson.',
        );
      }
    }

    final nextRecords = <LessonProgressRecord>[
      for (final existing in store.records)
        if (existing.id != record.id) existing,
      record,
    ];

    await _writeStore(
      LessonTrainingData(records: nextRecords, sessions: store.sessions),
    );
  }

  Future<LessonSessionSaveResult> saveCompletedSessionWithProgress({
    required String ownerId,
    required LessonProgressRecord progress,
    required TrainingSessionRecord session,
  }) async {
    progress.validate();
    session.validate();

    if (progress.ownerId != ownerId ||
        progress.dogId != session.dogId ||
        progress.lessonId != session.lessonId ||
        session.completedAt == null ||
        session.outcome == null) {
      throw const LessonProgressPersistenceException(
        'Completed session and lesson progress do not match.',
      );
    }

    final store = await _loadStore();

    final existingSession = store.sessions
        .where((candidate) => candidate.id == session.id)
        .toList(growable: false);

    if (existingSession.isNotEmpty) {
      final existing = existingSession.single;
      if (!_sameSessionIdentity(existing, session)) {
        throw const LessonProgressPersistenceException(
          'Training session id conflicts with existing history.',
        );
      }
      return LessonSessionSaveResult(
        idempotent: true,
        data: _dogData(store, ownerId: ownerId, dogId: session.dogId),
      );
    }

    final nextRecords = <LessonProgressRecord>[
      for (final existing in store.records)
        if (existing.id != progress.id &&
            !(existing.dogId == progress.dogId &&
                existing.lessonId == progress.lessonId))
          existing,
      progress,
    ];
    final nextSessions = <TrainingSessionRecord>[
      ...store.sessions,
      session,
    ];

    final next = LessonTrainingData(
      records: nextRecords,
      sessions: nextSessions,
    );
    await _writeStore(next);

    return LessonSessionSaveResult(
      idempotent: false,
      data: _dogData(next, ownerId: ownerId, dogId: session.dogId),
    );
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

    final store = await _loadStore();

    final next = <LessonProgressRecord>[
      for (final record in store.records)
        if (record.dogId != dogId) record,
      ...replacement,
    ];

    await _writeStore(
      LessonTrainingData(records: next, sessions: store.sessions),
    );
  }

  Future<LessonTrainingData> _loadStore() async {
    final raw = await storage.read(storageKey);

    if (raw == null) {
      return const LessonTrainingData.empty();
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

    if (version != 1 && version != 2 && version != schemaVersion) {
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

    final sessions = <TrainingSessionRecord>[];
    if (version != 1) {
      final sessionsValue = decoded['sessions'];
      if (sessionsValue is! List<dynamic>) {
        throw const LessonProgressPersistenceException(
          'Stored training sessions must be a list.',
        );
      }
      for (final item in sessionsValue) {
        if (item is! Map<String, dynamic>) {
          throw const LessonProgressPersistenceException(
            'Stored training session must be an object.',
          );
        }
        try {
          sessions.add(
            TrainingSessionRecord.fromJson(item.cast<String, Object?>()),
          );
        } on TrainingSessionDataException catch (cause) {
          throw LessonProgressPersistenceException(
            'Stored training session failed validation.',
            cause: cause,
          );
        }
      }
    }

    final store = LessonTrainingData(
      records: List.unmodifiable(records),
      sessions: List.unmodifiable(sessions),
    );
    _validateStore(store);
    return store;
  }

  Future<void> _writeStore(LessonTrainingData store) async {
    _validateStore(store);

    final encoded = jsonEncode(<String, Object?>{
      'schemaVersion': schemaVersion,
      'records': store.records
          .map((record) => record.toJson())
          .toList(growable: false),
      'sessions': store.sessions
          .map((session) => session.toJson())
          .toList(growable: false),
    });

    await storage.write(storageKey, encoded);
  }

  LessonTrainingData _dogData(
    LessonTrainingData store, {
    required String ownerId,
    required String dogId,
  }) {
    final records = store.records
        .where((record) => record.dogId == dogId)
        .toList(growable: false);
    if (records.any((record) => record.ownerId != ownerId)) {
      throw const LessonProgressPersistenceException(
        'Stored lesson progress ownership is inconsistent.',
      );
    }
    final sessions = store.sessions
        .where((session) => session.dogId == dogId)
        .toList(growable: false)
      ..sort((left, right) => right.startedAt.compareTo(left.startedAt));
    return LessonTrainingData(
      records: List.unmodifiable(records),
      sessions: List.unmodifiable(sessions),
    );
  }

  void _validateStore(LessonTrainingData store) {
    _validateUniqueRecords(store.records);

    final sessionIds = <String>{};
    for (final session in store.sessions) {
      session.validate();
      if (!sessionIds.add(session.id)) {
        throw const LessonProgressPersistenceException(
          'Duplicate training session id.',
        );
      }
    }
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

  bool _sameSessionIdentity(
    TrainingSessionRecord left,
    TrainingSessionRecord right,
  ) {
    return jsonEncode(left.toJson()) == jsonEncode(right.toJson());
  }
}

class LessonProgressPersistenceException implements Exception {
  const LessonProgressPersistenceException(this.message, {this.cause});

  final String message;
  final Object? cause;

  @override
  String toString() => 'LessonProgressPersistenceException: $message';
}
