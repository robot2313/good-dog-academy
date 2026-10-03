import 'package:good_dog_academy/features/identity/app_identity_record.dart';
import 'package:good_dog_academy/features/identity/app_identity_repository.dart';

AppIdentityState identityState() {
  return AppIdentityState(
    owner: ownerRecord(),
    dogs: <AppDogRecord>[dogRecord()],
    selectedDogId: 'dog-1',
  );
}

AppOwnerRecord ownerRecord() {
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

AppDogRecord dogRecord({
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

class IdentityMemoryStorage implements AppIdentityStringStorage {
  bool failWrite = false;
  final Map<String, String> values = <String, String>{};

  @override
  Future<String?> read(String key) async {
    return values[key];
  }

  @override
  Future<void> write(String key, String value) async {
    if (failWrite) throw StateError('write failed');
    values[key] = value;
  }
}
