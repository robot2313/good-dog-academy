import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/qa_limb_posture.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_pose.dart';

QuadrupedPose pose({required String shape, double rearQuality = 0.94}) {
  PoseKeypoint point(double x, double y, [double quality = 0.94]) =>
      PoseKeypoint(x: x, y: y, confidence: quality);
  final frontElbow = shape == 'down' ? point(0.36, 0.37) : point(0.25, 0.58);
  final frontPaw = shape == 'down' ? point(0.47, 0.39) : point(0.25, 0.83);
  final rearKnee = shape == 'stand'
      ? point(0.65, 0.58, rearQuality)
      : point(0.76, 0.38, rearQuality);
  final rearPaw = shape == 'stand'
      ? point(0.65, 0.82, rearQuality)
      : point(0.87, 0.40, rearQuality);
  return QuadrupedPose(
    keypoints: {
      QuadrupedJoint.neck: point(0.21, 0.04),
      QuadrupedJoint.tailRoot: point(0.72, 0.06),
      QuadrupedJoint.leftShoulder: point(0.25, 0.35),
      QuadrupedJoint.leftElbow: frontElbow,
      QuadrupedJoint.leftFrontPaw: frontPaw,
      QuadrupedJoint.leftHip: point(0.65, 0.36, rearQuality),
      QuadrupedJoint.leftKnee: rearKnee,
      QuadrupedJoint.leftBackPaw: rearPaw,
    },
  );
}

void main() {
  test('raised neck and tail do not turn extended legs into Down', () {
    final result = classifyQaLimbPosture(
      pose(shape: 'stand'),
      imageWidth: 1000,
      imageHeight: 1000,
    );
    expect(result.posture, DogPosture.standLike);
    expect(result.measurements['rearExtension'], greaterThan(0.8));
  });

  test('reported standing frame joint output resolves to Stand', () {
    const width = 647, height = 431;
    PoseKeypoint point(double x, double y, double score) => PoseKeypoint(
      x: x / width,
      y: y / height,
      confidence: score.clamp(0, 1),
    );
    final observed = QuadrupedPose(
      keypoints: {
        QuadrupedJoint.leftShoulder: point(326.6, 276.8, .927),
        QuadrupedJoint.leftElbow: point(346.0, 330.1, .939),
        QuadrupedJoint.leftFrontPaw: point(356.6, 381.4, 1.061),
        QuadrupedJoint.leftHip: point(464.2, 266.1, .822),
        QuadrupedJoint.leftKnee: point(472.9, 312.6, .954),
        QuadrupedJoint.leftBackPaw: point(495.2, 359.1, 1.068),
      },
    );
    final result = classifyQaLimbPosture(
      observed,
      imageWidth: width,
      imageHeight: height,
    );
    expect(result.posture, DogPosture.standLike);
    expect(result.confidence, greaterThan(.7));
  });

  test('front support and folded hind leg classify Sit', () {
    final result = classifyQaLimbPosture(
      pose(shape: 'sit'),
      imageWidth: 1000,
      imageHeight: 1000,
    );
    expect(result.posture, DogPosture.sitLike);
  });

  test('folded front and hind legs classify Down', () {
    final result = classifyQaLimbPosture(
      pose(shape: 'down'),
      imageWidth: 1000,
      imageHeight: 1000,
    );
    expect(result.posture, DogPosture.downLike);
  });

  test('occluded rear leg remains Unknown with a visible front leg', () {
    final result = classifyQaLimbPosture(
      pose(shape: 'stand', rearQuality: 0.34),
      imageWidth: 1000,
      imageHeight: 1000,
    );
    expect(result.posture, isNull);
    expect(result.reason, 'insufficient_visible_side');
  });

  test(
    'requires a new consecutive observation after loss or posture change',
    () {
      final confirmation = QaPostureConfirmation();
      expect(confirmation.accept(DogPosture.standLike, 1000), isFalse);
      expect(confirmation.accept(DogPosture.standLike, 1800), isTrue);
      expect(confirmation.accept(null, 2600), isFalse);
      expect(confirmation.accept(DogPosture.standLike, 3400), isFalse);
      expect(confirmation.accept(DogPosture.sitLike, 4200), isFalse);
      expect(confirmation.accept(DogPosture.sitLike, 5000), isTrue);
      expect(confirmation.accept(DogPosture.sitLike, 8000), isFalse);
    },
  );
}
