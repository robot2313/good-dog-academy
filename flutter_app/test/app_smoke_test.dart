import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/main.dart';

void main() {
  testWidgets('Good Dog Academy Flutter shell renders', (tester) async {
    await tester.pumpWidget(const GoodDogAcademyApp());

    expect(find.text('Good Dog Academy'), findsOneWidget);
    expect(find.text('Flutter migration shell'), findsOneWidget);
    expect(find.text('Phase 1'), findsOneWidget);
  });
}
