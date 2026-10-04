import 'dart:async';

import 'camera_frame_source.dart';

class CapturedCameraSnapshot {
  const CapturedCameraSnapshot({
    required this.uri,
    required this.width,
    required this.height,
    required this.rotationDegrees,
    this.release,
  });

  final String uri;
  final int width;
  final int height;
  final int rotationDegrees;
  final Future<void> Function()? release;
}

typedef CameraSnapshotCapture = Future<CapturedCameraSnapshot?> Function();
typedef CameraFrameNow = DateTime Function();

/// Dependency-free polling camera source.
///
/// A platform camera adapter supplies [capture]. This class owns scheduling,
/// avoids overlapping captures, converts snapshots into Camera Coach frames,
/// and broadcasts them to subscribers. It deliberately contains no camera
/// plugin imports so domain/runtime tests remain platform independent.
class PollingCameraFrameSource implements CameraFrameSource {
  PollingCameraFrameSource({
    required this.capture,
    this.interval = const Duration(milliseconds: 800),
    CameraFrameNow? now,
  }) : _now = now ?? DateTime.now;

  final CameraSnapshotCapture capture;
  final Duration interval;
  final CameraFrameNow _now;

  final Set<CameraFrameListener> _listeners = <CameraFrameListener>{};
  Timer? _timer;
  bool _running = false;
  bool _captureInFlight = false;
  int _sequence = 0;
  int captureBusySkips = 0;
  int captureErrors = 0;
  Completer<void>? _captureDone;

  /// Call only outside a frame listener, after stop(). This also waits for
  /// a native snapshot already in progress before disposing the camera.
  Future<void> drain() async => await _captureDone?.future;

  bool get running => _running;

  @override
  Future<void> start() async {
    if (_running) return;
    if (interval <= Duration.zero) {
      throw ArgumentError.value(interval, 'interval', 'must be positive');
    }

    _running = true;
    await _captureOnce();
    if (!_running) return;
    _timer = Timer.periodic(interval, (_) {
      unawaited(_captureOnce());
    });
  }

  @override
  Future<void> stop() async {
    _running = false;
    _timer?.cancel();
    _timer = null;
  }

  @override
  CameraFrameSubscription subscribe(CameraFrameListener listener) {
    _listeners.add(listener);
    var subscribed = true;
    return () {
      if (!subscribed) return;
      subscribed = false;
      _listeners.remove(listener);
    };
  }

  Future<void> captureNow() => _captureOnce();

  Future<void> _captureOnce() async {
    if (!_running) return;
    if (_captureInFlight) {
      captureBusySkips++;
      return;
    }
    _captureInFlight = true;
    _captureDone = Completer<void>();
    CapturedCameraSnapshot? snapshot;
    try {
      snapshot = await capture();
      if (!_running || snapshot == null) return;
      if (snapshot.uri.trim().isEmpty ||
          snapshot.width <= 0 ||
          snapshot.height <= 0) {
        return;
      }

      final capturedAt = _now().toUtc();
      final frame = CameraFrame(
        id: 'camera-${capturedAt.microsecondsSinceEpoch}-${++_sequence}',
        capturedAt: capturedAt.toIso8601String(),
        width: snapshot.width,
        height: snapshot.height,
        rotationDegrees: _normaliseRotation(snapshot.rotationDegrees),
        uri: snapshot.uri,
      );
      final listeners = List<CameraFrameListener>.of(_listeners);
      for (final listener in listeners) {
        await listener(frame);
      }
    } catch (_) {
      captureErrors++;
      // A single camera capture or consumer failure must not terminate Camera
      // Coach. The next polling interval can try again.
    } finally {
      if (snapshot != null) {
        try {
          await snapshot.release?.call();
        } catch (_) {
          // Temporary snapshot cleanup is best-effort and never breaks coaching.
        }
      }
      _captureInFlight = false;
      _captureDone?.complete();
      _captureDone = null;
    }
  }

  int _normaliseRotation(int value) {
    final normalised = value % 360;
    return normalised < 0 ? normalised + 360 : normalised;
  }
}
