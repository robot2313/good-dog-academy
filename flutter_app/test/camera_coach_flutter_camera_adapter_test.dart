import 'package:flutter/services.dart' show DeviceOrientation;
import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/flutter_camera_capture_adapter.dart';

void main() {
  test('device orientation maps to stable clockwise degrees', () {
    expect(cameraDeviceOrientationDegrees(DeviceOrientation.portraitUp), 0);
    expect(cameraDeviceOrientationDegrees(DeviceOrientation.landscapeLeft), 90);
    expect(cameraDeviceOrientationDegrees(DeviceOrientation.portraitDown), 180);
    expect(
      cameraDeviceOrientationDegrees(DeviceOrientation.landscapeRight),
      270,
    );
  });
}
