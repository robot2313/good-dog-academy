import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/pose_shadow_validation.dart';
import 'package:good_dog_academy/features/camera_coach/services/pose_shadow_validation_repository.dart';

class _MemoryStorage implements PoseShadowValidationStringStorage {
  final values = <String, String>{};

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

PersistedPoseShadowValidationSample _sample(
  String id, {
  String dogId = 'dog-1',
  PoseShadowGroundTruth groundTruth = PoseShadowGroundTruth.sitLike,
  double confidence = 0.93,
}) {
  return PersistedPoseShadowValidationSample(
    id: id,
    dogId: dogId,
    lessonId: 'sit-1',
    expectedPosture: DogPosture.sitLike,
    predictedPosture: DogPosture.sitLike,
    confidence: confidence,
    groundTruth: groundTruth,
    recordedAt: '2026-10-04T10:00:' + id + '.000Z',
  );
}

void main() {
  test('persists per-dog samples and deduplicates by id', () async {
    final storage = _MemoryStorage();
    final repository = PoseShadowValidationRepository(storage: storage);

    await repository.record(_sample('01'));
    await repository.record(_sample('01', confidence: 0.97));
    await repository.record(_sample('02', dogId: 'dog-2'));

    final dogOne = await repository.loadForDog('dog-1');
    final dogTwo = await repository.loadForDog('dog-2');

    expect(dogOne, hasLength(1));
    expect(dogOne.single.confidence, 0.97);
    expect(dogTwo, hasLength(1));
  });

  test('stores no-dog and unsure labels without training outcomes', () async {
    final storage = _MemoryStorage();
    final repository = PoseShadowValidationRepository(storage: storage);

    await repository.record(
      _sample('01', groundTruth: PoseShadowGroundTruth.noDog),
    );
    await repository.record(
      _sample('02', groundTruth: PoseShadowGroundTruth.unsure),
    );

    final samples = await repository.loadForDog('dog-1');

    expect(
      samples.firstWhere((sample) => sample.id == '01').groundTruth,
      PoseShadowGroundTruth.noDog,
    );
    expect(
      samples.firstWhere((sample) => sample.id == '02').groundTruth,
      PoseShadowGroundTruth.unsure,
    );
  });

  test('corrupt stored samples are ignored rather than trusted', () async {
    final storage = _MemoryStorage();
    final repository = PoseShadowValidationRepository(storage: storage);

    await repository.record(_sample('01'));
    final key = PoseShadowValidationRepository.storageKey;
    final raw = storage.values[key]!;
    storage.values[key] = raw.replaceFirst(
      '"dogs":{',
      '"dogs":{"broken":[{"bad":true}],',
    );

    final samples = await repository.loadForDog('dog-1');

    expect(samples, hasLength(1));
  });

  test('reports each posture independently', () async {
    final storage = _MemoryStorage();
    final repository = PoseShadowValidationRepository(storage: storage);

    for (var index = 0; index < 50; index++) {
      final suffix = index.toString().padLeft(2, '0');
      final recordedAt = DateTime.utc(
        2026,
        10,
        4,
        10,
        index % 60,
        (index ~/ 60) % 60,
      ).toIso8601String();
      await repository.record(
        PersistedPoseShadowValidationSample(
          id: 'sit-' + suffix,
          dogId: 'dog-1',
          lessonId: 'sit-1',
          expectedPosture: DogPosture.sitLike,
          predictedPosture: DogPosture.sitLike,
          confidence: 0.95,
          groundTruth: PoseShadowGroundTruth.sitLike,
          recordedAt: recordedAt,
        ),
      );
    }

    final summary = await repository.loadSummary('dog-1');

    expect(
      summary.byPosture[DogPosture.sitLike]!.shadowQualityGatePassed,
      isTrue,
    );
    expect(summary.posturesPassingShadowGate, 1);
    expect(summary.allPosturesPassShadowGate, isFalse);
    expect(summary.productionAutoScoringEnabled, isFalse);
  });

  test('caps persisted samples per dog at 500', () async {
    final storage = _MemoryStorage();
    final repository = PoseShadowValidationRepository(storage: storage);

    for (var index = 0; index < 505; index++) {
      final recordedAt = DateTime.utc(2026, 10, 4)
          .add(Duration(seconds: index))
          .toIso8601String();
      await repository.record(
        PersistedPoseShadowValidationSample(
          id: 'sample-' + index.toString(),
          dogId: 'dog-1',
          lessonId: 'sit-1',
          expectedPosture: DogPosture.sitLike,
          predictedPosture: DogPosture.sitLike,
          confidence: 0.95,
          groundTruth: PoseShadowGroundTruth.sitLike,
          recordedAt: recordedAt,
        ),
      );
    }

    expect(await repository.loadForDog('dog-1'), hasLength(500));
  });
}
