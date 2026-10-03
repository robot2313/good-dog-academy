import 'dog_tracking.dart';

enum SmartFramingStatus {
  waiting,
  good,
  moveCameraLeft,
  moveCameraRight,
  moveCameraUp,
  moveCameraDown,
  moveCameraBack,
  moveCameraCloser,
  dogNotInView,
}

class SmartFramingResult {
  const SmartFramingResult({
    required this.status,
    required this.instruction,
    required this.ready,
  });

  final SmartFramingStatus status;
  final String instruction;
  final bool ready;
}

SmartFramingResult analyseSmartFraming(
  NormalizedDogBox? box,
  double trackingConfidence, {
  DogTrackingState? trackingState,
}) {
  if (box == null ||
      trackingConfidence < 0.35 ||
      trackingState == DogTrackingState.temporarilyLost ||
      trackingState == DogTrackingState.reacquiring) {
    return const SmartFramingResult(
      status: SmartFramingStatus.dogNotInView,
      instruction: 'Keep your dog in view.',
      ready: false,
    );
  }

  final right = box.left + box.width;
  final bottom = box.top + box.height;
  final centerX = box.left + box.width / 2;
  final centerY = box.top + box.height / 2;
  final area = box.width * box.height;

  if (_clamp01(box.left) < 0.06) {
    return const SmartFramingResult(
      status: SmartFramingStatus.moveCameraRight,
      instruction: 'Move the camera right.',
      ready: false,
    );
  }
  if (right > 0.94) {
    return const SmartFramingResult(
      status: SmartFramingStatus.moveCameraLeft,
      instruction: 'Move the camera left.',
      ready: false,
    );
  }
  if (box.top < 0.05) {
    return const SmartFramingResult(
      status: SmartFramingStatus.moveCameraDown,
      instruction: 'Move the camera down.',
      ready: false,
    );
  }
  if (bottom > 0.94) {
    return const SmartFramingResult(
      status: SmartFramingStatus.moveCameraUp,
      instruction: 'Move the camera up.',
      ready: false,
    );
  }

  if (area > 0.58 || box.width > 0.82 || box.height > 0.82) {
    return const SmartFramingResult(
      status: SmartFramingStatus.moveCameraBack,
      instruction: 'Move the camera back.',
      ready: false,
    );
  }

  if (area < 0.07 || box.width < 0.22 || box.height < 0.22) {
    return const SmartFramingResult(
      status: SmartFramingStatus.moveCameraCloser,
      instruction: 'Move the camera closer.',
      ready: false,
    );
  }

  if (centerX < 0.30) {
    return const SmartFramingResult(
      status: SmartFramingStatus.moveCameraRight,
      instruction: 'Move the camera right.',
      ready: false,
    );
  }
  if (centerX > 0.70) {
    return const SmartFramingResult(
      status: SmartFramingStatus.moveCameraLeft,
      instruction: 'Move the camera left.',
      ready: false,
    );
  }
  if (centerY < 0.27) {
    return const SmartFramingResult(
      status: SmartFramingStatus.moveCameraDown,
      instruction: 'Move the camera down.',
      ready: false,
    );
  }
  if (centerY > 0.73) {
    return const SmartFramingResult(
      status: SmartFramingStatus.moveCameraUp,
      instruction: 'Move the camera up.',
      ready: false,
    );
  }

  return const SmartFramingResult(
    status: SmartFramingStatus.good,
    instruction: 'Good — your dog is ready.',
    ready: true,
  );
}

double _clamp01(double value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
