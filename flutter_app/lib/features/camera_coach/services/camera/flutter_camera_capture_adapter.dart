import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show DeviceOrientation;

import 'polling_camera_frame_source.dart';

/// Thin platform adapter around Flutter's official camera plugin.
///
/// Camera Coach itself only sees [PollingCameraFrameSource] and
/// [CapturedCameraSnapshot]. Keeping [CameraController] here prevents native
/// camera concerns from leaking into tracking, pose, rep scoring or coaching.
class FlutterCameraCaptureAdapter extends ChangeNotifier {
  FlutterCameraCaptureAdapter({
    this.resolutionPreset = ResolutionPreset.medium,
  });

  final ResolutionPreset resolutionPreset;

  CameraController? _controller;
  CameraDescription? _description;
  Object? error;
  bool initializing = false;
  bool initialized = false;
  bool _disposed = false;

  CameraController? get controller => _controller;
  CameraDescription? get description => _description;

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> initialize() async {
    if (initialized || initializing) return;

    initializing = true;
    error = null;
    _notify();

    CameraController? next;
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        throw StateError('No camera is available on this device.');
      }

      final selected = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );
      next = CameraController(
        selected,
        resolutionPreset,
        enableAudio: false,
      );
      await next.initialize();
      try {
        await next.setFlashMode(FlashMode.off);
      } catch (_) {
        // Flash control is not required for Camera Coach operation.
      }

      if (_disposed) {
        await next.dispose();
        return;
      }

      await _controller?.dispose();
      _controller = next;
      _description = selected;
      initialized = true;
    } catch (cause) {
      await next?.dispose();
      error = cause;
      initialized = false;
      rethrow;
    } finally {
      initializing = false;
      _notify();
    }
  }

  PollingCameraFrameSource createPollingSource({
    Duration interval = const Duration(milliseconds: 800),
  }) {
    return PollingCameraFrameSource(
      capture: captureSnapshot,
      interval: interval,
    );
  }

  Future<CapturedCameraSnapshot?> captureSnapshot() async {
    final camera = _controller;
    if (!initialized ||
        camera == null ||
        !camera.value.isInitialized ||
        camera.value.isTakingPicture) {
      return null;
    }

    final file = await camera.takePicture();
    final size = camera.value.previewSize;
    if (size == null || file.path.trim().isEmpty) return null;

    return CapturedCameraSnapshot(
      uri: Uri.file(file.path).toString(),
      width: _positiveDimension(size.width.round()),
      height: _positiveDimension(size.height.round()),
      rotationDegrees: cameraDeviceOrientationDegrees(
        camera.value.deviceOrientation,
      ),
      release: () => _deleteSnapshot(file.path),
    );
  }

  Future<void> shutdown() async {
    final camera = _controller;
    _controller = null;
    _description = null;
    initialized = false;
    error = null;
    if (camera != null) {
      await camera.dispose();
    }
    _notify();
  }

  @override
  void dispose() {
    _disposed = true;
    final camera = _controller;
    _controller = null;
    _description = null;
    initialized = false;
    if (camera != null) {
      unawaited(camera.dispose());
    }
    super.dispose();
  }
}

int cameraDeviceOrientationDegrees(DeviceOrientation orientation) {
  return switch (orientation) {
    DeviceOrientation.portraitUp => 0,
    DeviceOrientation.landscapeLeft => 90,
    DeviceOrientation.portraitDown => 180,
    DeviceOrientation.landscapeRight => 270,
  };
}

int _positiveDimension(int value) => value < 1 ? 1 : value;


Future<void> _deleteSnapshot(String path) async {
  try {
    final file = File(path);
    if (await file.exists()) {
      await file.delete();
    }
  } catch (_) {
    // Camera Coach snapshot cleanup is best-effort.
  }
}
