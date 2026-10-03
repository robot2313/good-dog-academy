import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/assessment/assessment_catalogue.dart';
import 'package:good_dog_academy/features/assessment/assessment_controller.dart';
import 'package:good_dog_academy/features/assessment/assessment_repository.dart';
import 'package:good_dog_academy/features/identity/app_identity_controller.dart';
import 'package:good_dog_academy/features/identity/app_identity_repository.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_controller.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_repository.dart';
import 'package:good_dog_academy/main.dart';

import 'identity_fixtures.dart';

class _AssessmentMemoryStorage implements AssessmentStringStorage {
  final values = <String, String>{};

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

class _ProgressMemoryStorage implements LessonProgressStringStorage {
  final values = <String, String>{};

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

void main() {
  testWidgets('configured dog is routed to required behaviour assessment', (tester) async {
    final identityRepository = AppIdentityRepository(
      storage: IdentityMemoryStorage(),
    );
    await identityRepository.save(identityState());
    final identity = AppIdentityController(repository: identityRepository);
    await identity.load();

    final progress = LessonProgressController(
      repository: LessonProgressRepository(storage: _ProgressMemoryStorage()),
    );
    final assessment = AssessmentController(
      repository: AssessmentRepository(storage: _AssessmentMemoryStorage()),
    );

    await tester.pumpWidget(
      GoodDogAcademyApp(
        identityController: identity,
        progressController: progress,
        assessmentController: assessment,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Let’s understand Scout.'), findsOneWidget);
    expect(find.text('Start Assessment'), findsOneWidget);
  });

  testWidgets('completing assessment reaches main application', (tester) async {
    final identityRepository = AppIdentityRepository(
      storage: IdentityMemoryStorage(),
    );
    await identityRepository.save(identityState());
    final identity = AppIdentityController(repository: identityRepository);
    await identity.load();

    final progress = LessonProgressController(
      repository: LessonProgressRepository(storage: _ProgressMemoryStorage()),
    );
    final assessment = AssessmentController(
      repository: AssessmentRepository(storage: _AssessmentMemoryStorage()),
    );

    await tester.pumpWidget(
      GoodDogAcademyApp(
        identityController: identity,
        progressController: progress,
        assessmentController: assessment,
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Start Assessment'));
    await tester.pumpAndSettle();

    for (var section = 0; section < 3; section++) {
      final questions = questionsForSection(AssessmentSection.values[section]);
      for (final question in questions) {
        await tester.ensureVisible(find.text(question.text));
        final option = find.byKey(
          ValueKey('${question.id}-sometimes'),
        );
        await tester.ensureVisible(option);
        await tester.tap(option);
        await tester.pump();
      }
      await tester.ensureVisible(find.text('Continue'));
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
    }

    expect(find.text('Scout’s starting profile'), findsOneWidget);
    await tester.tap(find.text('Complete Assessment'));
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsWidgets);
    expect(assessment.completed, isTrue);
  });
}
