import '../../domain/camera_coach_models.dart';
import '../camera/camera_frame_source.dart';

abstract interface class DogVisionEngine {
  Future<void> warmup();
  Future<DogVisionResult> detect(CameraFrame frame);
  Future<void> dispose();
}

/// Optional lifecycle boundary so a paused camera cannot retain temporal truth.
abstract interface class ResettableDogVisionEngine {
  void resetTemporalState();
}
