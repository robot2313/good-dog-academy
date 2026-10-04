import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/camera_coach_capability.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/flutter_onnx_tensor_runtime.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/model_readiness.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/production_vision_capability.dart';

ReviewedDogVisionBundle _bundle({
  VisionModelReviewStatus validation = VisionModelReviewStatus.approved,
}) {
  return ReviewedDogVisionBundle(
    detector: ReviewedVisionModel(
      id: 'detector',
      version: '1',
      location: 'detector.onnx',
      source: FlutterOnnxModelSource.file,
      inputName: null,
      outputName: null,
      tensorContract: const VisionTensorContract(
        inputShape: <int>[1, 3, 640, 640],
        outputShapes: <List<int>>[
          <int>[1, 84, 8400],
        ],
      ),
      licenseReview: VisionModelReviewStatus.approved,
      deviceValidation: validation,
      reviewNotes: '',
    ),
    pose: const ReviewedVisionModel(
      id: 'pose',
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
      reviewNotes: '',
    ),
  );
}

class _Probe extends StatelessWidget {
  const _Probe();

  @override
  Widget build(BuildContext context) {
    final enabled = CameraCoachCapabilityScope.maybeOf(context) != null;
    return Text(enabled ? 'enabled' : 'disabled');
  }
}

void main() {
  testWidgets('no reviewed bundle leaves Camera Coach capability disabled', (
    tester,
  ) async {
    await tester.pumpWidget(
      Directionality(
        textDirection: TextDirection.ltr,
        child: withReviewedCameraCoachCapability(
          child: const _Probe(),
        ),
      ),
    );

    expect(find.text('disabled'), findsOneWidget);
  });

  testWidgets('approved bundle registers capability lazily', (tester) async {
    await tester.pumpWidget(
      Directionality(
        textDirection: TextDirection.ltr,
        child: withReviewedCameraCoachCapability(
          bundle: _bundle(),
          child: const _Probe(),
        ),
      ),
    );

    expect(find.text('enabled'), findsOneWidget);
  });

  testWidgets('unvalidated bundle cannot expose Camera Coach', (tester) async {
    await tester.pumpWidget(
      Directionality(
        textDirection: TextDirection.ltr,
        child: withReviewedCameraCoachCapability(
          bundle: _bundle(validation: VisionModelReviewStatus.pending),
          child: const _Probe(),
        ),
      ),
    );

    expect(find.text('disabled'), findsOneWidget);
  });
}
