enum DogDetectionSource { dedicatedDetector, poseHeuristic }

enum DogTrackingState {
  searching,
  acquired,
  tracking,
  temporarilyLost,
  reacquiring,
  lost,
}

class NormalizedDogBox {
  const NormalizedDogBox({
    required this.left,
    required this.top,
    required this.width,
    required this.height,
  });

  final double left;
  final double top;
  final double width;
  final double height;
}

class DogDetection {
  const DogDetection({
    required this.box,
    required this.confidence,
    required this.source,
    this.appearance,
    this.frameQuality = const {},
  });

  final NormalizedDogBox box;
  final double confidence;
  final DogDetectionSource source;

  /// Optional normalized color histogram. Association aid, not dog identity proof.
  final List<double>? appearance;
  final Map<String, double> frameQuality;
}

class DogTrackingResult {
  const DogTrackingResult({
    required this.box,
    required this.state,
    required this.trackingConfidence,
    required this.ageMs,
    required this.consecutiveMisses,
    required this.source,
    this.matchedDetection,
  });

  final NormalizedDogBox? box;
  final DogTrackingState state;
  final double trackingConfidence;
  final int ageMs;
  final int consecutiveMisses;
  final DogDetectionSource? source;

  /// Detection associated with this frame's locked dog; null during gaps.
  final DogDetection? matchedDetection;
}

class DogTrackerOptions {
  const DogTrackerOptions({
    this.smoothingAlpha = 0.32,
    this.reacquireAlpha = 0.55,
    this.lostAfterMs = 1800,
    this.maxMisses = 3,
    this.minDetectionConfidence = 0.60,
  });

  final double smoothingAlpha;
  final double reacquireAlpha;
  final int lostAfterMs;
  final int maxMisses;
  final double minDetectionConfidence;
}

/// Temporal dog-box tracker ported from the verified React Native pipeline.
///
/// Detector confidence and tracking confidence stay separate. The tracker holds
/// the previous ROI through short detector gaps, then explicitly transitions
/// through loss and reacquisition instead of silently treating stale geometry
/// as a live detection.
class DogTracker {
  DogTracker({this.options = const DogTrackerOptions()});

  final DogTrackerOptions options;

  NormalizedDogBox? _box;
  double _confidence = 0;
  int _lastDetectionAtMs = 0;
  int _misses = 0;
  DogTrackingState _state = DogTrackingState.searching;
  DogDetectionSource? _source;

  DogTrackingResult update(List<DogDetection> detections, int nowMs) {
    final candidates = detections
        .where(
          (item) =>
              item.confidence.isFinite &&
              item.confidence >= options.minDetectionConfidence &&
              item.confidence <= 1 &&
              [
                item.box.left,
                item.box.top,
                item.box.width,
                item.box.height,
              ].every((value) => value.isFinite) &&
              item.box.left >= 0 &&
              item.box.top >= 0 &&
              item.box.width > 0 &&
              item.box.height > 0 &&
              item.box.left + item.box.width <= 1.000001 &&
              item.box.top + item.box.height <= 1.000001,
        )
        .toList(growable: false);

    final detection = _chooseDetection(
      _state == DogTrackingState.lost ? null : _box,
      candidates,
    );

    if (detection != null) {
      final wasLost = _state == DogTrackingState.lost;
      final wasSearching = _state == DogTrackingState.searching || _box == null;

      if (_box == null || wasLost) {
        _box = detection.box;
      } else {
        final overlap = _iou(_box!, detection.box);
        final alpha = overlap >= 0.15
            ? options.smoothingAlpha
            : options.reacquireAlpha;
        _box = NormalizedDogBox(
          left: _smooth(_box!.left, detection.box.left, alpha),
          top: _smooth(_box!.top, detection.box.top, alpha),
          width: _smooth(_box!.width, detection.box.width, alpha),
          height: _smooth(_box!.height, detection.box.height, alpha),
        );
      }

      _confidence = _clamp01(
        _smooth(
          _confidence,
          detection.confidence,
          wasLost || wasSearching ? 0.65 : 0.30,
        ),
      );
      _lastDetectionAtMs = nowMs;
      _misses = 0;
      _state = wasLost
          ? DogTrackingState.reacquiring
          : wasSearching
          ? DogTrackingState.acquired
          : DogTrackingState.tracking;
      _source = detection.source;
    } else {
      _misses++;
      final ageMs = _box == null
          ? 0
          : _nonNegativeAge(nowMs - _lastDetectionAtMs);

      if (_box == null) {
        _state = DogTrackingState.searching;
        _confidence = 0;
      } else if (ageMs > options.lostAfterMs || _misses > options.maxMisses) {
        _state = DogTrackingState.lost;
        _confidence = 0;
        _source = null;
      } else {
        _state = DogTrackingState.temporarilyLost;
        _confidence = _clamp01(_confidence * 0.82);
      }
    }

    return DogTrackingResult(
      box: _box,
      state: _state,
      trackingConfidence: _confidence,
      ageMs: _box == null ? 0 : _nonNegativeAge(nowMs - _lastDetectionAtMs),
      consecutiveMisses: _misses,
      source: _source,
      matchedDetection: detection,
    );
  }

  void reset() {
    _box = null;
    _confidence = 0;
    _lastDetectionAtMs = 0;
    _misses = 0;
    _state = DogTrackingState.searching;
    _source = null;
  }
}

DogDetection? _chooseDetection(
  NormalizedDogBox? current,
  List<DogDetection> detections,
) {
  final valid = detections
      .where((item) => item.confidence > 0)
      .toList(growable: false);
  if (valid.isEmpty) return null;

  if (current == null) {
    final ranked = [...valid]
      ..sort((a, b) => b.confidence.compareTo(a.confidence));
    return ranked.first;
  }

  final overlapping = valid.where((item) => _iou(current, item.box) >= 0.1);
  if (overlapping.isEmpty) return null;
  final ranked = [...overlapping]
    ..sort((a, b) {
      final aScore = _iou(current, a.box) * 0.75 + a.confidence * 0.25;
      final bScore = _iou(current, b.box) * 0.75 + b.confidence * 0.25;
      return bScore.compareTo(aScore);
    });
  // A different dog cannot inherit the lock. Explicit loss permits reacquisition.
  return ranked.first;
}

double _iou(NormalizedDogBox a, NormalizedDogBox b) {
  final left = a.left > b.left ? a.left : b.left;
  final top = a.top > b.top ? a.top : b.top;
  final aRight = a.left + a.width;
  final bRight = b.left + b.width;
  final right = aRight < bRight ? aRight : bRight;
  final aBottom = a.top + a.height;
  final bBottom = b.top + b.height;
  final bottom = aBottom < bBottom ? aBottom : bBottom;

  final intersectionWidth = right > left ? right - left : 0.0;
  final intersectionHeight = bottom > top ? bottom - top : 0.0;
  final intersection = intersectionWidth * intersectionHeight;
  final union = a.width * a.height + b.width * b.height - intersection;
  return union <= 0 ? 0 : intersection / union;
}

double _smooth(double previous, double next, double alpha) =>
    previous + (next - previous) * alpha;

double _clamp01(double value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

int _nonNegativeAge(int value) => value < 0 ? 0 : value;
