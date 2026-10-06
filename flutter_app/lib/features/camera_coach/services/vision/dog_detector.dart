import '../../domain/dog_tracking.dart';
import '../camera/camera_frame_source.dart';

class DogDetectorResult {
  const DogDetectorResult({
    required this.detections,
    required this.inferenceMs,
    required this.model,
    this.imageWidth,
    this.imageHeight,
  });

  /// Ranked strongest-first by the detector implementation.
  final List<DogDetection> detections;
  final int? inferenceMs;
  final String model;
  final int? imageWidth, imageHeight;
}

abstract interface class DogDetector {
  Future<void> warmup();
  Future<DogDetectorResult> detect(CameraFrame frame);
  Future<void> dispose();
}
