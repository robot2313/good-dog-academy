import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/identity/app_identity_controller.dart';
import 'package:good_dog_academy/features/identity/app_identity_record.dart';
import 'package:good_dog_academy/features/identity/app_identity_repository.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_controller.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_repository.dart';
import 'package:good_dog_academy/main.dart';

import 'identity_fixtures.dart';
import 'learning_passport_test.dart' show passportRecord;

class AppMemoryStorage
    implements AppIdentityStringStorage, LessonProgressStringStorage {
  final values = <String, String>{};
  bool fail = false;
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String value) async {
    if (fail) throw StateError('storage failure');
    values[key] = value;
  }
}

Future<void> enter(WidgetTester tester, String key, String text) async {
  final field = find.byKey(ValueKey(key));
  await tester.ensureVisible(field);
  await tester.pumpAndSettle();
  await tester.enterText(field, text);
}

Future<void> choose(WidgetTester tester, String key, String text) async {
  final field = find.byKey(ValueKey(key));
  await tester.ensureVisible(field);
  await tester.pumpAndSettle();
  await tester.tap(field);
  await tester.pumpAndSettle();
  await tester.tap(find.text(text).last);
  await tester.pumpAndSettle();
}

void main() {
  testWidgets(
    'full setup retries failed save, reaches Home, and restores selected dog',
    (tester) async {
      final storage = AppMemoryStorage();
      final repo = AppIdentityRepository(storage: storage);
      final identity = AppIdentityController(repository: repo);
      final progress = LessonProgressController(
        repository: LessonProgressRepository(storage: storage),
      );
      await identity.load();
      await tester.pumpWidget(
        GoodDogAcademyApp(
          identityController: identity,
          progressController: progress,
        ),
      );
      await tester.tap(find.text('Get started'));
      await tester.pumpAndSettle();
      await enter(tester, 'displayName', 'Roger');
      await choose(tester, 'experience', 'beginner');
      await choose(tester, 'goal', 'family companion');
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      await enter(tester, 'name', 'Scout');
      await enter(tester, 'breed', 'Kelpie');
      await enter(tester, 'birthday', '2023-05-10');
      await choose(tester, 'sex', 'female');
      await enter(tester, 'weight', '18');
      await choose(tester, 'energy', 'high');
      await tester.ensureVisible(find.text('Complete setup'));
      storage.fail = true;
      await tester.tap(find.text('Complete setup'));
      await tester.pumpAndSettle();
      expect(identity.selectedDog, isNull);
      expect(storage.values, isEmpty);
      expect(
        find.text('Your profile could not be saved. Please try again.'),
        findsOneWidget,
      );
      storage.fail = false;
      await tester.ensureVisible(find.text('Complete setup'));
      await tester.tap(find.text('Complete setup'));
      await tester.pumpAndSettle();
      expect(find.text('Hello, Roger'), findsOneWidget);
      expect(find.text('Training with Scout'), findsOneWidget);
      final relaunched = AppIdentityController(repository: repo);
      await relaunched.load();
      expect(relaunched.selectedDogId, identity.selectedDogId);
      expect(relaunched.selectedDog!.name, 'Scout');
    },
  );

  testWidgets(
    'Passport switches independent dogs, relaunches, and selector failure retains dog',
    (tester) async {
      final storage = AppMemoryStorage();
      final repo = AppIdentityRepository(storage: storage);
      await repo.save(
        AppIdentityState(
          owner: ownerRecord(),
          dogs: [
            dogRecord(),
            dogRecord(id: 'dog-2', name: 'Pepper'),
          ],
          selectedDogId: 'dog-1',
        ),
      );
      final progressRepo = LessonProgressRepository(storage: storage);
      await progressRepo.save(passportRecord());
      await progressRepo.save(passportRecord(dogId: 'dog-2', completions: 0));
      final identity = AppIdentityController(repository: repo);
      final progress = LessonProgressController(repository: progressRepo);
      await identity.load();
      await tester.pumpWidget(
        GoodDogAcademyApp(
          identityController: identity,
          progressController: progress,
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Progress'));
      await tester.pumpAndSettle();
      expect(find.text('Scout’s Learning Passport'), findsOneWidget);
      expect(find.text('1 of 60 lessons complete'), findsOneWidget);
      await identity.selectDog('dog-2');
      expect(progress.records, isEmpty);
      await tester.pumpAndSettle();
      expect(find.text('Pepper’s Learning Passport'), findsOneWidget);
      expect(find.text('0 of 60 lessons complete'), findsOneWidget);
      expect(find.text('0% complete · 1 in progress'), findsOneWidget);
      expect(progress.records.every((r) => r.dogId == 'dog-2'), isTrue);
      final relaunched = AppIdentityController(repository: repo);
      await relaunched.load();
      expect(relaunched.selectedDogId, 'dog-2');
      await identity.selectDog('dog-1');
      await tester.pumpAndSettle();
      expect(find.text('1 of 60 lessons complete'), findsOneWidget);
      expect(progress.records.every((r) => r.dogId == 'dog-1'), isTrue);
      await tester.tap(find.text('Home'));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Choose active dog'));
      await tester.pumpAndSettle();
      storage.fail = true;
      await tester.tap(find.text('Pepper'));
      await tester.pumpAndSettle();
      expect(identity.selectedDogId, 'dog-1');
      expect(
        find.text(
          'Your selection could not be saved. Your previous dog remains active. Try again.',
        ),
        findsOneWidget,
      );
      storage.fail = false;
      await tester.tap(find.text('Pepper'));
      await tester.pumpAndSettle();
      expect(identity.selectedDogId, 'dog-2');
      expect((await repo.load()).selectedDogId, 'dog-2');
    },
  );

  testWidgets(
    'corrupt identity never becomes onboarding and retry can recover',
    (tester) async {
      final storage = AppMemoryStorage();
      final repo = AppIdentityRepository(storage: storage);
      storage.values[repo.storageKey] = '{corrupt';
      final identity = AppIdentityController(repository: repo);
      await identity.load();
      final progress = LessonProgressController(
        repository: LessonProgressRepository(storage: storage),
      );
      await tester.pumpWidget(
        GoodDogAcademyApp(
          identityController: identity,
          progressController: progress,
        ),
      );
      expect(
        find.text('Your saved dog profile could not be loaded safely.'),
        findsOneWidget,
      );
      expect(find.text('Get started'), findsNothing);
      expect(storage.values[repo.storageKey], '{corrupt');
      await repo.save(identityState());
      await tester.tap(find.text('Try again'));
      await tester.pumpAndSettle();
      expect(find.text('Training with Scout'), findsOneWidget);
    },
  );
  testWidgets(
    'no selection asks user and corrupted progress shows error, not empty',
    (tester) async {
      final storage = AppMemoryStorage();
      final repo = AppIdentityRepository(storage: storage);
      await repo.save(
        AppIdentityState(
          owner: ownerRecord(),
          dogs: [dogRecord()],
          selectedDogId: null,
        ),
      );
      final identity = AppIdentityController(repository: repo);
      await identity.load();
      final progressRepo = LessonProgressRepository(storage: storage);
      storage.values[progressRepo.storageKey] = '{corrupt';
      final progress = LessonProgressController(repository: progressRepo);
      await tester.pumpWidget(
        GoodDogAcademyApp(
          identityController: identity,
          progressController: progress,
        ),
      );
      expect(find.text('Choose your active dog'), findsOneWidget);
      expect(progress.dogId, isNull);
      await tester.tap(find.text('Scout'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Progress'));
      await tester.pumpAndSettle();
      expect(
        find.text('Training progress could not be loaded safely.'),
        findsOneWidget,
      );
      expect(
        find.text('No lesson progress has been recorded for this dog yet.'),
        findsNothing,
      );
      expect(storage.values[progressRepo.storageKey], '{corrupt');
    },
  );
}
