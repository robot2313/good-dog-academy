import 'dart:math' as math;

import 'dog_tracking.dart';

/// Private QA tracker. Predictions guide association only; no pose is inferred
/// during gaps. Full loss keeps the target signature instead of selecting a new
/// highest-scoring dog. Long absence requires an explicit new session.
class TargetDogTracker extends DogTracker {
  NormalizedDogBox? _observed, _display;
  List<double>? _appearance;
  int? _lastAt, _lastUpdate;
  int _misses = 0, _recovery = 0;
  double _vx = 0, _vy = 0, _confidence = 0;
  DogTrackingState _state = DogTrackingState.searching;

  @override
  DogTrackingResult update(List<DogDetection> detections, int nowMs) {
    if (_lastUpdate != null && nowMs <= _lastUpdate!) {
      // An old observation must never refresh a live track.
      return _result(null, nowMs, DogTrackingState.temporarilyLost);
    }
    _lastUpdate = nowMs;
    final age = _lastAt == null ? 0 : nowMs - _lastAt!;
    final recovery =
        _state == DogTrackingState.temporarilyLost ||
        _state == DogTrackingState.lost ||
        _state == DogTrackingState.reacquiring ||
        age > 1800;
    final predicted = _predict(nowMs);
    final ranked = <(DogDetection, double)>[];
    for (final d in detections) {
      if (!_valid(d)) continue;
      if (_observed == null) {
        if (d.confidence >= .60) ranked.add((d, d.confidence));
        continue;
      }
      if (age > 6000) continue;
      final overlap = boxIou(predicted!, d.box);
      final reference = _observed!;
      final sizeRatio =
          d.box.width * d.box.height / (reference.width * reference.height);
      final aspectRatio =
          (d.box.width / d.box.height) / (reference.width / reference.height);
      final centerDistance =
          math.sqrt(
            math.pow(_cx(d.box) - _cx(predicted), 2) +
                math.pow(_cy(d.box) - _cy(predicted), 2),
          ) /
          math.sqrt(
            reference.width * reference.width +
                reference.height * reference.height,
          );
      if (sizeRatio < (recovery ? .65 : .45) ||
          sizeRatio > (recovery ? 1.55 : 2.2) ||
          aspectRatio < .55 ||
          aspectRatio > 1.8 ||
          overlap < (recovery ? .30 : .12) ||
          centerDistance > (recovery ? .35 : .65)) {
        continue;
      }
      final appearanceDistance = _appearanceDistance(_appearance, d.appearance);
      if (_appearance != null &&
          (appearanceDistance == null ||
              appearanceDistance > (recovery ? .12 : .24))) {
        continue;
      }
      // Low-score boxes may continue a fresh, strongly overlapping target only.
      if (d.confidence < .60 &&
          (recovery ||
              age > 1500 ||
              overlap < .55 ||
              d.confidence < .35 ||
              _appearance == null)) {
        continue;
      }
      ranked.add((
        d,
        .65 * overlap + .20 * (1 - centerDistance) + .15 * d.confidence,
      ));
    }
    ranked.sort((a, b) => b.$2.compareTo(a.$2));
    // Ambiguous association abstains, even if the competing dog is confident.
    final ambiguous = ranked.length > 1 && ranked[0].$2 - ranked[1].$2 < .10;
    final matched = ranked.isEmpty || ambiguous ? null : ranked.first.$1;
    if (matched == null) {
      _misses++;
      _recovery = 0;
      _state = _observed == null
          ? DogTrackingState.searching
          : age > 1800 || _misses > 3
          ? DogTrackingState.lost
          : DogTrackingState.temporarilyLost;
      _confidence = _state == DogTrackingState.lost ? 0 : _confidence * .82;
      return _result(null, nowMs, _state);
    }
    final initial = _observed == null;
    if (!initial && _lastAt != null && nowMs > _lastAt! && !recovery) {
      final dt = (nowMs - _lastAt!) / 1000;
      _vx = .65 * _vx + .35 * ((_cx(matched.box) - _cx(_observed!)) / dt);
      _vy = .65 * _vy + .35 * ((_cy(matched.box) - _cy(_observed!)) / dt);
    } else {
      _vx = 0;
      _vy = 0;
    }
    _display = initial || recovery
        ? matched.box
        : _blend(_display!, matched.box, .55);
    _observed = matched.box;
    _lastAt = nowMs;
    _misses = 0;
    _confidence = initial
        ? matched.confidence
        : .7 * _confidence + .3 * matched.confidence;
    if (matched.appearance != null && matched.confidence >= .60) {
      _appearance ??= List.of(matched.appearance!);
      // Slow updates prevent one contaminated crop overwriting the identity aid.
      if (!recovery) {
        _appearance = List.generate(
          _appearance!.length,
          (i) => .95 * _appearance![i] + .05 * matched.appearance![i],
        );
      }
    }
    if (initial) {
      _state = DogTrackingState.acquired;
    } else if (recovery) {
      _recovery++;
      _state = _recovery >= 2
          ? DogTrackingState.tracking
          : DogTrackingState.reacquiring;
    } else {
      _state = DogTrackingState.tracking;
      _recovery = 0;
    }
    return _result(matched, nowMs, _state);
  }

