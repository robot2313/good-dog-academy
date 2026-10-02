import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/main.dart';

void main() {
  testWidgets('Good Dog Academy Phase 2 shell renders', (tester) async {
    await tester.pumpWidget(const GoodDogAcademyApp());

    expect(find.text('Good Dog Academy'), findsOneWidget);
    expect(find.text('Today’s Plan'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Journey'), findsOneWidget);
    expect(find.text('Categories'), findsOneWidget);
    expect(find.text('Dogs'), findsOneWidget);
    expect(find.text('Progress'), findsOneWidget);
  });

  testWidgets('main navigation changes tabs', (tester) async {
    await tester.pumpWidget(const GoodDogAcademyApp());

    await tester.tap(find.text('Progress'));
    await tester.pumpAndSettle();

    expect(
      find.text('Training history and progress will be migrated here.'),
      findsOneWidget,
    );
  });
}
