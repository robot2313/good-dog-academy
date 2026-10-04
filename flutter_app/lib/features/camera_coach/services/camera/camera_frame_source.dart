import 'dart:async';

class CameraFrame {
  const CameraFrame({
    required this.id,
    required this.capturedAt,
    required this.width,
    required this.height,
    required this.rotationDegrees,
    this.uri,
  });

  final String id;
  final String capturedAt;
  final int width;
  final int height;
  final int rotationDegrees;
  final String? uri;
}

typedef CameraFrameListener = FutureOr<void> Function(CameraFrame frame);
typedef CameraFrameSubscription = void Function();

abstract interface class CameraFrameSource {
  Future<void> start();
  Future<void> stop();
  CameraFrameSubscription subscribe(CameraFrameListener listener);
}
