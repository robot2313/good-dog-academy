import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/identity/app_identity_record.dart';
import 'package:good_dog_academy/features/identity/app_identity_repository.dart';

void main() {
  test('owner dog and selected identity survive round trip', () async {
    final repository = AppIdentityRepository(storage: _MemoryStorage());

    await repository.save(_state());

    final loaded = await repository.load();

    expect(loaded.owner?.id, 'owner-1');
    expect(loaded.owner?.displayName, 'Alex');
    expect(loaded.dogs, hasLength(1));
    expect(loaded.dogs.single.id, 'dog-1');
    expect(loaded.dogs.single.name, 'Scout');
    expect(loaded.selectedDogId, 'dog-1');
    expect(loaded.selectedDog?.name, 'Scout');
  });

  test('identity JSON preserves RN enum storage values', () {
    final ownerJson = _owner().toJson();

    expect(ownerJson['trainingExperience'], 'beginner');

    expect(ownerJson['primaryGoal'], 'family-companion');

    final dogJson = _dog().toJson();

    expect(dogJson['sex'], 'female');
    expect(dogJson['weightUnit'], 'kg');
    expect(dogJson['energyLevel'], 'medium');
  });

  test('repository rejects dog belonging to another owner', () async {
    final repository = AppIdentityRepository(storage: _MemoryStorage());

    expect(
      () => repository.save(
        AppIdentityState(
          owner: _owner(),
          dogs: <AppDogRecord>[_dog(ownerId: 'owner-2')],
          selectedDogId: 'dog-1',
        ),
      ),
      throwsA(isA<AppIdentityPersistenceException>()),
    );
  });

  test('repository rejects missing selected dog', () async {
    final repository = AppIdentityRepository(storage: _MemoryStorage());

    expect(
      () => repository.save(
        AppIdentityState(
          owner: _owner(),
          dogs: <AppDogRecord>[_dog()],
          selectedDogId: 'dog-missing',
        ),
      ),
      throwsA(isA<AppIdentityPersistenceException>()),
    );
  });

  test('selectDog persists active dog without changing profiles', () async {
    final repository = AppIdentityRepository(storage: _MemoryStorage());

    await repository.save(
      AppIdentityState(
        owner: _owner(),
        dogs: <AppDogRecord>[
          _dog(),
          _dog(id: 'dog-2', name: 'Pepper'),
        ],
        selectedDogId: 'dog-1',
      ),
    );

    await repository.selectDog('dog-2');

    final loaded = await repository.load();

    expect(loaded.dogs, hasLength(2));
    expect(loaded.selectedDogId, 'dog-2');
    expect(loaded.selectedDog?.name, 'Pepper');
  });

  test('repository fails closed on corrupt stored identity', () async {
    final storage = _MemoryStorage();

    storage.values['good_dog_academy.flutter.identity.v1'] = jsonEncode(
      <String, Object?>{
        'schemaVersion': 1,
        'owner': null,
        'dogs': <Object?>[_dog().toJson()],
        'selectedDogId': 'dog-1',
      },
    );

    final repository = AppIdentityRepository(storage: storage);

    expect(repository.load, throwsA(isA<AppIdentityPersistenceException>()));
  });
}

AppIdentityState _state() {
  return AppIdentityState(
    owner: _owner(),
    dogs: <AppDogRecord>[_dog()],
    selectedDogId: 'dog-1',
  );
}

AppOwnerRecord _owner() {
  return const AppOwnerRecord(
    id: 'owner-1',
    email: null,
    displayName: 'Alex',
    trainingExperience: TrainingExperience.beginner,
    primaryGoal: PrimaryGoal.familyCompanion,
    createdAt: '2026-10-03T04:00:00.000Z',
    updatedAt: '2026-10-03T04:00:00.000Z',
  );
}

AppDogRecord _dog({
  String id = 'dog-1',
  String ownerId = 'owner-1',
  String name = 'Scout',
}) {
  return AppDogRecord(
    id: id,
    ownerId: ownerId,
    name: name,
    breed: 'Kelpie',
    breedUnknown: false,
    dateOfBirth: '2023-05-10',
    birthdayEstimated: false,
    estimatedAgeYears: null,
    sex: DogSex.female,
    weightKg: 18,
    weightUnit: WeightUnit.kg,
    energyLevel: DogEnergyLevel.medium,
    photoUri: null,
    createdAt: '2026-10-03T04:00:00.000Z',
    updatedAt: '2026-10-03T04:00:00.000Z',
  );
}

class _MemoryStorage implements AppIdentityStringStorage {
  final Map<String, String> values = <String, String>{};

  @override
  Future<String?> read(String key) async {
    return values[key];
  }

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}
