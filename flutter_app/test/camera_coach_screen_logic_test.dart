import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/camera_coach_screen.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera_coach_runtime_controller.dart';

void main() {
  test('rep start requires both ready runtime and ready framing', () {
    expect(
      cameraCoachCanBeginRep(CameraCoachRuntimeStatus.ready, true),
      isTrue,
    );
    expect(
      cameraCoachCanBeginRep(CameraCoachRuntimeStatus.ready, false),
      isFalse,
    );
  });

  test('framing alone never overrides non-ready runtime state', () {
    for (final status in CameraCoachRuntimeStatus.values) {
      if (status == CameraCoachRuntimeStatus.ready) continue;
      expect(
        cameraCoachCanBeginRep(status, true),
        isFalse,
        reason: 'status ${status.name} must not start a rep',
      );
    }
  });
}
