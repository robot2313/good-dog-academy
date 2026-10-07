import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_crop_evidence.dart';
import 'package:good_dog_academy/features/camera_coach/domain/perception_guidance.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_pose.dart';

DogDetection detection({
  double left = .1,
  double top = .1,
  double width = .5,
  double height = .6,
  Map<String, double> quality = const {},
}) => DogDetection(
  box: NormalizedDogBox(left: left, top: top, width: width, height: height),
  confidence: .9,
  source: DogDetectionSource.dedicatedDetector,
  frameQuality: quality,
);
void main() {
  test(
    'valid normal framing permits analysis',
    () => expect(frameValidityReason(detection(), 640, 480), isNull),
  );
  test(
    'too-close precedes partial-body guidance',
    () => expect(
      frameValidityReason(detection(left: 0, width: .99), 640, 480),
      'dog_too_close',
    ),
  );
  test(
    'edge clipping cannot be scored',
    () => expect(
      frameValidityReason(detection(top: 0), 640, 480),
      'dog_partly_outside_frame',
    ),
  );
  test(
    'small dog requests closer framing',
    () => expect(
      frameValidityReason(detection(width: .05, height: .05), 640, 480),
      'dog_too_small',
    ),
  );
  test(
    'low-light proxy requests better light',
    () => expect(
      frameValidityReason(
        detection(quality: {'meanLuminance': 10, 'darkFraction': .9}),
        640,
        480,
      ),
      'poor_light',
    ),
  );
  test('crop evidence is deterministic, normalized and detects a dark ROI', () {
    final evidence = withDogCropEvidence(
      detection(),
      Uint8List(100 * 100 * 3),
      100,
      100,
    );
    expect(evidence.appearance!.length, 24);
    for (var c = 0; c < 3; c++) {
      expect(
        evidence.appearance!
            .sublist(c * 8, (c + 1) * 8)
            .reduce((a, b) => a + b),
        closeTo(1, .000001),
      );
    }
    expect(evidence.frameQuality['meanLuminance'], 0);
    expect(frameValidityReason(evidence, 1000, 1000), 'poor_light');
  });
  test(
    'uncertain knees are explained even when hind paws have high scores',
    () {
      final pose = QuadrupedPose(
        keypoints: {
          QuadrupedJoint.leftFrontPaw: const PoseKeypoint(
            x: .2,
            y: .8,
            confidence: .9,
          ),
          QuadrupedJoint.leftBackPaw: const PoseKeypoint(
            x: .7,
            y: .8,
            confidence: .9,
          ),
        },
      );
      expect(
        poseGuidanceReason(pose, 'insufficient_visible_side', detection()),
        'rear_legs_occluded',
      );
    },
  );
  test(
    'guidance requests exactly one concrete action',
    () => expect(
      perceptionGuidance('front_paws_missing'),
      contains('camera lower'),
    ),
  );
}
