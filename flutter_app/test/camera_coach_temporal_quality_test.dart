import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/target_dog_tracker.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_pose.dart';
import 'package:good_dog_academy/features/camera_coach/domain/temporal_pose_filter.dart';

List<double> color(int bin) => List.generate(24, (i) => i % 8 == bin ? 1 : 0);
DogDetection dog(
  double left, {
  double score = .9,
  int coat = 2,
  double width = .25,
  double height = .4,
}) => DogDetection(
  box: NormalizedDogBox(left: left, top: .2, width: width, height: height),
  confidence: score,
  source: DogDetectionSource.dedicatedDetector,
  appearance: color(coat),
);
QuadrupedPose joint(double x, {double score = .9}) => QuadrupedPose(
  keypoints: {
    QuadrupedJoint.leftShoulder: PoseKeypoint(x: x, y: .3, confidence: score),
  },
);
const box = NormalizedDogBox(left: .1, top: .1, width: .5, height: .6);
void main() {
  test('stable continuation follows current matching dog', () {
    final tracker = TargetDogTracker();
    expect(tracker.update([dog(.1)], 0).state, DogTrackingState.acquired);
    final r = tracker.update([dog(.14), dog(.65, score: .99, coat: 5)], 800);
    expect(r.state, DogTrackingState.tracking);
    expect(r.matchedDetection!.box.left, .14);
  });
  test(
    'lower score can continue a matching fresh appearance but cannot acquire',
    () {
      final tracker = TargetDogTracker();
      expect(
        tracker.update([dog(.1, score: .4)], 0).state,
        DogTrackingState.searching,
      );
      tracker.update([dog(.1)], 800);
      expect(
        tracker.update([dog(.11, score: .4)], 1600).state,
        DogTrackingState.tracking,
      );
    },
  );
  test('different coat cannot inherit a target even at the same box', () {
    final tracker = TargetDogTracker();
    tracker.update([dog(.1)], 0);
    expect(tracker.update([dog(.1, coat: 6)], 800).matchedDetection, isNull);
  });
  test('full loss does not choose another highest-scoring dog', () {
    final tracker = TargetDogTracker();
    tracker.update([dog(.1)], 0);
    expect(tracker.update([], 2400).state, DogTrackingState.lost);
    expect(
      tracker.update([dog(.65, score: .99, coat: 6)], 3200).state,
      DogTrackingState.lost,
    );
  });
  test('short loss requires two consistent recovery observations', () {
    final tracker = TargetDogTracker();
    tracker.update([dog(.1)], 0);
    expect(tracker.update([], 800).state, DogTrackingState.temporarilyLost);
    expect(
      tracker.update([dog(.11)], 1600).state,
      DogTrackingState.reacquiring,
    );
    expect(tracker.update([dog(.12)], 2400).state, DogTrackingState.tracking);
  });
  test('long absence requires reset; low confidence cannot reacquire', () {
    final tracker = TargetDogTracker();
    tracker.update([dog(.1)], 0);
    tracker.update([], 2400);
    expect(
      tracker.update([dog(.1, score: .4)], 3200).state,
      DogTrackingState.lost,
    );
    expect(tracker.update([dog(.1)], 7000).state, DogTrackingState.lost);
    tracker.reset();
    expect(tracker.update([dog(.1)], 7800).state, DogTrackingState.acquired);
  });
  test('ambiguous overlapping candidates and invalid boxes abstain', () {
    final tracker = TargetDogTracker();
    tracker.update([dog(.1)], 0);
    expect(tracker.update([dog(.11), dog(.12)], 800).matchedDetection, isNull);
    expect(
      tracker.update([dog(double.nan), dog(.99)], 1600).matchedDetection,
      isNull,
    );
  });
  test('scale jump cannot inherit current track', () {
    final tracker = TargetDogTracker();
    tracker.update([dog(.1)], 0);
    expect(
      tracker.update([dog(.1, width: .8, height: .8)], 800).matchedDetection,
      isNull,
    );
  });
  test('old observations cannot refresh target', () {
    final tracker = TargetDogTracker();
    tracker.update([dog(.1)], 800);
    expect(tracker.update([dog(.1)], 800).matchedDetection, isNull);
  });
  test('filter reduces repeated jitter without increasing quality', () {
    final filter = TemporalPoseFilter();
    final outputs = <double>[];
    for (var i = 0; i < 20; i++) {
      final r = filter.update(
        joint(.30 + (i.isEven ? .01 : -.01)),
        box,
        i * 800,
      );
      outputs.add(r.point(QuadrupedJoint.leftShoulder).x);
      expect(r.point(QuadrupedJoint.leftShoulder).confidence, .9);
    }
    final variation =
        List.generate(
          18,
          (i) => (outputs[i + 2] - outputs[i + 1]).abs(),
        ).reduce((a, b) => a + b) /
        18;
    expect(variation, lessThan(.012));
  });
  test(
    'single implausible jump is invalidated; repeated change is allowed',
    () {
      final filter = TemporalPoseFilter();
      filter.update(joint(.3), box, 0);
      expect(
        filter
            .update(joint(.6), box, 800)
            .point(QuadrupedJoint.leftShoulder)
            .confidence,
        0,
      );
      expect(
        filter
            .update(joint(.6), box, 1600)
            .point(QuadrupedJoint.leftShoulder)
            .x,
        closeTo(.6, .00001),
      );
    },
  );
  test('missing and low-quality joints are never copied from history', () {
    final filter = TemporalPoseFilter();
    filter.update(joint(.3), box, 0);
    expect(
      filter.update(const QuadrupedPose(keypoints: {}), box, 800).keypoints,
      isEmpty,
    );
    filter.update(joint(.3), box, 1600);
    expect(
      filter
          .update(joint(.6, score: .2), box, 2400)
          .point(QuadrupedJoint.leftShoulder)
          .confidence,
      .2,
    );
  });
  test('filter reset and long gaps do not smooth a new dog', () {
    final filter = TemporalPoseFilter();
    filter.update(joint(.3), box, 0);
    filter.reset();
    expect(
      filter
          .update(joint(.6), box, 800)
          .point(QuadrupedJoint.leftShoulder)
          .confidence,
      .9,
    );
    expect(
      filter.update(joint(.2), box, 4000).point(QuadrupedJoint.leftShoulder).x,
      closeTo(.2, .00001),
    );
  });
  test('filter compensates current ROI translation', () {
    final filter = TemporalPoseFilter();
    filter.update(joint(.3), box, 0);
    const moved = NormalizedDogBox(left: .2, top: .1, width: .5, height: .6);
    expect(
      filter.update(joint(.4), moved, 800).point(QuadrupedJoint.leftShoulder).x,
      closeTo(.4, .00001),
    );
  });
}
