import 'camera_coach_models.dart';

class PostureObservation {
  const PostureObservation({
    required this.posture,
    required this.confidence,
  });

  final DogPosture? posture;
  final double? confidence;
}

class PostureTransition {
  const PostureTransition({
    required this.from,
    required this.to,
  });

  final DogPosture from;
  final DogPosture to;

  @override
  bool operator ==(Object other) =>
      other is PostureTransition && other.from == from && other.to == to;

  @override
  int get hashCode => Object.hash(from, to);
}

class PostureBufferResult {
  const PostureBufferResult({
    required this.stablePosture,
    required this.transition,
  });

  final DogPosture? stablePosture;
  final PostureTransition? transition;
}

class PostureBufferOptions {
  const PostureBufferOptions({
    this.windowSize = 5,
    this.consensusThreshold = 0.6,
    this.minConfidence = 0.72,
  });

  final int windowSize;
  final double consensusThreshold;
  final double minConfidence;
}

/// Small temporal consensus buffer for posture observations.
///
/// Low-confidence and unknown observations never establish a new stable
/// posture. A transition is emitted once when the new posture reaches
/// consensus, then cleared on the next push.
class PostureBuffer {
  PostureBuffer({this.options = const PostureBufferOptions()})
      : _windowSize = options.windowSize < 1 ? 1 : options.windowSize,
        _consensusThreshold = _clamp01(options.consensusThreshold),
        _minConfidence = _clamp01(options.minConfidence);

  final PostureBufferOptions options;
  final int _windowSize;
  final double _consensusThreshold;
  final double _minConfidence;

  final List<PostureObservation> _observations = <PostureObservation>[];
  DogPosture? _stablePosture;
  PostureTransition? _lastTransition;

  PostureBufferResult push(PostureObservation observation) {
    _lastTransition = null;
    _observations.add(observation);

    if (_observations.length > _windowSize) {
      _observations.removeAt(0);
    }

    final valid = _observations.where((item) {
      final confidence = item.confidence;
      return item.posture != null &&
          confidence != null &&
          confidence.isFinite &&
          confidence >= _minConfidence;
    }).toList(growable: false);

    if (valid.length < 3) {
      return PostureBufferResult(
        stablePosture: _stablePosture,
        transition: null,
      );
    }

    final counts = <DogPosture, int>{};
    for (final item in valid) {
      final posture = item.posture!;
      counts[posture] = (counts[posture] ?? 0) + 1;
    }

    DogPosture? candidate;
    var candidateCount = 0;
    for (final entry in counts.entries) {
      if (entry.value > candidateCount) {
        candidate = entry.key;
        candidateCount = entry.value;
      }
    }

    if (candidate == null ||
        candidateCount / valid.length < _consensusThreshold) {
      return PostureBufferResult(
        stablePosture: _stablePosture,
        transition: null,
      );
    }

    final previous = _stablePosture;
    if (previous != null && previous != candidate) {
      _lastTransition = PostureTransition(from: previous, to: candidate);
    }

    _stablePosture = candidate;
    return PostureBufferResult(
      stablePosture: _stablePosture,
      transition: _lastTransition,
    );
  }

  DogPosture? getStablePosture() => _stablePosture;

  PostureTransition? getLastTransition() => _lastTransition;

  void reset() {
    _observations.clear();
    _stablePosture = null;
    _lastTransition = null;
  }
}

double _clamp01(double value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
