import 'dart:convert';
import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/identity/app_identity_controller.dart';
import 'package:good_dog_academy/features/identity/app_identity_repository.dart';
import 'package:good_dog_academy/features/identity/app_identity_record.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_controller.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_repository.dart';

import 'identity_fixtures.dart';

void main() {
  test(
    'selection persists, restores, and failed writes retain old dog',
    () async {
      final storage = IdentityMemoryStorage();
      final repository = AppIdentityRepository(storage: storage);
      await repository.save(
        AppIdentityState(
          owner: ownerRecord(),
          dogs: [
            dogRecord(),
            dogRecord(id: 'dog-2'),
          ],
          selectedDogId: 'dog-1',
        ),
      );
      final controller = AppIdentityController(repository: repository);
      expect(await controller.selectDog('dog-2'), isFalse);
      await controller.load();
      expect(await controller.selectDog('missing'), isFalse);
      expect(controller.selectedDogId, 'dog-1');
      expect(await controller.selectDog('dog-2'), isTrue);
      final relaunched = AppIdentityController(repository: repository);
      await relaunched.load();
      expect(relaunched.selectedDogId, 'dog-2');
      storage.failWrite = true;
      expect(await controller.selectDog('dog-1'), isFalse);
      expect(controller.selectedDogId, 'dog-2');
      expect(controller.error, isNotNull);
      storage.failWrite = false;
      expect(await controller.selectDog('dog-1'), isTrue);
    },
  );
  test('empty, owner-only and no-selection states remain explicit', () async {
    final repository = AppIdentityRepository(storage: IdentityMemoryStorage());
    final controller = AppIdentityController(repository: repository);
    await controller.load();
    expect(controller.loaded, isTrue);
    expect(controller.owner, isNull);
    expect(await controller.selectDog('dog-1'), isFalse);
    for (final dogs in <List<AppDogRecord>>[
      [],
      [dogRecord()],
    ]) {
      await repository.save(
        AppIdentityState(owner: ownerRecord(), dogs: dogs, selectedDogId: null),
      );
      await controller.reload();
      expect(controller.selectedDog, isNull);
      expect(controller.dogs.length, dogs.length);
    }
  });
  for (final raw in [
    '{',
    '[]',
    '{"schemaVersion":2}',
    jsonEncode({
      'schemaVersion': 1,
      ...identityState().toJson(),
      'selectedDogId': 'absent',
    }),
    jsonEncode({
      'schemaVersion': 1,
      ...identityState().toJson(),
      'owner': null,
    }),
    jsonEncode({
      'schemaVersion': 1,
      ...identityState().toJson(),
      'dogs': [dogRecord().toJson(), dogRecord().toJson()],
    }),
    jsonEncode({
      'schemaVersion': 1,
      ...identityState().toJson(),
      'dogs': [dogRecord(ownerId: 'other').toJson()],
    }),
  ]) {
    test('invalid identity fails closed and preserves bytes: $raw', () async {
      final storage = IdentityMemoryStorage();
      final repository = AppIdentityRepository(storage: storage);
      storage.values[repository.storageKey] = raw;
      final controller = AppIdentityController(repository: repository);
      await controller.load();
      expect(controller.loaded, isFalse);
      expect(controller.error, isNotNull);
      expect(await controller.replace(identityState()), isFalse);
      expect(storage.values[repository.storageKey], raw);
    });
  }
  for (final field in <String, Object?>{
    'displayName': '',
    'email': 'not-email',
    'trainingExperience': 'expert',
    'primaryGoal': 'unknown',
    'createdAt': 'invalid',
  }.entries) {
    test('invalid owner field ${field.key} fails closed', () async {
      final storage = IdentityMemoryStorage();
      final repository = AppIdentityRepository(storage: storage);
      final json = {
        'schemaVersion': 1,
        ...identityState().toJson(),
        'owner': {...ownerRecord().toJson(), field.key: field.value},
      };
      storage.values[repository.storageKey] = jsonEncode(json);
      await expectLater(
        repository.load(),
        throwsA(isA<AppIdentityPersistenceException>()),
      );
      expect(storage.values[repository.storageKey], jsonEncode(json));
    });
  }
  for (final field in <String, Object?>{
    'name': '',
    'breed': '',
    'dateOfBirth': '2023-02-30',
    'birthdayEstimated': true,
    'estimatedAgeYears': 31,
    'sex': 'invalid',
    'weightKg': 0,
    'weightUnit': 'stone',
    'energyLevel': 'invalid',
    'photoUri': '',
    'updatedAt': 'invalid',
  }.entries) {
    test('invalid dog field ${field.key} fails closed', () async {
      final storage = IdentityMemoryStorage();
      final repository = AppIdentityRepository(storage: storage);
      final json = {
        'schemaVersion': 1,
        ...identityState().toJson(),
        'dogs': [
          {...dogRecord().toJson(), field.key: field.value},
        ],
      };
      storage.values[repository.storageKey] = jsonEncode(json);
      await expectLater(
        repository.load(),
        throwsA(isA<AppIdentityPersistenceException>()),
      );
      expect(storage.values[repository.storageKey], jsonEncode(json));
    });
  }
  test('late load cannot restore previous dog data', () async {
    final storage = DelayedProgressStorage();
    final controller = LessonProgressController(
      repository: LessonProgressRepository(storage: storage),
    );
    final a = controller.loadForDog(ownerId: 'owner-1', dogId: 'dog-1');
    final b = controller.loadForDog(ownerId: 'owner-1', dogId: 'dog-2');
    storage.reads[1].complete(null);
    await b;
    storage.reads[0].complete('{corrupt old response');
    await a;
    expect(controller.dogId, 'dog-2');
    expect(controller.records, isEmpty);
    expect(controller.error, isNull);
    expect(controller.loading, isFalse);
  });
  test('clear invalidates pending progress', () async {
    final storage = DelayedProgressStorage();
    final controller = LessonProgressController(
      repository: LessonProgressRepository(storage: storage),
    );
    final load = controller.loadForDog(ownerId: 'owner-1', dogId: 'dog-1');
    controller.clear();
    storage.reads.single.complete(null);
    await load;
    expect(controller.dogId, isNull);
    expect(controller.records, isEmpty);
  });
}

class DelayedProgressStorage implements LessonProgressStringStorage {
  final reads = <Completer<String?>>[];
  @override
  Future<String?> read(String key) {
    final read = Completer<String?>();
    reads.add(read);
    return read.future;
  }

  @override
  Future<void> write(String key, String value) async {}
}
