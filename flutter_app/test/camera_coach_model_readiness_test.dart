import 'package:flutter/widgets.dart';
import 'package:flutter_onnxruntime/flutter_onnxruntime.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/flutter_onnx_tensor_runtime.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/model_readiness.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/onnx_dog_vision_engine_factory.dart';

ReviewedVisionModel _detector({
  VisionModelReviewStatus license = VisionModelReviewStatus.approved,
  VisionModelReviewStatus validation = VisionModelReviewStatus.approved,
  List<int> output = const <int>[1, 84, 8400],
}) {
  return ReviewedVisionModel(
    id: 'dog-detector',
    version: '1.0.0',
    location: 'assets/models/detector.onnx',
    source: FlutterOnnxModelSource.asset,
    inputName: 'images',
    outputName: 'output0',
    tensorContract: VisionTensorContract(
      inputShape: const <int>[1, 3, 640, 640],
      outputShapes: <List<int>>[output],
    ),
    licenseReview: license,
    deviceValidation: validation,
    reviewNotes: 'reviewed',
  );
}

ReviewedVisionModel _pose({
  VisionModelReviewStatus license = VisionModelReviewStatus.approved,
  VisionModelReviewStatus validation = VisionModelReviewStatus.approved,
  List<int> input = const <int>[1, 3, 256, 256],
}) {
  return ReviewedVisionModel(
    id: 'dog-pose',
    version: '1.0.0',
    location: 'assets/models/pose.onnx',
    source: FlutterOnnxModelSource.asset,
    inputName: 'input',
    outputName: 'heatmaps',
    tensorContract: VisionTensorContract(
      inputShape: input,
      outputShapes: const <List<int>>[
        <int>[1, 17, 64, 64],
      ],
    ),
    licenseReview: license,
    deviceValidation: validation,
    reviewNotes: 'reviewed',
  );
}

void main() {
  test('approved reviewed bundle maps to production ONNX config', () {
    final bundle = ReviewedDogVisionBundle(
      detector: _detector(),
      pose: _pose(),
    );

    final config = reviewedBundleToOnnxConfig(bundle);

    expect(config.detectorModelLabel, 'dog-detector@1.0.0');
    expect(config.detectorModelLocation, 'assets/models/detector.onnx');
    expect(config.poseModelLocation, 'assets/models/pose.onnx');
    expect(config.detectorInputName, 'images');
    expect(config.poseOutputName, 'heatmaps');
    expect(
      config.preferredProviders,
      const <OrtProvider>[OrtProvider.XNNPACK, OrtProvider.CPU],
    );
  });

  test('pending detector licensing blocks production readiness', () {
    final bundle = ReviewedDogVisionBundle(
      detector: _detector(license: VisionModelReviewStatus.pending),
      pose: _pose(),
    );

    expect(
      () => validateReviewedDogVisionBundle(bundle),
      throwsA(isA<VisionModelReadinessException>()),
    );
  });

  test('pending pose device validation blocks production readiness', () {
    final bundle = ReviewedDogVisionBundle(
      detector: _detector(),
      pose: _pose(validation: VisionModelReviewStatus.pending),
    );

    expect(
      () => validateReviewedDogVisionBundle(bundle),
      throwsA(isA<VisionModelReadinessException>()),
    );
  });

  test('detector accepts supported dynamic YOLO prediction count', () {
    final bundle = ReviewedDogVisionBundle(
      detector: _detector(output: const <int>[1, 84, 25200]),
      pose: _pose(),
    );

    expect(() => validateReviewedDogVisionBundle(bundle), returnsNormally);
  });

  test('wrong pose input contract is rejected', () {
    final bundle = ReviewedDogVisionBundle(
      detector: _detector(),
      pose: _pose(input: const <int>[1, 3, 224, 224]),
    );

    expect(
      () => validateReviewedDogVisionBundle(bundle),
      throwsA(isA<VisionModelReadinessException>()),
    );
  });

  test('empty model identity is rejected before runtime construction', () {
    final badDetector = ReviewedVisionModel(
      id: ' ',
      version: '1.0.0',
      location: 'detector.onnx',
      source: FlutterOnnxModelSource.file,
      inputName: null,
      outputName: null,
      tensorContract: requiredDogDetectorTensorContract,
      licenseReview: VisionModelReviewStatus.approved,
      deviceValidation: VisionModelReviewStatus.approved,
      reviewNotes: '',
    );

    expect(
      () => validateReviewedDogVisionBundle(
        ReviewedDogVisionBundle(
          detector: badDetector,
          pose: _pose(),
        ),
      ),
      throwsA(isA<VisionModelReadinessException>()),
    );
  });
}
