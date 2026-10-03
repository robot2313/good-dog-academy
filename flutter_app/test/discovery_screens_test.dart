import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/discovery/discovery_data.dart';
import 'package:good_dog_academy/main.dart';

void main() {
  test('production discovery data contains all training categories', () {
    expect(trainingCategories.map((category) => category.label).toList(), [
      'House Training',
      'Chewing',
      'Barking',
      'Jumping Up',
      'Recall',
      'Loose-Lead Walking',
      'Focus',
      'Impulse Control',
      'Confidence',
      'Reactivity',
    ]);

    expect(
      trainingCategories.every((category) => category.lessonCount == 6),
      isTrue,
    );
  });

  testWidgets(
    'Categories tab renders and scrolls production discovery categories',
    (tester) async {
      await tester.pumpWidget(const GoodDogAcademyApp());

      await tester.tap(find.text('Categories'));
      await tester.pumpAndSettle();

      expect(find.text('House Training'), findsOneWidget);

      await tester.scrollUntilVisible(find.text('Loose-Lead Walking'), 300);
      expect(find.text('Loose-Lead Walking'), findsOneWidget);

      await tester.scrollUntilVisible(find.text('Reactivity'), 300);
      expect(find.text('Reactivity'), findsOneWidget);
    },
  );

  testWidgets('Dogs tab renders production life-stage collections', (
    tester,
  ) async {
    await tester.pumpWidget(const GoodDogAcademyApp());

    await tester.tap(find.text('Dogs'));
    await tester.pumpAndSettle();

    expect(find.text('Training by Life Stage'), findsOneWidget);
    expect(find.text('Puppy'), findsOneWidget);
    expect(find.text('Adult Dog'), findsOneWidget);
    expect(find.text('Senior Dog'), findsOneWidget);
    expect(find.text('Rescue Dog'), findsOneWidget);
  });
}
