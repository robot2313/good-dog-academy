import 'dog_tracking.dart';
import 'quadruped_pose.dart';

/// One priority-ordered instruction. Pixel proxies are QA diagnostics, not
/// calibrated camera-quality probabilities. Blur alone does not certify validity.
String? frameValidityReason(DogDetection detection, int width, int height) {
  final b = detection.box;
  if (b.width > .95 || b.height > .95) return 'dog_too_close';
  if (b.left <= .008 ||
      b.top <= .008 ||
      b.left + b.width >= .992 ||
      b.top + b.height >= .992) {
    return 'dog_partly_outside_frame';
  }
  if (b.width * width < 60 || b.height * height < 60) return 'dog_too_small';
  if ((detection.frameQuality['meanLuminance'] ?? 255) < 25 &&
      (detection.frameQuality['darkFraction'] ?? 0) > .75) {
    return 'poor_light';
  }
  return null;
}

String poseGuidanceReason(
  QuadrupedPose pose,
  String reason,
  DogDetection detection,
) {
  if (reason == 'insufficient_visible_side') {
    bool visible(QuadrupedJoint joint) =>
        (pose.keypoints[joint]?.confidence ?? 0) >= .68;
    if (!visible(QuadrupedJoint.leftFrontPaw) &&
        !visible(QuadrupedJoint.rightFrontPaw)) {
      return 'front_paws_missing';
    }
    final leftRear = [
      QuadrupedJoint.leftHip,
      QuadrupedJoint.leftKnee,
      QuadrupedJoint.leftBackPaw,
    ];
    final rightRear = [
      QuadrupedJoint.rightHip,
      QuadrupedJoint.rightKnee,
      QuadrupedJoint.rightBackPaw,
    ];
    if (!leftRear.every(visible) && !rightRear.every(visible)) {
      return 'rear_legs_occluded';
    }
    if (!visible(QuadrupedJoint.nose) &&
        !visible(QuadrupedJoint.leftEye) &&
        !visible(QuadrupedJoint.rightEye)) {
      return 'head_missing';
    }
    if ((detection.frameQuality['laplacianEnergy'] ?? 100) < 3) {
      return 'possible_motion_blur';
    }
  }
  return reason;
}

String perceptionGuidance(String reason) => switch (reason) {
  'dog_too_close' => 'Move back slightly so I can see the whole dog.',
  'dog_partly_outside_frame' =>
    'Keep the whole dog in frame, including the paws.',
  'dog_too_small' || 'insufficient_body_scale' => 'Move closer to the dog.',
  'poor_light' => 'Move into better light.',
  'possible_motion_blur' ||
  'temporal_joint_outlier' => 'Hold the phone steadier.',
  'front_paws_missing' =>
    "Point the camera lower; I need to see the dog's paws.",
  'rear_legs_occluded' => 'Try a side view with the rear legs visible.',
  'head_missing' => "Keep the dog's head in frame.",
  'frontal_view' || 'unsupported_view' => 'Try an upright side view.',
  'target_reacquiring' => 'Keep the dog in frame while I confirm the target.',
  'target_temporarily_lost' =>
    'Keep the dog in frame; the target is temporarily hidden.',
  'target_lost' => 'Target lost. Bring the same dog back; restart the session after a long absence.',
  'no_dog' => 'Point the camera at the dog.',
  'unconfirmed_dog' => 'Dog candidate seen; waiting for a reliable target.',
  'confirming_posture' => 'Hold this view while I confirm the posture.',
  'pose_unavailable' => 'Body joints were not found. Try a clearer side view.',
  'pose_inference_failed' =>
    'Pose analysis failed. Restart the QA session if it continues.',
  'insufficient_visible_side' => 'I need a clear view of the body and legs.',
  'ambiguous_limb_geometry' ||
  'sides_disagree' ||
  'temporal_posture_conflict' =>
    'Body evidence is unclear. Hold steady or change angle.',
  _ => reason.replaceAll('_', ' '),
};
