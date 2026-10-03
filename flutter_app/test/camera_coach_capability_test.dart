import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/camera_coach_capability.dart';
import 'package:good_dog_academy/features/identity/app_identity_controller.dart';
import 'package:good_dog_academy/features/identity/app_identity_repository.dart';
import 'package:good_dog_academy/features/lessons/lesson_detail_screen.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_controller.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_repository.dart';

import 'identity_fixtures.dart';

class _ProgressStorage implements LessonProgressStringStorage {
  final values = <String, String>{};

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

Future<(AppIdentityController, LessonProgressController)> _controllers() async {
  final identityRepository = AppIdentityRepository(
    storage: IdentityMemoryStorage(),
  );
  await identityRepository.save(identityState());
  final identity = AppIdentityController(repository: identityRepository);
  await identity.load();

  final progress = LessonProgressController(
    repository: LessonProgressRepository(storage: _ProgressStorage()),
  );
  await progress.loadForDog(ownerId: 'owner-1', dogId: 'dog-1');

  return (identity, progress);
}

Widget _detailApp({
  required AppIdentityController identity,
  required LessonProgressController progress,
  required bool withCameraCoach,
  required void Function() onFactoryRequested,
}) {
  Widget detail = const LessonDetailScreen(
    lessonId: 'recall-name-response',
  );

  if (withCameraCoach) {
    detail = CameraCoachCapabilityScope(
      visionEngineFactory: () {
        onFactoryRequested();
        throw StateError('Vision engine should not start during lesson render.');
      },
      child: detail,
    );
  }

  return MaterialApp(
    home: AppIdentityScope(
      controller: identity,
      child: LessonProgressScope(
        controller: progress,
        child: detail,
      ),
    ),
  );
}

void main() {
  testWidgets('lesson hides Camera Coach without production capability', (
    tester,
  ) async {
    final controllers = await _controllers();

    await tester.pumpWidget(
      _detailApp(
        identity: controllers.$1,
        progress: controllers.$2,
        withCameraCoach: false,
        onFactoryRequested: () {},
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Start Lesson'), findsOneWidget);
    expect(find.text('Train with Camera Coach'), findsNothing);

    controllers.$1.dispose();
    controllers.$2.dispose();
  });

  testWidgets('registered production capability exposes Camera Coach lazily', (
    tester,
  ) async {
    final controllers = await _controllers();
    var factoryCalls = 0;

    await tester.pumpWidget(
      _detailApp(
        identity: controllers.$1,
        progress: controllers.$2,
        withCameraCoach: true,
        onFactoryRequested: () => factoryCalls++,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Train with Camera Coach'), findsOneWidget);
    expect(factoryCalls, 0);

    controllers.$1.dispose();
    controllers.$2.dispose();
  });
}
