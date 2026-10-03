import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_pose.dart';
import 'package:good_dog_academy/features/camera_coach/domain/tracked_dog_roi.dart';

QuadrupedPose _poseAt(double x, double y) {
  return QuadrupedPose(
    keypoints: <QuadrupedJoint, PoseKeypoint>{
      for (final joint in QuadrupedJoint.values)
        joint: PoseKeypoint(x: x, y: y, confidence: 0.9),
    },
  );
}

void main() {
  test('tracked ROI expands the dog box by 1.35 into a square', () {
    final crop = trackedDogSquareCrop(
      1000,
      1000,
      const NormalizedDogBox(
        left: 0.30,
        top: 0.30,
        width: 0.20,
        height: 0.20,
      ),
    );

    expect(crop.width, 270);
    expect(crop.height, 270);
    expect(crop.originX, 265);
    expect(crop.originY, 265);
  });

  test('tracked ROI clamps safely at frame edges', () {
    final crop = trackedDogSquareCrop(
      1000,
      800,
      const NormalizedDogBox(
        left: 0.0,
        top: 0.0,
        width: 0.40,
        height: 0.50,
      ),
    );

    expect(crop.originX, 0);
    expect(crop.originY, 0);
    expect(crop.width, lessThanOrEqualTo(800));
    expect(crop.height, crop.width);
  });

  test('normalized crop reflects actual pixel crop', () {
    const crop = PixelCropRect(
      originX: 100,
      originY: 50,
      width: 400,
      height: 400,
    );

    final normalized = crop.normalized(1000, 800);

    expect(normalized.left, 0.1);
    expect(normalized.top, 0.0625);
    expect(normalized.width, 0.4);
    expect(normalized.height, 0.5);
  });

  test('crop-local keypoints map back into full-frame coordinates', () {
    final mapped = mapQuadrupedPoseFromCrop(
      _poseAt(0.5, 0.25),
      const NormalizedCropRect(
        left: 0.20,
        top: 0.10,
        width: 0.40,
        height: 0.50,
      ),
    );

    final point = mapped.point(QuadrupedJoint.neck);
    expect(point.x, closeTo(0.40, 0.0001));
    expect(point.y, closeTo(0.225, 0.0001));
    expect(point.confidence, 0.9);
  });

  test('invalid frame dimensions fail closed', () {
    expect(
      () => trackedDogSquareCrop(
        0,
        1000,
        const NormalizedDogBox(
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
