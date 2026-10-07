import 'dart:math' as math;

import 'dog_tracking.dart';
import 'quadruped_pose.dart';

/// Filters in current-detection coordinates, so dog/camera motion does not lag.
/// Missing/low-quality joints are never filled from history. A one-frame jump
/// loses quality; a repeated new location is accepted to permit real transitions.
class TemporalPoseFilter {
  Map<QuadrupedJoint, PoseKeypoint> _previous = {};
  Map<QuadrupedJoint, PoseKeypoint> _rejected = {};
  int? _at;
  int rejectedJoints = 0;

  QuadrupedPose update(QuadrupedPose raw, NormalizedDogBox box, int nowMs) {
    if (_at == null || nowMs <= _at! || nowMs - _at! > 2500) reset();
    final filtered = <QuadrupedJoint, PoseKeypoint>{};
    final next = <QuadrupedJoint, PoseKeypoint>{};
    rejectedJoints = 0;
    for (final entry in raw.keypoints.entries) {
      final p = entry.value;
      if (!p.x.isFinite ||
          !p.y.isFinite ||
          !p.confidence.isFinite ||
          p.confidence < .68 ||
          p.confidence > 1 ||
          p.x < 0 ||
          p.x > 1 ||
          p.y < 0 ||
          p.y > 1) {
        filtered[entry.key] = p;
        _rejected.remove(entry.key);
        continue;
      }
      final local = PoseKeypoint(
        x: (p.x - box.left) / box.width,
        y: (p.y - box.top) / box.height,
        confidence: p.confidence,
      );
      final old = _previous[entry.key];
      final jump = old == null ? 0.0 : _distance(local, old);
      final pending = _rejected[entry.key];
      if (jump > .35 && (pending == null || _distance(local, pending) > .10)) {
        _rejected[entry.key] = local;
        filtered[entry.key] = PoseKeypoint(x: p.x, y: p.y, confidence: 0);
        // Retain comparison reference only; never expose it as a current joint.
        next[entry.key] = old!;
        rejectedJoints++;
        continue;
      }
      _rejected.remove(entry.key);
      final alpha = old == null || jump > .15 ? 1.0 : .35 + .25 * p.confidence;
      final value = PoseKeypoint(
        x: old == null ? local.x : old.x + alpha * (local.x - old.x),
        y: old == null ? local.y : old.y + alpha * (local.y - old.y),
        confidence: p.confidence,
      );
      next[entry.key] = value;
      filtered[entry.key] = PoseKeypoint(
        x: box.left + value.x * box.width,
        y: box.top + value.y * box.height,
        confidence: p.confidence,
      );
    }
    _previous = next;
    _at = nowMs;
    return QuadrupedPose(keypoints: filtered);
  }

  void reset() {
    _previous = {};
    _rejected = {};
    _at = null;
    rejectedJoints = 0;
  }
}

double _distance(PoseKeypoint a, PoseKeypoint b) =>
    math.sqrt(math.pow(a.x - b.x, 2) + math.pow(a.y - b.y, 2));
