import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/assessment/assessment_catalogue.dart';
import 'package:good_dog_academy/features/assessment/assessment_controller.dart';
import 'package:good_dog_academy/features/assessment/assessment_models.dart';
import 'package:good_dog_academy/features/assessment/assessment_repository.dart';
import 'package:good_dog_academy/features/assessment/assessment_scoring.dart';

import 'identity_fixtures.dart';

class _MemoryStorage implements AssessmentStringStorage {
  final values = <String, String>{};
  bool failWrite = false;

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    if (failWrite) throw StateError('write failed');
    values[key] = value;
  }
}

Map<String, AssessmentOption> _answers(AssessmentOption option) => <String, AssessmentOption>{
  for (final question in assessmentQuestions) question.id: option,
};

void main() {
  test('catalogue contains exactly one question per behaviour skill', () {
    expect(assessmentQuestions, hasLength(10));
    expect(assessmentQuestions.map((q) => q.id).toSet(), hasLength(10));
    expect(
      assessmentQuestions.map((q) => q.skill).toSet(),
      behaviourSkills.toSet(),
    );
  });

  test('positive and negative scoring matches React Native rules', () {
    final positive = assessmentQuestions.firstWhere(
      (q) => q.scoringDirection == ScoringDirection.positive,
    );
    final negative = assessmentQuestions.firstWhere(
      (q) => q.scoringDirection == ScoringDirection.negative,
    );
    expect(scoreQuestion(positive, AssessmentOption.never), 0);
    expect(scoreQuestion(positive, AssessmentOption.rarely), 25);
    expect(scoreQuestion(positive, AssessmentOption.sometimes), 50);
    expect(scoreQuestion(positive, AssessmentOption.often), 75);
    expect(scoreQuestion(positive, AssessmentOption.almostAlways), 100);
    expect(scoreQuestion(negative, AssessmentOption.never), 100);
    expect(scoreQuestion(negative, AssessmentOption.rarely), 75);
    expect(scoreQuestion(negative, AssessmentOption.sometimes), 50);
    expect(scoreQuestion(negative, AssessmentOption.often), 25);
    expect(scoreQuestion(negative, AssessmentOption.almostAlways), 0);
  });

  test('not sure remains neutral and marks every skill unknown', () {
    final result = calculateAssessmentScores(_answers(AssessmentOption.notSure));
    expect(result.calculatedScores.values, everyElement(50));
    expect(result.unknownSkills, behaviourSkills);
    expect(result.responses.every((item) => item.frequencyValue == null), isTrue);
  });

  test('incomplete answers fail closed', () {
    expect(
      () => calculateAssessmentScores(const <String, AssessmentOption>{}),
      throwsA(isA<AssessmentScoringException>()),
    );
  });

  test('completion persists assessment and matching profile atomically', () async {
    final storage = _MemoryStorage();
    final repository = AssessmentRepository(storage: storage);
    final controller = AssessmentController(repository: repository);
    await controller.loadForDog(ownerId: 'owner-1', dog: dogRecord());

    final saved = await controller.complete(
      ownerId: 'owner-1',
      dog: dogRecord(),
      answers: _answers(AssessmentOption.sometimes),
      now: DateTime.parse('2026-10-04T00:00:00Z'),
    );

    expect(saved, isTrue);
    expect(controller.completed, isTrue);
    final state = await repository.load();
    expect(state.assessments, hasLength(1));
    expect(state.profiles, hasLength(1));
    expect(state.profiles.single.assessmentId, state.assessments.single.id);
    expect(state.profiles.single.skillScores.values, everyElement(50));
  });

  test('failed write leaves previous assessment store unchanged', () async {
    final storage = _MemoryStorage();
    final repository = AssessmentRepository(storage: storage);
    final controller = AssessmentController(repository: repository);
    await controller.loadForDog(ownerId: 'owner-1', dog: dogRecord());
    await controller.complete(
      ownerId: 'owner-1',
      dog: dogRecord(),
      answers: _answers(AssessmentOption.sometimes),
      now: DateTime.parse('2026-10-04T00:00:00Z'),
    );
    final before = storage.values.values.single;
    storage.failWrite = true;

    final saved = await controller.complete(
      ownerId: 'owner-1',
      dog: dogRecord(),
      answers: _answers(AssessmentOption.often),
      now: DateTime.parse('2026-10-04T00:01:00Z'),
    );

    expect(saved, isFalse);
    expect(storage.values.values.single, before);
  });

  test('assessments remain isolated between dogs', () async {
    final storage = _MemoryStorage();
    final repository = AssessmentRepository(storage: storage);
    final first = AssessmentController(repository: repository);
    await first.loadForDog(ownerId: 'owner-1', dog: dogRecord());
    await first.complete(
      ownerId: 'owner-1',
      dog: dogRecord(),
      answers: _answers(AssessmentOption.sometimes),
      now: DateTime.parse('2026-10-04T00:00:00Z'),
    );

    final secondDog = dogRecord(id: 'dog-2', name: 'Pepper');
    final second = AssessmentController(repository: repository);
    await second.loadForDog(ownerId: 'owner-1', dog: secondDog);
    expect(second.completed, isFalse);
    await second.complete(
      ownerId: 'owner-1',
      dog: secondDog,
      answers: _answers(AssessmentOption.notSure),
      now: DateTime.parse('2026-10-04T00:02:00Z'),
    );

    final state = await repository.load();
    expect(state.assessments, hasLength(2));
    expect(state.profiles.map((p) => p.dogId).toSet(), {'dog-1', 'dog-2'});
  });
}
