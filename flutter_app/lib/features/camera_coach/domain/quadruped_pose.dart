import 'camera_coach_models.dart';

enum QuadrupedJoint {
  leftEye,
  rightEye,
  nose,
  neck,
  tailRoot,
  leftShoulder,
  leftElbow,
  leftFrontPaw,
  rightShoulder,
  rightElbow,
  rightFrontPaw,
  leftHip,
  leftKnee,
  leftBackPaw,
  rightHip,
  rightKnee,
  rightBackPaw,
}

class PoseKeypoint {
  const PoseKeypoint({
    required this.x,
    required this.y,
    required this.confidence,
  });

  final double x;
  final double y;
  final double confidence;
}

class QuadrupedPose {
  const QuadrupedPose({required this.keypoints});

  final Map<QuadrupedJoint, PoseKeypoint> keypoints;

  PoseKeypoint point(QuadrupedJoint joint) {
    final point = keypoints[joint];
    if (point == null) {
      throw ArgumentError('Missing quadruped keypoint: ${joint.name}');
    }
    return point;
  }
}

class QuadrupedPosturePolicy {
  const QuadrupedPosturePolicy({
    this.minJointConfidence = 0.68,
    this.minClassificationConfidence = 0.58,
    this.minBodyHeight = 0.12,
  });

  final double minJointConfidence;
  final double minClassificationConfidence;
  final double minBodyHeight;
}

class PostureClassification {
  const PostureClassification({
    required this.posture,
    required this.confidence,
    required this.reason,
    this.measurements = const {},
  });

  final DogPosture? posture;
  final double? confidence;
  final String reason;
  final Map<String, double> measurements;
}

/// Production posture contract ported from the verified React Native geometry.
///
/// Diagnostics from later experimental V2–V6 calculations are intentionally
/// not used here. This function contains only the scoring path that decides
/// stand/sit/down/unknown.
PostureClassification classifyQuadrupedPosture(
  QuadrupedPose pose, {
  QuadrupedPosturePolicy policy = const QuadrupedPosturePolicy(),
}) {
  final shoulder = _pairAverage(
    pose,
    QuadrupedJoint.leftShoulder,
    QuadrupedJoint.rightShoulder,
  );
  final hip = _pairAverage(
    pose,
    QuadrupedJoint.leftHip,
    QuadrupedJoint.rightHip,
  );
  final frontPaw = _pairAverage(
    pose,
    QuadrupedJoint.leftFrontPaw,
    QuadrupedJoint.rightFrontPaw,
  );
  final backPaw = _pairAverage(
    pose,
    QuadrupedJoint.leftBackPaw,
    QuadrupedJoint.rightBackPaw,
  );
  final neck = pose.point(QuadrupedJoint.neck);
  final tailRoot = pose.point(QuadrupedJoint.tailRoot);

  final requiredConfidence = <double>[
    shoulder.confidence,
    hip.confidence,
    frontPaw.confidence,
    backPaw.confidence,
    neck.confidence,
    tailRoot.confidence,
  ].reduce((a, b) => a < b ? a : b);

  if (requiredConfidence < policy.minJointConfidence) {
    return const PostureClassification(
      posture: null,
      confidence: null,
      reason: 'insufficient_joint_confidence',
    );
  }

  final pawFloor = _average(<double>[frontPaw.y, backPaw.y]);
  final bodyTop = <double>[
    shoulder.y,
    hip.y,
    neck.y,
    tailRoot.y,
  ].reduce((a, b) => a < b ? a : b);
  final bodyHeight = pawFloor - bodyTop;

  if (bodyHeight < policy.minBodyHeight) {
    return const PostureClassification(
      posture: null,
      confidence: null,
      reason: 'insufficient_body_scale',
    );
  }

  final safeBodyHeight = bodyHeight > 0.000001 ? bodyHeight : 0.000001;
  final shoulderClearance = _clamp01(
    (frontPaw.y - shoulder.y) / safeBodyHeight,
  );
  final hipClearance = _clamp01(
    (backPaw.y - hip.y) / safeBodyHeight,
  );
  final torsoLevel = _clamp01(
    1 - (shoulder.y - hip.y).abs() / safeBodyHeight,
  );
  final neckHipLevel = _clamp01(
    1 - (neck.y - hip.y).abs() / safeBodyHeight,
  );

  final standScore = _clamp01(
    0.38 * shoulderClearance +
        0.38 * hipClearance +
        0.24 * torsoLevel,
  );

  final sitRearCompression = _clamp01(1 - hipClearance);
  final sitScore = _clamp01(
    0.46 * shoulderClearance +
        0.38 * sitRearCompression +
        0.16 * torsoLevel,
  );

  final downCompression = _clamp01(
    1 - _average(<double>[shoulderClearance, hipClearance]),
  );
  final downScore = _clamp01(
    0.46 * downCompression +
        0.30 * torsoLevel +
        0.24 * neckHipLevel,
  );

  final candidates = <(DogPosture, double)>[
    (DogPosture.standLike, standScore),
    (DogPosture.sitLike, sitScore),
    (DogPosture.downLike, downScore),
  ]..sort((a, b) => b.$2.compareTo(a.$2));

  final best = candidates[0];
  final second = candidates[1];
  final margin = best.$2 - second.$2;
  final confidence =
      _clamp01(best.$2 * 0.82 + margin * 0.18) * requiredConfidence;

  if (confidence < policy.minClassificationConfidence || margin < 0.08) {
    return PostureClassification(
      posture: null,
      confidence: confidence,
      reason: 'ambiguous_geometry',
    );
  }

  return PostureClassification(
    posture: best.$1,
    confidence: confidence,
    reason: 'classified_geometry',
  );
}

PoseKeypoint _pairAverage(
  QuadrupedPose pose,
  QuadrupedJoint a,
  QuadrupedJoint b,
) {
  final left = pose.point(a);
  final right = pose.point(b);
  return PoseKeypoint(
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    confidence:
        left.confidence < right.confidence ? left.confidence : right.confidence,
  );
}

double _average(List<double> values) =>
    values.reduce((a, b) => a + b) / values.length;

double _clamp01(double value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
