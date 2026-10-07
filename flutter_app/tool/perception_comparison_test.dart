import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/target_dog_tracker.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_pose.dart';
import 'package:good_dog_academy/features/camera_coach/domain/temporal_pose_filter.dart';

DogDetection dog(double left, {int coat = 2, double score = .9}) =>
    DogDetection(
      box: NormalizedDogBox(left: left, top: .2, width: .25, height: .4),
      confidence: score,
      source: DogDetectionSource.dedicatedDetector,
      appearance: List.generate(24, (i) => i % 8 == coat ? 1 : 0),
    );
void main() {
  test('controlled tracker and joint-filter comparison', () async {
    final metrics = <String, Object?>{};
    for (final improved in [false, true]) {
      final tracker = improved ? TargetDogTracker() : DogTracker();
      tracker.update([dog(.1)], 0);
      tracker.update([dog(.1)], 800);
      tracker.update([], 2400);
      var wrongAssignments = 0, wrongStable = 0;
      for (var t = 3200; t <= 4800; t += 800) {
        final r = tracker.update([dog(.65, coat: 6, score: .99)], t);
        if (r.matchedDetection != null) wrongAssignments++;
        if (r.state == DogTrackingState.tracking) wrongStable++;
      }
      tracker.reset();
      var motionMisses = 0;
      double cropLoss = 0;
      for (var i = 0; i < 6; i++) {
        final d = dog(.08 + i * .10);
        final r = tracker.update([d], i * 800);
        if (r.matchedDetection == null) {
          motionMisses++;
        } else {
          // Baseline sends display box to pose; candidate sends current observation.
          final roi = improved ? r.matchedDetection!.box : r.box!;
          cropLoss += (d.box.left - roi.left).abs();
        }
      }
      final filter = TemporalPoseFilter();
      final xs = <double>[];
      const box = NormalizedDogBox(left: .1, top: .1, width: .5, height: .6);
      for (var i = 0; i < 30; i++) {
        final raw = QuadrupedPose(
          keypoints: {
            QuadrupedJoint.leftShoulder: PoseKeypoint(
              x: .30 + (i.isEven ? .01 : -.01),
              y: .3,
              confidence: .9,
            ),
          },
        );
        final pose = improved ? filter.update(raw, box, i * 800) : raw;
        xs.add(pose.point(QuadrupedJoint.leftShoulder).x);
      }
      final jitter =
          List.generate(
            28,
            (i) => (xs[i + 2] - xs[i + 1]).abs(),
          ).reduce((a, b) => a + b) /
          28;
      metrics[improved ? 'candidate' : 'baseline'] = {
        'wrongDogAssignments': wrongAssignments,
        'wrongDogStableFrames': wrongStable,
        'motionMissesOf6': motionMisses,
        'summedPoseCropLeftError': cropLoss,
        'jointJitterNormalized': jitter,
      };
    }
    await File(Platform.environment['GDA_DOMAIN_OUTPUT']!).writeAsString(
      const JsonEncoder.withIndent('  ').convert({
        'scope': 'controlled synthetic detection/pose observations; not real video or model accuracy',
        'metrics': metrics,
      }),
    );
    expect((metrics['candidate'] as Map)['wrongDogAssignments'], 0);
  });
}
