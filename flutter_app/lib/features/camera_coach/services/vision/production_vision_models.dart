import 'model_readiness.dart';

/// Production Camera Coach model registration.
///
/// Keep this null until BOTH detector and pose artifacts have passed:
/// - commercial/licensing review
/// - real-device acceptance testing
/// - tensor contract verification
///
/// Setting this to an approved [ReviewedDogVisionBundle] is the only intended
/// production switch that exposes Camera Coach through the app capability gate.
const ReviewedDogVisionBundle? productionDogVisionBundle = null;
