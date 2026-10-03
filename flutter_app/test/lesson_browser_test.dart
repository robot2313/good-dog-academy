import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/lessons/data/lesson_collections.dart';
import 'package:good_dog_academy/features/lessons/data/production_lessons.dart';
import 'package:good_dog_academy/main.dart';

void main() {
  test('life-stage collections match the migrated discovery baseline', () {
    final productionIds = productionLessons
        .map((lesson) => lesson.id)
        .toSet();

    final expectedCounts = <String, int>{
      'puppy': 18,
      'adult': 18,
      'senior': 15,
      'rescue': 18,
    };

    expect(lessonCollections, hasLength(4));

    for (final collection in lessonCollections) {
      expect(
        collection.lessonIds,
        hasLength(expectedCounts[collection.id]!),
      );

      for (final lessonId in collection.lessonIds) {
        expect(
          productionIds.contains(lessonId),
          isTrue,
          reason:
              '${collection.id} references missing lesson $lessonId',
        );
      }
    }
  });

  testWidgets(
    'category card opens real lesson browser and filters by difficulty',
    (tester) async {
      await tester.pumpWidget(const GoodDogAcademyApp());

      await tester.tap(find.text('Categories'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('House Training'));
      await tester.pumpAndSettle();

      expect(
        find.text('6 of 6 lessons'),
        findsOneWidget,
      );

      expect(
        find.text('Build a Toileting Routine'),
        findsOneWidget,
      );

      await tester.tap(find.text('Advanced'));
      await tester.pumpAndSettle();

      expect(
        find.text('1 of 6 lessons'),
        findsOneWidget,
      );

      expect(
        find.text('Toileting in New Places and Weather'),
        findsOneWidget,
      );

      expect(
        find.text('Build a Toileting Routine'),
        findsNothing,
      );
    },
  );

  testWidgets(
    'life-stage card opens its real lesson collection',
    (tester) async {
      await tester.pumpWidget(const GoodDogAcademyApp());

      await tester.tap(find.text('Dogs'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Puppy'));
      await tester.pumpAndSettle();

      expect(
        find.text('18 of 18 lessons'),
        findsOneWidget,
      );

      expect(
        find.textContaining('Up to about 12 months'),
        findsOneWidget,
      );
    },
  );
}