  DogTrackingResult _result(DogDetection? d, int now, DogTrackingState state) =>
      DogTrackingResult(
        box: _display,
        state: state,
        trackingConfidence: _confidence,
        ageMs: _lastAt == null ? 0 : math.max(0, now - _lastAt!),
        consecutiveMisses: _misses,
        source: d?.source,
        matchedDetection: d,
      );

  NormalizedDogBox? _predict(int now) {
    final b = _observed;
    if (b == null) return null;
    final dt = math.min(1.0, math.max(0, now - _lastAt!) / 1000);
    final dx = (_vx * dt).clamp(-b.width * .4, b.width * .4);
    final dy = (_vy * dt).clamp(-b.height * .4, b.height * .4);
    return NormalizedDogBox(
      left: (b.left + dx).clamp(0, 1 - b.width),
      top: (b.top + dy).clamp(0, 1 - b.height),
      width: b.width,
      height: b.height,
    );
  }

  @override
  void reset() {
    _observed = null;
    _display = null;
    _appearance = null;
    _lastAt = null;
    _lastUpdate = null;
    _misses = 0;
    _recovery = 0;
    _vx = 0;
    _vy = 0;
    _confidence = 0;
    _state = DogTrackingState.searching;
  }
}

bool _valid(DogDetection d) =>
    d.confidence.isFinite &&
    d.confidence >= .35 &&
    d.confidence <= 1 &&
    [
      d.box.left,
      d.box.top,
      d.box.width,
      d.box.height,
    ].every((v) => v.isFinite) &&
    d.box.left >= 0 &&
    d.box.top >= 0 &&
    d.box.width > .005 &&
    d.box.height > .005 &&
    d.box.left + d.box.width <= 1.000001 &&
    d.box.top + d.box.height <= 1.000001 &&
    (d.appearance == null ||
        (d.appearance!.length == 24 &&
            d.appearance!.every((v) => v.isFinite && v >= 0 && v <= 1)));

double? _appearanceDistance(List<double>? a, List<double>? b) {
  if (a == null || b == null || a.length != b.length) return null;
  // Total variation averaged over RGB channels, range [0,1].
  return List.generate(
        a.length,
        (i) => (a[i] - b[i]).abs(),
      ).reduce((a, b) => a + b) /
      6;
}

double _cx(NormalizedDogBox b) => b.left + b.width / 2;
double _cy(NormalizedDogBox b) => b.top + b.height / 2;
NormalizedDogBox _blend(NormalizedDogBox a, NormalizedDogBox b, double alpha) =>
    NormalizedDogBox(
      left: a.left + alpha * (b.left - a.left),
      top: a.top + alpha * (b.top - a.top),
      width: a.width + alpha * (b.width - a.width),
      height: a.height + alpha * (b.height - a.height),
    );
double boxIou(NormalizedDogBox a, NormalizedDogBox b) {
  final w = math.max(
    0.0,
    math.min(a.left + a.width, b.left + b.width) - math.max(a.left, b.left),
  );
  final h = math.max(
    0.0,
    math.min(a.top + a.height, b.top + b.height) - math.max(a.top, b.top),
  );
  return w * h / (a.width * a.height + b.width * b.height - w * h);
}
