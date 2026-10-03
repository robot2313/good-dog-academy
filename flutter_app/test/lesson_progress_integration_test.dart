import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_controller.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_record.dart';
import 'package:good_dog_academy/features/lessons/progress/lesson_progress_repository.dart';
import 'package:good_dog_academy/main.dart';

void main() {
  testWidgets(
    'persisted completion appears in Journey',
    (tester) async {
      final controller = await _controllerWith(
        <LessonProgressRecord>[
          _completedRecall(),
        ],
      );

      await tester.pumpWidget(
        GoodDogAcademyApp(
          progressController: controller,
        ),
      );

      await tester.tap(
        find.text('Journey'),
      );
      await tester.pumpAndSettle();

      await tester.scrollUntilVisible(
        find.text('1 of 60 lessons complete'),
        300,
      );

      expect(
        find.text('1 of 60 lessons complete'),
        findsOneWidget,
      );
    },
  );

  testWidgets(
    'persisted completion changes Recall browser unlock state',
    (tester) async {
      final controller = await _controllerWith(
        <LessonProgressRecord>[
          _completedRecall(),
        ],
      );

      await tester.pumpWidget(
        GoodDogAcademyApp(
          progressController: controller,
        ),
      );

      await tester.tap(
        find.text('Categories'),
      );
      await tester.pumpAndSettle();

      await tester.tap(
        find.text('Recall'),
      );
      await tester.pumpAndSettle();

      expect(
        find.bySemanticsLabel(
          RegExp(r'Name Response.*Completed'),
        ),
        findsOneWidget,
      );

      expect(
        find.bySemanticsLabel(
          RegExp(r'Short-Distance Recall.*Available'),
        ),
        findsOneWidget,
      );
    },
  );

  testWidgets(
    'multiple dog identities fail closed in Journey',
    (tester) async {
      final storage = _MemoryStorage();
      final repository = LessonProgressRepository(
        storage: storage,
      );

      await repository.save(
        _completedRecall(),
      );

      await repository.save(
        _completedRecall(
          id: 'progress-dog-2',
          dogId: 'dog-2',
        ),
      );

      final controller = LessonProgressController(
        repository: repository,
      );

      await controller.load();

      expect(
        controller.error,
        isA<LessonProgressSelectionException>(),
      );

      await tester.pumpWidget(
        GoodDogAcademyApp(
          progressController: controller,
        ),
      );

      await tester.tap(
        find.text('Journey'),
      );
      await tester.pumpAndSettle();

      expect(
        find.text(
          'Training progress could not be loaded safely.',
        ),
        findsOneWidget,
      );

      expect(
        find.text(
          'No saved training data was changed.',
        ),
        findsOneWidget,
      );
    },
  );
}

Future<LessonProgressController> _controllerWith(
  List<LessonProgressRecord> records,
) async {
  final repository = LessonProgressRepository(
    storage: _MemoryStorage(),
  );

  for (final record in records) {
    await repository.save(record);
  }

  final controller = LessonProgressController(
    repository: repository,
  );

  await controller.load();

  return controller;
}

LessonProgressRecord _completedRecall({
  String id = 'progress-recall-1',
  String dogId = 'dog-1',
}) {
  return LessonProgressRecord(
    id: id,
    ownerId: 'owner-1',
    dogId: dogId,
    lessonId: 'recall-name-response',
    status: LessonProgressStatus.completed,
    attempts: 1,
    successfulCompletions: 1,
    lastAttemptedAt:
        '2026-10-03T05:00:00.000Z',
    lastCompletedAt:
        '2026-10-03T05:00:00.000Z',
    bestPerformanceRating: 4,
    currentDifficultyAdjustment: 0,
    unlockedAt:
        '2026-10-03T04:00:00.000Z',
    createdAt:
        '2026-10-03T04:00:00.000Z',
    updatedAt:
        '2026-10-03T05:00:00.000Z',
  );
}

class _MemoryStorage
    implements LessonProgressStringStorage {
  final Map<String, String> values =
      <String, String>{};

  @override
  Future<String?> read(String key) async {
    return values[key];
  }

  @override
  Future<void> write(
    String key,
    String value,
  ) async {
    values[key] = value;
  }
}
