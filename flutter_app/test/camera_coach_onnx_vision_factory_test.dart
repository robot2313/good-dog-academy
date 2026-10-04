import 'package:flutter_onnxruntime/flutter_onnxruntime.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/flutter_frame_preprocessors.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/flutter_onnx_tensor_runtime.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/onnx_dog_vision_engine_factory.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/quadruped_pose_runtime.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/yolo_dog_detector_runtime.dart';

void main() {
  test('factory composes detector tracker and pose without loading models', () {
    const options = DogTrackerOptions(
      minDetectionConfidence: 0.72,
      maxMisses: 2,
    );
    final engine = createOnnxDogVisionEngine(
      const OnnxDogVisionEngineConfig(
        detectorModelLocation: 'assets/models/reviewed-detector.onnx',
        detectorModelSource: FlutterOnnxModelSource.asset,
        detectorModelLabel: 'reviewed-dog-detector',
        poseModelLocation: 'assets/models/reviewed-pose.onnx',
        poseModelSource: FlutterOnnxModelSource.asset,
        preferredProviders: <OrtProvider>[
          OrtProvider.XNNPACK,
          OrtProvider.CPU,
        ],
        trackerOptions: options,
      ),
    );

    expect(engine.tracker.options.minDetectionConfidence, 0.72);
    expect(engine.tracker.options.maxMisses, 2);

    final detector = engine.detector as YoloTensorDogDetector;
    expect(detector.modelLabel, 'reviewed-dog-detector');
    expect(detector.preprocessor, isA<FlutterFileDogDetectorPreprocessor>());
    expect(detector.runtime, isA<OnnxDogDetectionTensorRuntime>());
    expect(
      (detector.runtime as OnnxDogDetectionTensorRuntime)
          .executor
          .backendLabel,
      'onnxruntime/uninitialized',
    );

    final pose = engine.poseModel as HeatmapQuadrupedPoseModel;
    expect(pose.preprocessor, isA<FlutterFileQuadrupedPreprocessor>());
    expect(pose.runtime, isA<OnnxQuadrupedHeatmapRuntime>());
  });

  test('factory rejects blank detector model labels before model loading', () {
    expect(
      () => createOnnxDogVisionEngine(
        const OnnxDogVisionEngineConfig(
          detectorModelLocation: '/tmp/detector.onnx',
          detectorModelSource: FlutterOnnxModelSource.file,
          detectorModelLabel: '   ',
          poseModelLocation: '/tmp/pose.onnx',
          poseModelSource: FlutterOnnxModelSource.file,
        ),
      ),
      throwsArgumentError,
    );
  });
}
