import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/main.dart';

void main() {
  testWidgets(
    'Categories tab renders production discovery categories',
    (tester) async {
      await tester.pumpWidget(const GoodDogAcademyApp());

      await tester.tap(find.text('Categories'));
      await tester.pumpAndSettle();

      expect(find.text('House Training'), findsOneWidget);
      expect(find.text('Chewing'), findsOneWidget);
      expect(find.text('Barking'), findsOneWidget);
      expect(find.text('Jumping Up'), findsOneWidget);
      expect(find.text('Recall'), findsOneWidget);
      expect(find.text('Loose-Lead Walking'), findsOneWidget);
      expect(find.text('Focus'), findsOneWidget);
      expect(find.text('Impulse Control'), findsOneWidget);
      expect(find.text('Confidence'), findsOneWidget);
      expect(find.text('Reactivity'), findsOneWidget);
    },
  );

  testWidgets(
    'Dogs tab renders production life-stage collections',
    (tester) async {
      await tester.pumpWidget(const GoodDogAcademyApp());

      await tester.tap(find.text('Dogs'));
      await tester.pumpAndSettle();

      expect(find.text('Training by Life Stage'), findsOneWidget);
      expect(find.text('Puppy'), findsOneWidget);
      expect(find.text('Adult Dog'), findsOneWidget);
      expect(find.text('Senior Dog'), findsOneWidget);
      expect(find.text('Rescue Dog'), findsOneWidget);
    },
  );
}
