import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/flutter_onnx_tensor_runtime.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/model_readiness.dart';
import 'package:good_dog_academy/main.dart';

ReviewedDogVisionBundle _approvedBundle() {
  return const ReviewedDogVisionBundle(
    detector: ReviewedVisionModel(
      id: 'reviewed-detector',
      version: '1',
      location: 'detector.onnx',
      source: FlutterOnnxModelSource.file,
      inputName: null,
      outputName: null,
      tensorContract: VisionTensorContract(
        inputShape: <int>[1, 3, 640, 640],
        outputShapes: <List<int>>[
          <int>[1, 84, 8400],
        ],
      ),
      licenseReview: VisionModelReviewStatus.approved,
      deviceValidation: VisionModelReviewStatus.approved,
      reviewNotes: 'test',
    ),
    pose: ReviewedVisionModel(
      id: 'reviewed-pose',
      version: '1',
      location: 'pose.onnx',
      source: FlutterOnnxModelSource.file,
      inputName: null,
      outputName: null,
      tensorContract: VisionTensorContract(
        inputShape: <int>[1, 3, 256, 256],
        outputShapes: <List<int>>[
          <int>[1, 17, 64, 64],
        ],
      ),
      licenseReview: VisionModelReviewStatus.approved,
      deviceValidation: VisionModelReviewStatus.approved,
      reviewNotes: 'test',
    ),
  );
}

void main() {
  testWidgets('default production app does not expose Camera Coach capability', (
    tester,
  ) async {
    const app = GoodDogAcademyApp();
    expect(app.cameraCoachVisionBundle, isNull);
  });

  testWidgets('approved bundle can be injected at the app boundary', (
    tester,
  ) async {
    final app = GoodDogAcademyApp(
      cameraCoachVisionBundle: _approvedBundle(),
    );

    expect(app.cameraCoachVisionBundle, isNotNull);
  });
}
