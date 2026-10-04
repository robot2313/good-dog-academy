import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/pose_shadow_calibration_screen.dart';

void main() {
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
