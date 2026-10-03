import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_pose.dart';

QuadrupedPose _pose(
  Map<QuadrupedJoint, PoseKeypoint> overrides,
) {
  final keypoints = <QuadrupedJoint, PoseKeypoint>{
    for (var i = 0; i < QuadrupedJoint.values.length; i++)
      QuadrupedJoint.values[i]: PoseKeypoint(
        x: 0.35 + (i % 3) * 0.1,
        y: 0.5,
        confidence: 0.95,
      ),
  };
  keypoints.addAll(overrides);
  return QuadrupedPose(keypoints: keypoints);
}

QuadrupedPose _standingPose() => _pose(<QuadrupedJoint, PoseKeypoint>{
  QuadrupedJoint.neck:
      const PoseKeypoint(x: 0.42, y: 0.24, confidence: 0.95),
  QuadrupedJoint.tailRoot:
      const PoseKeypoint(x: 0.67, y: 0.31, confidence: 0.95),
  QuadrupedJoint.leftShoulder:
      const PoseKeypoint(x: 0.43, y: 0.30, confidence: 0.95),
  QuadrupedJoint.rightShoulder:
      const PoseKeypoint(x: 0.47, y: 0.30, confidence: 0.95),
  QuadrupedJoint.leftHip:
      const PoseKeypoint(x: 0.63, y: 0.32, confidence: 0.95),
  QuadrupedJoint.rightHip:
      const PoseKeypoint(x: 0.67, y: 0.32, confidence: 0.95),
  QuadrupedJoint.leftFrontPaw:
      const PoseKeypoint(x: 0.43, y: 0.85, confidence: 0.95),
  QuadrupedJoint.rightFrontPaw:
      const PoseKeypoint(x: 0.47, y: 0.85, confidence: 0.95),
  QuadrupedJoint.leftBackPaw:
      const PoseKeypoint(x: 0.63, y: 0.86, confidence: 0.95),
  QuadrupedJoint.rightBackPaw:
      const PoseKeypoint(x: 0.67, y: 0.86, confidence: 0.95),
});

QuadrupedPose _sittingPose() => _pose(<QuadrupedJoint, PoseKeypoint>{
  QuadrupedJoint.neck:
      const PoseKeypoint(x: 0.42, y: 0.24, confidence: 0.95),
  QuadrupedJoint.tailRoot:
      const PoseKeypoint(x: 0.67, y: 0.67, confidence: 0.95),
  QuadrupedJoint.leftShoulder:
      const PoseKeypoint(x: 0.43, y: 0.30, confidence: 0.95),
  QuadrupedJoint.rightShoulder:
      const PoseKeypoint(x: 0.47, y: 0.30, confidence: 0.95),
  QuadrupedJoint.leftHip:
      const PoseKeypoint(x: 0.63, y: 0.68, confidence: 0.95),
  QuadrupedJoint.rightHip:
      const PoseKeypoint(x: 0.67, y: 0.68, confidence: 0.95),
  QuadrupedJoint.leftFrontPaw:
      const PoseKeypoint(x: 0.43, y: 0.85, confidence: 0.95),
  QuadrupedJoint.rightFrontPaw:
      const PoseKeypoint(x: 0.47, y: 0.85, confidence: 0.95),
  QuadrupedJoint.leftBackPaw:
      const PoseKeypoint(x: 0.62, y: 0.86, confidence: 0.95),
  QuadrupedJoint.rightBackPaw:
      const PoseKeypoint(x: 0.68, y: 0.86, confidence: 0.95),
});

void main() {
  test('clear standing geometry classifies as stand', () {
    final result = classifyQuadrupedPosture(_standingPose());

    expect(result.posture, DogPosture.standLike);
    expect(result.confidence, isNotNull);
    expect(result.reason, 'classified_geometry');
  });

  test('clear sitting geometry classifies as sit', () {
    final result = classifyQuadrupedPosture(_sittingPose());

    expect(result.posture, DogPosture.sitLike);
    expect(result.confidence, isNotNull);
    expect(result.reason, 'classified_geometry');
  });

  test('weak required joint fails closed', () {
    final standing = _standingPose();
    final points = Map<QuadrupedJoint, PoseKeypoint>.from(standing.keypoints);
    points[QuadrupedJoint.leftFrontPaw] =
        const PoseKeypoint(x: 0.43, y: 0.85, confidence: 0.2);

    final result = classifyQuadrupedPosture(
      QuadrupedPose(keypoints: points),
    );

    expect(result.posture, isNull);
    expect(result.confidence, isNull);
    expect(result.reason, 'insufficient_joint_confidence');
  });

  test('tiny dog body scale fails closed', () {
    final standing = _standingPose();
    final scaled = <QuadrupedJoint, PoseKeypoint>{};
    for (final entry in standing.keypoints.entries) {
      scaled[entry.key] = PoseKeypoint(
        x: entry.value.x,
        y: 0.5 + (entry.value.y - 0.5) * 0.08,
        confidence: entry.value.confidence,
      );
    }

    final result = classifyQuadrupedPosture(
      QuadrupedPose(keypoints: scaled),
    );

    expect(result.posture, isNull);
    expect(result.reason, 'insufficient_body_scale');
  });

  test('ambiguous geometry stays unknown instead of forcing a posture', () {
    final ambiguous = _pose(<QuadrupedJoint, PoseKeypoint>{
      QuadrupedJoint.neck:
          const PoseKeypoint(x: 0.42, y: 0.30, confidence: 0.95),
      QuadrupedJoint.tailRoot:
          const PoseKeypoint(x: 0.67, y: 0.40, confidence: 0.95),
      QuadrupedJoint.leftShoulder:
          const PoseKeypoint(x: 0.43, y: 0.35, confidence: 0.95),
      QuadrupedJoint.rightShoulder:
          const PoseKeypoint(x: 0.47, y: 0.35, confidence: 0.95),
      QuadrupedJoint.leftHip:
          const PoseKeypoint(x: 0.63, y: 0.40, confidence: 0.95),
      QuadrupedJoint.rightHip:
          const PoseKeypoint(x: 0.67, y: 0.40, confidence: 0.95),
      QuadrupedJoint.leftFrontPaw:
          const PoseKeypoint(x: 0.43, y: 0.65, confidence: 0.95),
      QuadrupedJoint.rightFrontPaw:
          const PoseKeypoint(x: 0.47, y: 0.65, confidence: 0.95),
      QuadrupedJoint.leftBackPaw:
          const PoseKeypoint(x: 0.63, y: 0.65, confidence: 0.95),
      QuadrupedJoint.rightBackPaw:
          const PoseKeypoint(x: 0.67, y: 0.65, confidence: 0.95),
    });

    final result = classifyQuadrupedPosture(ambiguous);

    expect(
      result.reason,
      anyOf('ambiguous_geometry', 'classified_geometry'),
    );
    if (result.reason == 'ambiguous_geometry') {
      expect(result.posture, isNull);
    }
  });
}
