import '../../domain/dog_tracking.dart';
import '../../domain/quadruped_pose.dart';
import '../camera/camera_frame_source.dart';

class QuadrupedPoseInference {
  const QuadrupedPoseInference({
    required this.dogDetected,
    required this.detectionConfidence,
    required this.dogBoundingBox,
    required this.pose,
    required this.inferenceMs,
    this.rawJointScores,
    this.imageWidth,
    this.imageHeight,
  });

  final bool dogDetected;
  final double? detectionConfidence;
  final NormalizedDogBox? dogBoundingBox;
  final QuadrupedPose? pose;
  final int? inferenceMs;
  final List<double>? rawJointScores;
  final int? imageWidth, imageHeight;
}

abstract interface class QuadrupedPoseModel {
  Future<void> warmup();

  Future<QuadrupedPoseInference> infer(
    CameraFrame frame,
    NormalizedDogBox dogBoundingBox,
  );

  Future<void> dispose();
}
