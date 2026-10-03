import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'app_identity_record.dart';

abstract interface class AppIdentityStringStorage {
  Future<String?> read(String key);

  Future<void> write(String key, String value);
}

class SharedPreferencesAppIdentityStorage implements AppIdentityStringStorage {
  const SharedPreferencesAppIdentityStorage();

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
      throw const AppIdentityPersistenceException(
        'The identity write was not accepted.',
      );
    }
  }
}

class AppIdentityRepository {
  const AppIdentityRepository({
    required this.storage,
    this.storageKey = 'good_dog_academy.flutter.identity.v1',
  });

  final AppIdentityStringStorage storage;
  final String storageKey;

  static const int schemaVersion = 1;

  Future<AppIdentityState> load() async {
    final raw = await storage.read(storageKey);

    if (raw == null) {
      return const AppIdentityState.empty();
    }

    Object? decoded;

    try {
      decoded = jsonDecode(raw);
    } on FormatException catch (cause) {
      throw AppIdentityPersistenceException(
        'Stored identity is not valid JSON.',
        cause: cause,
      );
    }

    if (decoded is! Map<String, dynamic>) {
      throw const AppIdentityPersistenceException(
        'Stored identity must be an object.',
      );
    }

    if (decoded['schemaVersion'] != schemaVersion) {
      throw AppIdentityPersistenceException(
        'Unsupported identity schema: '
        '${decoded['schemaVersion']}.',
      );
    }

    try {
      final ownerValue = decoded['owner'];
      AppOwnerRecord? owner;

      if (ownerValue != null) {
        if (ownerValue is! Map<String, dynamic>) {
          throw const AppIdentityDataException(
            'Stored owner must be an object or null.',
          );
        }

        owner = AppOwnerRecord.fromJson(ownerValue.cast<String, Object?>());
      }

      final dogsValue = decoded['dogs'];

      if (dogsValue is! List<dynamic>) {
        throw const AppIdentityDataException('Stored dogs must be a list.');
      }

      final dogs = <AppDogRecord>[];

      for (final item in dogsValue) {
        if (item is! Map<String, dynamic>) {
          throw const AppIdentityDataException('Stored dog must be an object.');
        }

        dogs.add(AppDogRecord.fromJson(item.cast<String, Object?>()));
      }

      final selectedValue = decoded['selectedDogId'];

      if (selectedValue != null && selectedValue is! String) {
        throw const AppIdentityDataException(
          'Selected dog id must be a string or null.',
        );
      }

      final state = AppIdentityState(
        owner: owner,
        dogs: List<AppDogRecord>.unmodifiable(dogs),
        selectedDogId: selectedValue as String?,
      );

      state.validate();
      return state;
    } on AppIdentityDataException catch (cause) {
      throw AppIdentityPersistenceException(
        'Stored identity failed validation.',
        cause: cause,
      );
    }
  }

  Future<void> save(AppIdentityState state) async {
    try {
      state.validate();
    } on AppIdentityDataException catch (cause) {
      throw AppIdentityPersistenceException(
        'Identity failed validation.',
        cause: cause,
      );
    }

    final encoded = jsonEncode(<String, Object?>{
      'schemaVersion': schemaVersion,
      ...state.toJson(),
    });

    await storage.write(storageKey, encoded);
  }

  Future<void> selectDog(String dogId) async {
    final state = await load();

    if (state.owner == null) {
      throw const AppIdentityPersistenceException(
        'A dog cannot be selected without an owner.',
      );
    }

    final exists = state.dogs.any((dog) => dog.id == dogId);

    if (!exists) {
      throw const AppIdentityPersistenceException(
        'The selected dog does not exist.',
      );
    }

    await save(
      AppIdentityState(
        owner: state.owner,
        dogs: state.dogs,
        selectedDogId: dogId,
      ),
    );
  }
}

class AppIdentityPersistenceException implements Exception {
  const AppIdentityPersistenceException(this.message, {this.cause});

  final String message;
  final Object? cause;

  @override
  String toString() => 'AppIdentityPersistenceException: $message';
}
