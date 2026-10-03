import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';

DogDetection _detection(
  double left,
  double top, {
  double width = 0.4,
  double height = 0.4,
  double confidence = 0.92,
}) => DogDetection(
  box: NormalizedDogBox(
    left: left,
    top: top,
    width: width,
    height: height,
  ),
  confidence: confidence,
  source: DogDetectionSource.dedicatedDetector,
);

void main() {
  test('tracker acquires and smooths a dog box', () {
    final tracker = DogTracker();
    final first = tracker.update(<DogDetection>[_detection(0.20, 0.20)], 0);
    final second = tracker.update(<DogDetection>[_detection(0.40, 0.20)], 100);

    expect(first.state, DogTrackingState.acquired);
    expect(second.state, DogTrackingState.tracking);
    expect(second.box!.left, greaterThan(0.20));
    expect(second.box!.left, lessThan(0.40));
  });

  test('tracker holds the last ROI through brief detection gaps', () {
    final tracker = DogTracker();
    tracker.update(<DogDetection>[_detection(0.30, 0.30)], 0);
    final miss = tracker.update(const <DogDetection>[], 500);

    expect(miss.state, DogTrackingState.temporarilyLost);
    expect(miss.box!.left, closeTo(0.30, 0.0001));
    expect(miss.trackingConfidence, greaterThan(0));
  });

  test('tracker declares lost after grace period', () {
    final tracker = DogTracker(
      options: const DogTrackerOptions(lostAfterMs: 1000),
    );
    tracker.update(<DogDetection>[_detection(0.30, 0.30)], 0);
    final lost = tracker.update(const <DogDetection>[], 1101);

    expect(lost.state, DogTrackingState.lost);
    expect(lost.box, isNotNull);
    expect(lost.trackingConfidence, 0);
  });

  test('tracker reacquires without replacing the tracker instance', () {
    final tracker = DogTracker(
      options: const DogTrackerOptions(lostAfterMs: 500),
    );
    tracker.update(<DogDetection>[_detection(0.30, 0.30)], 0);
    tracker.update(const <DogDetection>[], 700);
    final reacquired = tracker.update(
      <DogDetection>[_detection(0.34, 0.32)],
      800,
    );

    expect(reacquired.state, DogTrackingState.reacquiring);
    expect(reacquired.box!.left, closeTo(0.34, 0.0001));
  });

  test('multiple dogs keep the detection overlapping the current target', () {
    final tracker = DogTracker();
    tracker.update(<DogDetection>[_detection(0.10, 0.20)], 0);

    final result = tracker.update(
      <DogDetection>[
        _detection(0.65, 0.20),
        _detection(0.14, 0.22),
      ],
      100,
    );

    expect(result.state, DogTrackingState.tracking);
    expect(result.box!.left, lessThan(0.30));
  });

  test('low-confidence detections fail closed', () {
    final tracker = DogTracker();
    final result = tracker.update(
      <DogDetection>[_detection(0.30, 0.30, confidence: 0.59)],
      0,
    );

    expect(result.state, DogTrackingState.searching);
    expect(result.box, isNull);
  });
}
