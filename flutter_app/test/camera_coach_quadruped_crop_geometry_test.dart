import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_crop_geometry.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_pose.dart';

QuadrupedPose _uniformPose(double x, double y) {
  return QuadrupedPose(
    keypoints: <QuadrupedJoint, PoseKeypoint>{
      for (final joint in QuadrupedJoint.values)
        joint: PoseKeypoint(x: x, y: y, confidence: 0.9),
    },
  );
}

void main() {
  test('visible guide crop matches the RN 84 percent square contract', () {
    final crop = dogGuideSquareCrop(
      frameWidth: 1280,
      frameHeight: 720,
    );

    expect(crop.width, 604);
    expect(crop.height, 604);
    expect(crop.originX, 338);
    expect(crop.originY, 57);
  });

  test('tracked dog crop is square padded and centred around tracked ROI', () {
    final crop = trackedDogSquareCrop(
      frameWidth: 1000,
      frameHeight: 800,
      box: const NormalizedDogBox(
        left: 0.30,
        top: 0.25,
        width: 0.20,
        height: 0.30,
      ),
    );

    expect(crop.width, crop.height);
    expect(crop.width, 324);
    expect(crop.originX, 238);
    expect(crop.originY, 158);
  });

  test('tracked crop clamps safely against frame edges', () {
    final crop = trackedDogSquareCrop(
      frameWidth: 1000,
      frameHeight: 800,
      box: const NormalizedDogBox(
        left: 0.92,
        top: 0.88,
        width: 0.30,
        height: 0.30,
      ),
    );

    expect(crop.originX, greaterThanOrEqualTo(0));
    expect(crop.originY, greaterThanOrEqualTo(0));
    expect(crop.originX + crop.width, lessThanOrEqualTo(1000));
    expect(crop.originY + crop.height, lessThanOrEqualTo(800));
  });

  test('pixel crop normalises back into full-frame coordinates', () {
    const crop = PixelCropRect(
      originX: 200,
      originY: 100,
      width: 400,
      height: 400,
    );

    final normalized = crop.normalise(
      frameWidth: 1000,
      frameHeight: 800,
    );

    expect(normalized.left, closeTo(0.2, 0.0001));
    expect(normalized.top, closeTo(0.125, 0.0001));
    expect(normalized.width, closeTo(0.4, 0.0001));
    expect(normalized.height, closeTo(0.5, 0.0001));
  });

  test('pose keypoints map from model crop into full camera frame', () {
    final mapped = mapQuadrupedPoseFromCrop(
      _uniformPose(0.5, 0.25),
      const NormalizedCropRect(
        left: 0.2,
        top: 0.1,
        width: 0.4,
        height: 0.6,
      ),
    );

    for (final joint in QuadrupedJoint.values) {
      expect(mapped.point(joint).x, closeTo(0.4, 0.0001));
      expect(mapped.point(joint).y, closeTo(0.25, 0.0001));
      expect(mapped.point(joint).confidence, closeTo(0.9, 0.0001));
    }
  });

  test('invalid frame dimensions fail before crop math', () {
    expect(
      () => dogGuideSquareCrop(frameWidth: 0, frameHeight: 720),
      throwsArgumentError,
    );
    expect(
      () => trackedDogSquareCrop(
        frameWidth: 1000,
        frameHeight: -1,
        box: const NormalizedDogBox(
          left: 0.2,
          top: 0.2,
          width: 0.3,
          height: 0.3,
        ),
      ),
      throwsArgumentError,
    );
  });
}
