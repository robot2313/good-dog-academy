/// Frame-local evidence for engineering QA. Coordinates refer to the oriented
/// analysed image, never to a newer live-camera preview.
class PoseJointDiagnostic {
  const PoseJointDiagnostic({
    required this.name,
    required this.x,
    required this.y,
    required this.quality,
    this.nativeScore,
  });
  final String name;
  final double x, y, quality;
  final double? nativeScore;

  Map<String, Object?> toJson() => {
    'name': name,
    'x': x,
    'y': y,
    'quality': quality,
    'nativeScore': nativeScore,
  };
}

class PoseDiagnostics {
  const PoseDiagnostics({
    required this.reason,
    required this.imageWidth,
    required this.imageHeight,
    this.joints = const [],
    this.measurements = const {},
    this.rawPosture,
    this.rawPostureScore,
  });
  final String reason;
  final int imageWidth, imageHeight;
  final List<PoseJointDiagnostic> joints;
  final Map<String, double> measurements;
  final String? rawPosture;
  final double? rawPostureScore;

  Map<String, Object?> toJson() => {
    'reason': reason,
    'imageWidth': imageWidth,
    'imageHeight': imageHeight,
    'rawPosture': rawPosture,
    'rawPostureScore': rawPostureScore,
    'measurements': measurements,
    'joints': joints.map((joint) => joint.toJson()).toList(),
  };
}
