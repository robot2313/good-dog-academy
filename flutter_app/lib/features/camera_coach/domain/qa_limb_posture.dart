import 'dart:math' as math;

import 'camera_coach_models.dart';
import 'quadruped_pose.dart';

/// Experimental QA classifier. Each leg is normalised by its own articulated
/// length: a raised neck or curled tail cannot make straight legs look folded.
/// A complete coherent side is required; unreliable hidden joints are never
/// averaged into visible joints. This is not production certification.
PostureClassification classifyQaLimbPosture(
  QuadrupedPose pose, {
  required int imageWidth,
  required int imageHeight,
  QuadrupedPosturePolicy policy = const QuadrupedPosturePolicy(),
}) {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return const PostureClassification(
      posture: null,
      confidence: null,
      reason: 'invalid_image_dimensions',
    );
  }
  final sides = <_SideAssessment>[];
  for (final left in [true, false]) {
    final names = left
        ? [
            QuadrupedJoint.leftShoulder,
            QuadrupedJoint.leftElbow,
            QuadrupedJoint.leftFrontPaw,
            QuadrupedJoint.leftHip,
            QuadrupedJoint.leftKnee,
            QuadrupedJoint.leftBackPaw,
          ]
        : [
            QuadrupedJoint.rightShoulder,
            QuadrupedJoint.rightElbow,
            QuadrupedJoint.rightFrontPaw,
            QuadrupedJoint.rightHip,
            QuadrupedJoint.rightKnee,
            QuadrupedJoint.rightBackPaw,
          ];
    final points = names.map((name) => pose.keypoints[name]).toList();
    if (points.any(
      (p) =>
          p == null ||
          !p.x.isFinite ||
          !p.y.isFinite ||
          !p.confidence.isFinite ||
          p.x < 0 ||
          p.x > 1 ||
          p.y < 0 ||
          p.y > 1 ||
          p.confidence < policy.minJointConfidence ||
          p.confidence > 1,
    )) {
      continue;
    }
    final p = points.cast<PoseKeypoint>();
    final quality = p.map((v) => v.confidence).reduce(math.min);
    double distance(PoseKeypoint a, PoseKeypoint b) => math.sqrt(
      math.pow((a.x - b.x) * imageWidth, 2) +
          math.pow((a.y - b.y) * imageHeight, 2),
    );
    final torso = distance(p[0], p[3]);
    final frontUpper = distance(p[0], p[1]);
    final frontLower = distance(p[1], p[2]);
    final rearUpper = distance(p[3], p[4]);
    final rearLower = distance(p[4], p[5]);
    final frontLength = frontUpper + frontLower;
    final rearLength = rearUpper + rearLower;
    final metrics = <String, double>{
      'visibleSide': left ? 0 : 1,
      'requiredQuality': quality,
      'torsoPixels': torso,
    };
    String? rejected;
    if (torso < math.min(imageWidth, imageHeight) * 0.08 ||
        [frontUpper, frontLower, rearUpper, rearLower].any((v) => v < 2)) {
      rejected = 'insufficient_body_scale';
    } else if ((p[0].x - p[3].x).abs() * imageWidth / torso < 0.35) {
      rejected = 'frontal_view';
    }
    if (rejected != null) {
      sides.add(
        _SideAssessment(
          quality,
          PostureClassification(
            posture: null,
            confidence: null,
            reason: rejected,
            measurements: metrics,
          ),
        ),
      );
      continue;
    }
    final front = (p[2].y - p[0].y) * imageHeight / frontLength;
    final rear = (p[5].y - p[3].y) * imageHeight / rearLength;
    final frontStraight = distance(p[0], p[2]) / frontLength;
    final rearStraight = distance(p[3], p[5]) / rearLength;
    metrics.addAll({
      'frontExtension': front,
      'rearExtension': rear,
      'frontStraightness': frontStraight,
      'rearStraightness': rearStraight,
    });
    // Both limb chains must be below their body anchors in an upright view.
    // An inverted/rolled camera or crossed/invalid skeleton stays unknown.
    if (front < -0.05 || rear < -0.05) {
      sides.add(
        _SideAssessment(
          quality,
          PostureClassification(
            posture: null,
            confidence: null,
            reason: 'unsupported_view',
            measurements: metrics,
          ),
        ),
      );
      continue;
    }
    final frontSupport = math.min(
      _ramp(front, 0.45, 0.85),
      _ramp(frontStraight, 0.65, 0.95),
    );
    final rearSupport = math.min(
      _ramp(rear, 0.45, 0.85),
      _ramp(rearStraight, 0.65, 0.95),
    );
    final frontFold = 1 - _ramp(front, 0.20, 0.65);
    final rearFold = 1 - _ramp(rear, 0.20, 0.65);
    final candidates = <(DogPosture, double)>[
      (DogPosture.standLike, math.min(frontSupport, rearSupport)),
      (DogPosture.sitLike, math.min(frontSupport, rearFold)),
      (DogPosture.downLike, math.min(frontFold, rearFold)),
    ]..sort((a, b) => b.$2.compareTo(a.$2));
    final best = candidates.first;
    final score = best.$2 * quality;
    final margin = best.$2 - candidates[1].$2;
    final accepted =
        best.$2 >= 0.75 &&
        margin >= 0.15 &&
        score >= policy.minClassificationConfidence;
    metrics.addAll({'limbEvidence': best.$2, 'margin': margin});
    sides.add(
      _SideAssessment(
        quality,
        PostureClassification(
          posture: accepted ? best.$1 : null,
          confidence: score,
          reason: accepted
              ? 'classified_limb_geometry'
              : 'ambiguous_limb_geometry',
          measurements: metrics,
        ),
      ),
    );
  }
  if (sides.isEmpty) {
    return const PostureClassification(
      posture: null,
      confidence: null,
      reason: 'insufficient_visible_side',
    );
  }
  sides.sort((a, b) => b.quality.compareTo(a.quality));
  final best = sides.first.classification;
  if (sides.length == 2 &&
      best.posture != null &&
      sides.last.classification.posture != null &&
      best.posture != sides.last.classification.posture) {
    return PostureClassification(
      posture: null,
      confidence: null,
      reason: 'sides_disagree',
      measurements: best.measurements,
    );
  }
  return best;
}

class _SideAssessment {
  const _SideAssessment(this.quality, this.classification);
  final double quality;
  final PostureClassification classification;
}

double _ramp(double value, double low, double high) =>
    ((value - low) / (high - low)).clamp(0.0, 1.0);

/// Confirms consecutive current observations. UNKNOWN immediately clears the
/// candidate, so stale posture cannot survive occlusion or a changed dog.
class QaPostureConfirmation {
  DogPosture? _candidate;
  int _count = 0;
  int? _lastAt;

  bool accept(DogPosture? posture, int nowMs) {
    if (posture == null ||
        _lastAt == null ||
        nowMs <= _lastAt! ||
        nowMs - _lastAt! > 2500 ||
        posture != _candidate) {
      _candidate = posture;
      _count = 0;
    }
    _lastAt = nowMs;
    if (posture == null) return false;
    _count++;
    return _count >= 2;
  }

  void reset() {
    _candidate = null;
    _count = 0;
    _lastAt = null;
  }
}
