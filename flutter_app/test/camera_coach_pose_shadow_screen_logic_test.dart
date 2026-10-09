import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/pose_shadow_calibration_screen.dart';

void main() {
  test('green target box is restricted to fresh confirmed tracks', () {
    const box = NormalizedDogBox(left: .1, top: .2, width: .3, height: .4);
    for (final state in DogTrackingState.values) {
      expect(
        qaVisibleDogBox(box, state),
        state == DogTrackingState.acquired || state == DogTrackingState.tracking
            ? same(box)
            : isNull,
      );
      expect(qaVisibleDogBox(box, state, stale: true), isNull);
    }
  });

  testWidgets('expired target offers an explicit restart beside the camera', (
    tester,
  ) async {
    var restarted = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: QaTargetRecoveryNotice(
            restartRequired: true,
            onRestart: () => restarted = true,
          ),
        ),
      ),
    );
    expect(find.text('UNKNOWN · Target lock expired'), findsOneWidget);
    expect(restarted, isFalse);
    await tester.tap(find.text('Restart target / new QA session'));
    expect(restarted, isTrue);
  });

  test('QA posture labels are stable and user-facing', () {
    expect(dogPostureQaLabel(DogPosture.standLike), 'Stand');
    expect(dogPostureQaLabel(DogPosture.sitLike), 'Sit');
    expect(dogPostureQaLabel(DogPosture.downLike), 'Down');
    expect(dogPostureQaLabel(null), 'Unknown');
  });

  test('QA millisecond formatting is explicit', () {
    expect(formatQaMilliseconds(null), '—');
    expect(formatQaMilliseconds(0), '0 ms');
    expect(formatQaMilliseconds(137), '137 ms');
  });

  test('QA percentages fail safely for missing and invalid values', () {
    expect(formatQaPercent(null), '—');
    expect(formatQaPercent(double.nan), '—');
    expect(formatQaPercent(-0.2), '0.0%');
    expect(formatQaPercent(0.981), '98.1%');
    expect(formatQaPercent(1.4), '100.0%');
  });
}
