import 'package:flutter/widgets.dart';

import '../../camera_coach_capability.dart';
import 'model_readiness.dart';
import 'onnx_dog_vision_engine_factory.dart';

/// Wraps the app in Camera Coach capability only after the model bundle has
/// explicitly passed both commercial/licensing review and real-device
/// validation. Pending or rejected bundles leave Camera Coach hidden.
Widget withReviewedCameraCoachCapability({
  required Widget child,
  ReviewedDogVisionBundle? bundle,
}) {
  if (bundle == null) return child;

  try {
    validateReviewedDogVisionBundle(bundle);
  } on VisionModelReadinessException {
    return child;
  }

  return CameraCoachCapabilityScope(
    visionEngineFactory: () => createOnnxDogVisionEngine(
      reviewedBundleToOnnxConfig(bundle),
    ),
    child: child,
  );
}
