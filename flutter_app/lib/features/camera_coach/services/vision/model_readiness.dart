import 'flutter_onnx_tensor_runtime.dart';
import 'onnx_dog_vision_engine_factory.dart';

enum VisionModelReviewStatus {
  pending,
  approved,
  rejected,
}

class VisionTensorContract {
  const VisionTensorContract({
    required this.inputShape,
    required this.outputShapes,
  });

  final List<int> inputShape;
  final List<List<int>> outputShapes;
}

class ReviewedVisionModel {
  const ReviewedVisionModel({
    required this.id,
    required this.version,
    required this.location,
    required this.source,
    required this.inputName,
    required this.outputName,
    required this.tensorContract,
    required this.licenseReview,
    required this.deviceValidation,
    required this.reviewNotes,
  });

  final String id;
  final String version;
  final String location;
  final FlutterOnnxModelSource source;
  final String? inputName;
  final String? outputName;
  final VisionTensorContract tensorContract;
  final VisionModelReviewStatus licenseReview;
  final VisionModelReviewStatus deviceValidation;
  final String reviewNotes;

  bool get approvedForProduction =>
      licenseReview == VisionModelReviewStatus.approved &&
      deviceValidation == VisionModelReviewStatus.approved;
}

class ReviewedDogVisionBundle {
  const ReviewedDogVisionBundle({
    required this.detector,
    required this.pose,
  });

  final ReviewedVisionModel detector;
  final ReviewedVisionModel pose;
}

class VisionModelReadinessException implements Exception {
  const VisionModelReadinessException(this.message);

  final String message;

  @override
  String toString() => 'VisionModelReadinessException: $message';
}

const VisionTensorContract requiredDogDetectorTensorContract =
    VisionTensorContract(
      inputShape: <int>[1, 3, 640, 640],
      outputShapes: <List<int>>[
        <int>[1, 300, 6],
        <int>[1, 84, -1],
      ],
    );

const VisionTensorContract requiredQuadrupedPoseTensorContract =
    VisionTensorContract(
      inputShape: <int>[1, 3, 256, 256],
      outputShapes: <List<int>>[
        <int>[1, 17, 64, 64],
        <int>[17, 64, 64],
      ],
    );

void validateReviewedDogVisionBundle(ReviewedDogVisionBundle bundle) {
  _validateModelIdentity(bundle.detector, 'detector');
  _validateModelIdentity(bundle.pose, 'pose');

  if (!bundle.detector.approvedForProduction) {
    throw const VisionModelReadinessException(
      'Detector model is not approved for production use.',
    );
  }
  if (!bundle.pose.approvedForProduction) {
    throw const VisionModelReadinessException(
      'Pose model is not approved for production use.',
    );
  }

  _validateContract(
    actual: bundle.detector.tensorContract,
    requiredContract: requiredDogDetectorTensorContract,
    label: 'Detector',
  );
  _validateContract(
    actual: bundle.pose.tensorContract,
    requiredContract: requiredQuadrupedPoseTensorContract,
    label: 'Pose',
  );
}

OnnxDogVisionEngineConfig reviewedBundleToOnnxConfig(
  ReviewedDogVisionBundle bundle,
) {
  validateReviewedDogVisionBundle(bundle);

  return OnnxDogVisionEngineConfig(
    detectorModelLocation: bundle.detector.location,
    detectorModelSource: bundle.detector.source,
    detectorModelLabel:
        '${bundle.detector.id}@${bundle.detector.version}',
    poseModelLocation: bundle.pose.location,
    poseModelSource: bundle.pose.source,
    detectorInputName: bundle.detector.inputName,
    detectorOutputName: bundle.detector.outputName,
    poseInputName: bundle.pose.inputName,
    poseOutputName: bundle.pose.outputName,
  );
}

void _validateModelIdentity(ReviewedVisionModel model, String role) {
  if (model.id.trim().isEmpty) {
    throw VisionModelReadinessException(
      '${_title(role)} model id must not be empty.',
    );
  }
  if (model.version.trim().isEmpty) {
    throw VisionModelReadinessException(
      '${_title(role)} model version must not be empty.',
    );
  }
  if (model.location.trim().isEmpty) {
    throw VisionModelReadinessException(
      '${_title(role)} model location must not be empty.',
    );
  }
}

void _validateContract({
  required VisionTensorContract actual,
  required VisionTensorContract requiredContract,
  required String label,
}) {
  if (!_shapeMatches(actual.inputShape, requiredContract.inputShape)) {
    throw VisionModelReadinessException(
      '$label input shape ${actual.inputShape} does not match '
      'required shape ${requiredContract.inputShape}.',
    );
  }

  final compatible = actual.outputShapes.any(
    (candidate) => requiredContract.outputShapes.any(
      (requiredShape) => _shapeMatches(candidate, requiredShape),
    ),
  );
  if (!compatible) {
    throw VisionModelReadinessException(
      '$label output shapes ${actual.outputShapes} do not match any '
      'supported production contract.',
    );
  }
}

bool _shapeMatches(List<int> actual, List<int> required) {
  if (actual.length != required.length) return false;

  for (var index = 0; index < actual.length; index++) {
    final requiredDimension = required[index];
    if (requiredDimension == -1) {
      if (actual[index] <= 0) return false;
      continue;
    }
    if (actual[index] != requiredDimension) return false;
  }
  return true;
}

String _title(String value) =>
    value.isEmpty ? value : '${value[0].toUpperCase()}${value.substring(1)}';
