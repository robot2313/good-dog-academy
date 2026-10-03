import 'package:flutter/widgets.dart';

import 'services/vision/dog_vision_engine.dart';

typedef CameraCoachVisionEngineFactory = DogVisionEngine Function();

/// Registers a production-ready Camera Coach vision engine with the Flutter UI.
///
/// The normal app intentionally does not provide this scope yet. Lesson screens
/// therefore keep Camera Coach hidden until a real commercial-safe vision
/// engine is wired in. A scope must never be backed by fake or placeholder AI.
class CameraCoachCapabilityScope extends InheritedWidget {
  const CameraCoachCapabilityScope({
    super.key,
    required this.visionEngineFactory,
    required super.child,
  });

  final CameraCoachVisionEngineFactory visionEngineFactory;

  static CameraCoachCapabilityScope? maybeOf(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<CameraCoachCapabilityScope>();
  }

  @override
  bool updateShouldNotify(CameraCoachCapabilityScope oldWidget) {
    return oldWidget.visionEngineFactory != visionEngineFactory;
  }
}
