import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/app/good_dog_academy_app.dart';

void main() {
  testWidgets('boots the Flutter migration shell', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: GoodDogAcademyApp()),
    );
    await tester.pumpAndSettle();

    expect(find.text('Good Dog Academy'), findsOneWidget);
    expect(find.text('Trainer in your pocket'), findsOneWidget);
  });
}
