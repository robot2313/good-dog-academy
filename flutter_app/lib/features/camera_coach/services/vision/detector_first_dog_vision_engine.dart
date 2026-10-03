import '../../domain/camera_coach_models.dart';
import '../../domain/dog_tracking.dart';
import '../../domain/quadruped_pose.dart';
import '../camera/camera_frame_source.dart';
import 'dog_detector.dart';
import 'dog_vision_engine.dart';
import 'quadruped_pose_model.dart';

typedef VisionNowMs = int Function();
typedef VisionNowIso = String Function();

/// Detector-first production composition.
///
/// Camera frame
/// -> dedicated detector
/// -> temporal tracker
/// -> tracked dog ROI
/// -> quadruped pose model
/// -> conservative posture classifier
///
/// The pose model never establishes dog presence. During temporary loss,
/// reacquisition, or lost states this engine fails closed and skips pose
/// scoring. Stress remains uncertain until a separately validated stress
/// signal exists.
class DetectorFirstDogVisionEngine implements DogVisionEngine {
  DetectorFirstDogVisionEngine({
    required this.detector,
    required this.tracker,
    required this.poseModel,
    VisionNowMs? nowMs,
    VisionNowIso? nowIso,
  }) : _nowMs = nowMs ?? (() => DateTime.now().millisecondsSinceEpoch),
       _nowIso = nowIso ?? (() => DateTime.now().toUtc().toIso8601String());

  final DogDetector detector;
  final DogTracker tracker;
  final QuadrupedPoseModel poseModel;
  final VisionNowMs _nowMs;
  final VisionNowIso _nowIso;

  DogTrackingResult? _lastTracking;

  DogTrackingResult? get lastTracking => _lastTracking;

  @override
  Future<void> warmup() async {
    await Future.wait<void>(<Future<void>>[
      detector.warmup(),
      poseModel.warmup(),
    ]);
  }

  @override
  Future<DogVisionResult> detect(CameraFrame frame) async {
    final detectorResult = await detector.detect(frame);
    final tracking = tracker.update(detectorResult.detections, _nowMs());
    _lastTracking = tracking;

    final bestDetection = detectorResult.detections.isEmpty
        ? null
        : detectorResult.detections.first;

    DogVisionResult common({
      required bool dogDetected,
      required DogPosture? posture,
      required double? postureConfidence,
    }) {
      return DogVisionResult(
        frameId: frame.id,
        analysedAt: _nowIso(),
        dogDetected: dogDetected,
        detectionConfidence: bestDetection?.confidence,
        dogBoundingBox: tracking.box,
        detectionSource: DogDetectionSource.dedicatedDetector,
        trackingConfidence: tracking.trackingConfidence,
        trackingState: tracking.state,
        posture: posture,
        postureConfidence: postureConfidence,
        stressSignal: VisionStressSignal.uncertain,
        stressConfidence: null,
      );
    }

    final stableDetectionState =
        tracking.state == DogTrackingState.acquired ||
        tracking.state == DogTrackingState.tracking;

    if (tracking.box == null || !stableDetectionState) {
      return common(
        dogDetected: false,
        posture: null,
        postureConfidence: null,
      );
    }

    try {
      final inference = await poseModel.infer(frame, tracking.box!);
      final pose = inference.pose;
      if (pose == null) {
        return common(
          dogDetected: true,
          posture: null,
          postureConfidence: null,
        );
      }

      final classification = classifyQuadrupedPosture(pose);
      return common(
        dogDetected: true,
        posture: classification.posture,
        postureConfidence: classification.confidence,
      );
    } catch (_) {
      // Detector truth remains valid even if pose inference temporarily fails.
      return common(
        dogDetected: true,
        posture: null,
        postureConfidence: null,
      );
    }
  }

  void resetTracking() {
    tracker.reset();
    _lastTracking = null;
  }

  @override
  Future<void> dispose() async {
    resetTracking();
    await Future.wait<void>(<Future<void>>[
      detector.dispose(),
      poseModel.dispose(),
    ]);
  }
}
