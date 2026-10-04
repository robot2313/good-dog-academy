import 'package:flutter_onnxruntime/flutter_onnxruntime.dart';

import '../../domain/dog_tracking.dart';
import 'detector_first_dog_vision_engine.dart';
import 'flutter_frame_preprocessors.dart';
import 'flutter_onnx_tensor_runtime.dart';
import 'quadruped_pose_runtime.dart';
import 'yolo_dog_detector_runtime.dart';

class OnnxDogVisionEngineConfig {
  const OnnxDogVisionEngineConfig({
    required this.detectorModelLocation,
    required this.detectorModelSource,
    required this.detectorModelLabel,
    required this.poseModelLocation,
    required this.poseModelSource,
    this.detectorInputName,
    this.detectorOutputName,
    this.poseInputName,
    this.poseOutputName,
    this.preferredProviders = const <OrtProvider>[
      OrtProvider.XNNPACK,
      OrtProvider.CPU,
    ],
    this.trackerOptions = const DogTrackerOptions(),
  });

  final String detectorModelLocation;
  final FlutterOnnxModelSource detectorModelSource;
  final String detectorModelLabel;
  final String poseModelLocation;
  final FlutterOnnxModelSource poseModelSource;

  final String? detectorInputName;
  final String? detectorOutputName;
  final String? poseInputName;
  final String? poseOutputName;

  final List<OrtProvider> preferredProviders;
  final DogTrackerOptions trackerOptions;
}

/// Composes the production detector-first pipeline around reviewed model files.
///
/// This factory does not decide whether a model is legally or empirically safe
/// to ship. Callers must only provide model artifacts that have separately
/// passed licensing review and device acceptance testing. Nothing is loaded
/// until the returned engine is warmed.
DetectorFirstDogVisionEngine createOnnxDogVisionEngine(
  OnnxDogVisionEngineConfig config,
) {
  if (config.detectorModelLabel.trim().isEmpty) {
    throw ArgumentError.value(
      config.detectorModelLabel,
      'detectorModelLabel',
      'Detector model label must not be empty.',
    );
  }

  final detectorExecutor = FlutterOnnxFloatTensorExecutor(
    modelLocation: config.detectorModelLocation,
    modelSource: config.detectorModelSource,
    inputName: config.detectorInputName,
    outputName: config.detectorOutputName,
    preferredProviders: config.preferredProviders,
  );
  final poseExecutor = FlutterOnnxFloatTensorExecutor(
    modelLocation: config.poseModelLocation,
    modelSource: config.poseModelSource,
    inputName: config.poseInputName,
    outputName: config.poseOutputName,
    preferredProviders: config.preferredProviders,
  );

  final detector = YoloTensorDogDetector(
    preprocessor: const FlutterFileDogDetectorPreprocessor(),
    runtime: OnnxDogDetectionTensorRuntime(detectorExecutor),
    modelLabel: config.detectorModelLabel,
  );
  final pose = HeatmapQuadrupedPoseModel(
    preprocessor: const FlutterFileQuadrupedPreprocessor(),
    runtime: OnnxQuadrupedHeatmapRuntime(poseExecutor),
  );

  return DetectorFirstDogVisionEngine(
    detector: detector,
    tracker: DogTracker(options: config.trackerOptions),
    poseModel: pose,
  );
}
