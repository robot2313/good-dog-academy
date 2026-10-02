enum BehaviourLabel {
  unknown,
  stand,
  sit,
  down,
  stay,
  recall,
  heel,
  looseLead,
  likelyPulling,
}

enum SubjectKind {
  dog,
  person,
  leash,
}

class PoseKeypoint {
  const PoseKeypoint({
    required this.name,
    required this.x,
    required this.y,
    required this.confidence,
  });

  final String name;
  final double x;
  final double y;
  final double confidence;
}

class DetectedSubject {
  const DetectedSubject({
    required this.kind,
    required this.confidence,
    required this.left,
    required this.top,
    required this.right,
    required this.bottom,
    this.trackId,
    this.keypoints = const <PoseKeypoint>[],
  });

  final SubjectKind kind;
  final double confidence;
  final double left;
  final double top;
  final double right;
  final double bottom;
  final int? trackId;
  final List<PoseKeypoint> keypoints;
}

class VisionObservation {
  const VisionObservation({
    required this.timestamp,
    required this.subjects,
    required this.behaviour,
    required this.behaviourConfidence,
    required this.isStable,
  });

  final DateTime timestamp;
  final List<DetectedSubject> subjects;
  final BehaviourLabel behaviour;
  final double behaviourConfidence;
  final bool isStable;
}
