import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/journey/journey_screen.dart';
import 'package:good_dog_academy/features/lessons/data/production_lessons.dart';
import 'package:good_dog_academy/features/lessons/domain/lesson_models.dart';
import 'package:good_dog_academy/features/lessons/logic/lesson_unlock_service.dart';
import 'package:good_dog_academy/main.dart';

void main() {
  test('journey stages match production difficulty distribution', () {
    final lessons = const LessonUnlockService(
      productionLessons,
    ).resolve(
      const <LessonProgressSnapshot>[],
    ).values.toList(growable: false);

    final stages = createJourneyStages(
      lessons,
    );

    expect(stages, hasLength(4));

    expect(
      stages.map((stage) => stage.title).toList(),
      <String>[
        'Foundation',
        'Building Skills',
        'Real World',
        'Lifelong Skills',
      ],
    );

    expect(
      stages.map((stage) => stage.lessons.length).toList(),
      <int>[10, 20, 20, 10],
    );
  });

  testWidgets(
    'Journey tab renders real four-stage lesson journey',
    (tester) async {
      await tester.pumpWidget(
        const GoodDogAcademyApp(),
      );

      await tester.tap(
        find.text('Journey'),
      );
      await tester.pumpAndSettle();

      expect(
        find.text('Your Journey'),
        findsOneWidget,
      );

      expect(
        find.text('Stage 1: Foundation'),
        findsOneWidget,
      );

      expect(
        find.text('Stage 2: Building Skills'),
        findsOneWidget,
      );

      expect(
        find.text('Stage 3: Real World'),
        findsOneWidget,
      );

      expect(
        find.text('Stage 4: Lifelong Skills'),
        findsOneWidget,
      );

      expect(
        find.text('0 of 60 lessons complete'),
        findsOneWidget,
      );
    },
  );

  testWidgets(
    'View Full Journey expands later stages',
    (tester) async {
      await tester.pumpWidget(
        const GoodDogAcademyApp(),
      );

      await tester.tap(
        find.text('Journey'),
      );
      await tester.pumpAndSettle();

      expect(
        find.text('Build a Toileting Routine'),
        findsOneWidget,
      );

      await tester.scrollUntilVisible(
        find.text('View Full Journey'),
        300,
      );

      await tester.tap(
        find.text('View Full Journey'),
      );
      await tester.pumpAndSettle();

      await tester.scrollUntilVisible(
        find.text('Maintain Real-World Recall'),
        300,
      );

      expect(
        find.text('Maintain Real-World Recall'),
        findsOneWidget,
      );
    },
  );
}
