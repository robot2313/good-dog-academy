import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/onboarding/onboarding_draft.dart';
import 'package:good_dog_academy/features/identity/app_identity_record.dart';
import 'package:good_dog_academy/features/identity/app_identity_controller.dart';
import 'package:good_dog_academy/features/identity/app_identity_repository.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_controller.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_repository.dart';
import 'package:good_dog_academy/main.dart';

import 'identity_fixtures.dart';
import 'active_dog_test.dart' show DelayedProgressStorage;

OnboardingDraft validDraft() => OnboardingDraft()
  ..displayName = ' Alex '
  ..experience = TrainingExperience.beginner
  ..goal = PrimaryGoal.familyCompanion
  ..name = ' Scout '
  ..breedUnknown = true
  ..birthday = '2023-05-10'
  ..sex = DogSex.unknown
  ..weight = '20'
  ..energy = DogEnergyLevel.medium;
void main() {
  test('all required selections and fields are validated', () {
    final draft = OnboardingDraft();
    expect(
      draft.ownerErrors().keys,
      containsAll(['displayName', 'experience', 'goal']),
    );
    expect(
      draft.dogErrors().keys,
      containsAll(['name', 'breed', 'birthday', 'sex', 'weight', 'energy']),
    );
  });
  test('owner optional email and required name match domain', () {
    final draft = validDraft();
    expect(draft.ownerErrors(), isEmpty);
    draft.email = 'invalid';
    expect(draft.ownerErrors(), contains('email'));
    draft.email = ' alex@example.com ';
    expect(draft.ownerErrors(), isEmpty);
    draft.displayName = ' ';
    expect(draft.ownerErrors(), contains('displayName'));
  });
  test('birthday rejects invalid calendar dates and future dates', () {
    final draft = validDraft();
    for (final date in [
      '',
      '2023-02-29',
      '2024-02-30',
      '2024-13-01',
      '2999-01-01',
    ]) {
      draft.birthday = date;
      expect(draft.dogErrors(), contains('birthday'), reason: date);
    }
    draft.birthday = '2024-02-29';
    expect(draft.dogErrors(), isEmpty);
  });
  test('estimated age range and conditional birthday semantics', () {
    final draft = validDraft()..birthdayEstimated = true;
    for (final age in ['', '0', '-1', '31', 'NaN', 'Infinity']) {
      draft.estimatedAge = age;
      expect(draft.dogErrors(), contains('estimatedAge'));
    }
    draft.estimatedAge = '0.25';
    draft.birthday = 'invalid unused birthday';
    expect(draft.dogErrors(), isEmpty);
    final dog = draft
        .complete(ownerId: 'o', dogId: 'd', timestamp: '2026-01-01T00:00:00Z')
        .selectedDog!;
    expect(dog.dateOfBirth, isNull);
    expect(dog.estimatedAgeYears, .25);
  });
  test('weight required, finite, positive, capped and converted to kg', () {
    final draft = validDraft();
    for (final weight in ['', '0', '-1', '151', 'NaN', 'Infinity']) {
      draft.weight = weight;
      expect(draft.dogErrors(), contains('weight'));
    }
    draft.weightUnit = WeightUnit.lb;
    draft.weight = '330';
    expect(draft.dogErrors(), isEmpty);
    final dog = draft
        .complete(ownerId: 'o', dogId: 'd', timestamp: '2026-01-01T00:00:00Z')
        .selectedDog!;
    expect(dog.weightKg, closeTo(149.6854821, .000001));
    expect(dog.weightUnit, WeightUnit.lb);
    draft.weight = '331';
    expect(draft.dogErrors(), contains('weight'));
  });
  test('completion preserves owner for owner-only recovery', () {
    final state = validDraft().complete(
      existingOwner: ownerRecord(),
      ownerId: 'unused',
      dogId: 'new-dog',
      timestamp: '2026-01-01T00:00:00Z',
    );
    expect(state.owner!.id, 'owner-1');
    expect(state.selectedDog!.ownerId, 'owner-1');
    expect(state.selectedDogId, 'new-dog');
    expect(state.selectedDog!.photoUri, isNull);
  });
  test(
    'completion failure stays empty and successful retry restores on relaunch',
    () async {
      final storage = IdentityMemoryStorage();
      final repo = AppIdentityRepository(storage: storage);
      final controller = AppIdentityController(repository: repo);
      await controller.load();
      final state = validDraft().complete(
        ownerId: 'o',
        dogId: 'd',
        timestamp: '2026-01-01T00:00:00Z',
      );
      storage.failWrite = true;
      expect(await controller.replace(state), isFalse);
      expect(controller.owner, isNull);
      expect(storage.values, isEmpty);
      storage.failWrite = false;
      expect(await controller.replace(state), isTrue);
      final next = AppIdentityController(repository: repo);
      await next.load();
      expect(next.selectedDog!.name, 'Scout');
      expect(next.owner!.displayName, 'Alex');
    },
  );
  testWidgets('first launch welcome routes to validated owner and dog setup', (
    tester,
  ) async {
    final identity = AppIdentityController(
      repository: AppIdentityRepository(storage: IdentityMemoryStorage()),
    );
    await identity.load();
    final progress = LessonProgressController(
      repository: LessonProgressRepository(storage: DelayedProgressStorage()),
    );
    await tester.pumpWidget(
      GoodDogAcademyApp(
        identityController: identity,
        progressController: progress,
      ),
    );
    expect(find.text('Get started'), findsOneWidget);
    await tester.tap(find.text('Get started'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.text('Enter your name.'), findsOneWidget);
    await tester.enterText(find.byKey(const ValueKey('displayName')), 'Alex');
    await tester.tap(find.byKey(const ValueKey('experience')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('beginner').last);
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('goal')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('family companion').last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.text('Tell us about your dog'), findsOneWidget);
    expect(identity.owner, isNull);
  });
}
