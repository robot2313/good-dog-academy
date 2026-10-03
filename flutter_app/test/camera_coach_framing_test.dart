import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/smart_framing.dart';

void main() {
  test('framing guides a dog that is too far left or right', () {
    expect(
      analyseSmartFraming(
        const NormalizedDogBox(
          left: 0.02,
          top: 0.25,
          width: 0.3,
          height: 0.3,
        ),
        0.9,
      ).instruction,
      'Move the camera right.',
    );
    expect(
      analyseSmartFraming(
        const NormalizedDogBox(
          left: 0.68,
          top: 0.25,
          width: 0.3,
          height: 0.3,
        ),
        0.9,
      ).instruction,
      'Move the camera left.',
    );
  });

  test('framing guides size and vertical position', () {
    expect(
      analyseSmartFraming(
        const NormalizedDogBox(
          left: 0.30,
          top: 0.20,
          width: 0.85,
          height: 0.50,
        ),
        0.9,
      ).instruction,
      'Move the camera back.',
    );
    expect(
      analyseSmartFraming(
        const NormalizedDogBox(
          left: 0.35,
          top: 0.25,
          width: 0.18,
          height: 0.18,
        ),
        0.9,
      ).instruction,
      'Move the camera closer.',
    );
    expect(
      analyseSmartFraming(
        const NormalizedDogBox(
          left: 0.35,
          top: 0.01,
          width: 0.25,
          height: 0.25,
        ),
        0.9,
      ).instruction,
      'Move the camera down.',
    );
  });

  test('framing fails closed when tracking is unavailable or unstable', () {
    expect(analyseSmartFraming(null, 0).ready, isFalse);
    expect(analyseSmartFraming(null, 0).instruction, 'Keep your dog in view.');

    final box = const NormalizedDogBox(
      left: 0.30,
      top: 0.25,
      width: 0.35,
      height: 0.40,
    );
    expect(
      analyseSmartFraming(
        box,
        0.9,
        trackingState: DogTrackingState.temporarilyLost,
      ).ready,
      isFalse,
    );
    expect(
      analyseSmartFraming(
        box,
        0.9,
        trackingState: DogTrackingState.reacquiring,
      ).ready,
      isFalse,
    );
  });

  test('well-centred stable dog is ready', () {
    final result = analyseSmartFraming(
      const NormalizedDogBox(
        left: 0.30,
        top: 0.25,
        width: 0.35,
        height: 0.40,
      ),
      0.9,
      trackingState: DogTrackingState.tracking,
    );

    expect(result.status, SmartFramingStatus.good);
    expect(result.ready, isTrue);
  });
}
