import 'vision_observation.dart';

abstract interface class VisionEngine {
  Future<void> initialize();

  Stream<VisionObservation> get observations;

  Future<void> start();

  Future<void> stop();

  Future<void> dispose();
}
