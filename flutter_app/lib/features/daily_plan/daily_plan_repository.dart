import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'daily_plan_models.dart';

abstract interface class DailyPlanStringStorage {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
}

class SharedPreferencesDailyPlanStorage implements DailyPlanStringStorage {
  const SharedPreferencesDailyPlanStorage();

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
      throw const DailyPlanPersistenceException(
        'The daily plan write was not accepted.',
      );
    }
  }
}

class DailyPlanRepository {
  const DailyPlanRepository({
    required this.storage,
    this.storageKey = 'good_dog_academy.flutter.daily_plans.v1',
  });

  final DailyPlanStringStorage storage;
  final String storageKey;
  static const int schemaVersion = 1;

  Future<List<DailyPlanRecord>> loadAll() async {
    final raw = await storage.read(storageKey);
    if (raw == null) return const <DailyPlanRecord>[];

    Object? decoded;
    try {
      decoded = jsonDecode(raw);
    } on FormatException catch (cause) {
      throw DailyPlanPersistenceException(
        'Stored daily plans are not valid JSON.',
        cause: cause,
      );
    }
    if (decoded is! Map<String, dynamic> ||
        decoded['schemaVersion'] != schemaVersion ||
        decoded['plans'] is! List) {
      throw const DailyPlanPersistenceException(
        'Stored daily plan data is invalid.',
      );
    }

    final plans = <DailyPlanRecord>[];
    try {
      for (final item in decoded['plans'] as List) {
        if (item is! Map) {
          throw const DailyPlanDataException(
            'Stored daily plan must be an object.',
          );
        }
        plans.add(DailyPlanRecord.fromJson(item.cast<String, Object?>()));
      }
    } on DailyPlanDataException catch (cause) {
      throw DailyPlanPersistenceException(
        'Stored daily plan failed validation.',
        cause: cause,
      );
    }

    final ids = <String>{};
    final dogDates = <String>{};
    for (final plan in plans) {
      if (!ids.add(plan.id) ||
          !dogDates.add('${plan.ownerId}\u0000${plan.dogId}\u0000${plan.localDate}')) {
        throw const DailyPlanPersistenceException(
          'Stored daily plans contain duplicates.',
        );
      }
    }
    return List.unmodifiable(plans);
  }

  Future<DailyPlanRecord?> findForDogDate({
    required String ownerId,
    required String dogId,
    required String localDate,
  }) async {
    final plans = await loadAll();
    for (final plan in plans) {
      if (plan.ownerId == ownerId &&
          plan.dogId == dogId &&
          plan.localDate == localDate) {
        return plan;
      }
    }
    return null;
  }

  Future<List<DailyPlanRecord>> recentForDog({
    required String ownerId,
    required String dogId,
    required String beforeDate,
    int limit = 7,
  }) async {
    final plans = (await loadAll())
        .where(
          (plan) =>
              plan.ownerId == ownerId &&
              plan.dogId == dogId &&
              plan.localDate.compareTo(beforeDate) < 0,
        )
        .toList(growable: false)
      ..sort((left, right) => right.localDate.compareTo(left.localDate));
    return List.unmodifiable(plans.take(limit));
  }

  Future<void> save(DailyPlanRecord plan) async {
    plan.validate();
    final plans = await loadAll();
    final next = <DailyPlanRecord>[
      for (final existing in plans)
        if (existing.id != plan.id) existing,
      plan,
    ];

    for (final existing in next) {
      if (existing.id == plan.id) continue;
      if (existing.ownerId == plan.ownerId &&
          existing.dogId == plan.dogId &&
          existing.localDate == plan.localDate) {
        throw const DailyPlanPersistenceException(
          'A daily plan already exists for this dog and date.',
        );
      }
    }

    await storage.write(
      storageKey,
      jsonEncode(<String, Object?>{
        'schemaVersion': schemaVersion,
        'plans': next.map((item) => item.toJson()).toList(growable: false),
      }),
    );
  }
}

class DailyPlanPersistenceException implements Exception {
  const DailyPlanPersistenceException(this.message, {this.cause});
  final String message;
  final Object? cause;
  @override
  String toString() => 'DailyPlanPersistenceException: $message';
}
