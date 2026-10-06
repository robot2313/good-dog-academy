import '../../domain/camera_coach_models.dart';
import '../../domain/dog_tracking.dart';
import '../../domain/pose_diagnostics.dart';
import '../../domain/qa_limb_posture.dart';
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
    this.qaLimbPosture = false,
    VisionNowMs? nowMs,
    VisionNowIso? nowIso,
  }) : _nowMs = nowMs ?? (() => DateTime.now().millisecondsSinceEpoch),
       _nowIso = nowIso ?? (() => DateTime.now().toUtc().toIso8601String());

  final DogDetector detector;
  final DogTracker tracker;
  final QuadrupedPoseModel poseModel;
  final bool qaLimbPosture;
  final QaPostureConfirmation _confirmation = QaPostureConfirmation();
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
    final nowMs = _nowMs();
    final tracking = tracker.update(detectorResult.detections, nowMs);
    _lastTracking = tracking;

    final matchedDetection = tracking.matchedDetection;

    DogVisionResult common({
      required bool dogDetected,
      required DogPosture? posture,
      required double? postureConfidence,
      bool poseInferenceFailed = false,
      PoseDiagnostics? poseDiagnostics,
    }) {
      return DogVisionResult(
        frameId: frame.id,
        analysedAt: _nowIso(),
        dogDetected: dogDetected,
        rawDogDetected: detectorResult.detections.isNotEmpty,
        poseInferenceFailed: poseInferenceFailed,
        detectionConfidence: matchedDetection?.confidence,
        dogBoundingBox: tracking.box,
        detectionSource: DogDetectionSource.dedicatedDetector,
        trackingConfidence: tracking.trackingConfidence,
        trackingState: tracking.state,
        posture: posture,
        postureConfidence: postureConfidence,
        poseDiagnostics: poseDiagnostics,
        stressSignal: VisionStressSignal.uncertain,
        stressConfidence: null,
      );
    }

    final stableDetectionState =
        tracking.state == DogTrackingState.acquired ||
        tracking.state == DogTrackingState.tracking;

    if (tracking.box == null || !stableDetectionState) {
      if (qaLimbPosture) _confirmation.reset();
      return common(dogDetected: false, posture: null, postureConfidence: null);
    }

    try {
      final inference = await poseModel.infer(frame, tracking.box!);
      final pose = inference.pose;
      if (pose == null) {
        if (qaLimbPosture) _confirmation.reset();
        return common(
          dogDetected: true,
          posture: null,
          postureConfidence: null,
          poseDiagnostics: qaLimbPosture
              ? PoseDiagnostics(
                  reason: 'pose_unavailable',
                  imageWidth: inference.imageWidth ?? frame.width,
                  imageHeight: inference.imageHeight ?? frame.height,
                )
              : null,
        );
      }

      final width =
          inference.imageWidth ?? detectorResult.imageWidth ?? frame.width;
      final height =
          inference.imageHeight ?? detectorResult.imageHeight ?? frame.height;
      final classification = qaLimbPosture
          ? classifyQaLimbPosture(pose, imageWidth: width, imageHeight: height)
          : classifyQuadrupedPosture(pose);
      final confirmed =
          !qaLimbPosture || _confirmation.accept(classification.posture, nowMs);
      final diagnostics = qaLimbPosture
          ? PoseDiagnostics(
              reason: classification.posture != null && !confirmed
                  ? 'confirming_posture'
                  : classification.reason,
              imageWidth: width,
              imageHeight: height,
              rawPosture: classification.posture?.name,
              rawPostureScore: classification.confidence,
              measurements: classification.measurements,
              joints: [
                for (final joint in QuadrupedJoint.values)
                  if (pose.keypoints[joint] case final point?)
                    PoseJointDiagnostic(
                      name: joint.name,
                      x: point.x,
                      y: point.y,
                      quality: point.confidence,
                      nativeScore:
                          inference.rawJointScores != null &&
                              inference.rawJointScores!.length > joint.index
                          ? inference.rawJointScores![joint.index]
                          : null,
                    ),
              ],
            )
          : null;
      return common(
        dogDetected: true,
        posture: confirmed ? classification.posture : null,
        postureConfidence: confirmed ? classification.confidence : null,
        poseDiagnostics: diagnostics,
      );
    } catch (_) {
      if (qaLimbPosture) _confirmation.reset();
      // Detector truth remains valid even if pose inference temporarily fails.
      return common(
        poseInferenceFailed: true,
        dogDetected: true,
        posture: null,
        postureConfidence: null,
        poseDiagnostics: qaLimbPosture
            ? PoseDiagnostics(
                reason: 'pose_inference_failed',
                imageWidth: detectorResult.imageWidth ?? frame.width,
                imageHeight: detectorResult.imageHeight ?? frame.height,
              )
            : null,
      );
    }
  }

  void resetTracking() {
    tracker.reset();
    _lastTracking = null;
    _confirmation.reset();
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
