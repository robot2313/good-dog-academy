import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/camera_frame_source.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/polling_camera_frame_source.dart';

void main() {
  test('start captures immediately and broadcasts a validated frame', () async {
    var calls = 0;
    final source = PollingCameraFrameSource(
      interval: const Duration(hours: 1),
      now: () => DateTime.parse('2026-10-04T10:00:00Z'),
      capture: () async {
        calls++;
        return const CapturedCameraSnapshot(
          uri: 'file:///tmp/frame.jpg',
          width: 1280,
          height: 720,
          rotationDegrees: 450,
        );
      },
    );
    final frames = <CameraFrame>[];
    source.subscribe(frames.add);

    await source.start();

    expect(calls, 1);
    expect(frames, hasLength(1));
    expect(frames.single.uri, 'file:///tmp/frame.jpg');
    expect(frames.single.rotationDegrees, 90);
    expect(frames.single.capturedAt, '2026-10-04T10:00:00.000Z');

    await source.stop();
  });

  test('start and stop are idempotent', () async {
    var calls = 0;
    final source = PollingCameraFrameSource(
      interval: const Duration(hours: 1),
      capture: () async {
        calls++;
        return const CapturedCameraSnapshot(
          uri: 'file:///tmp/frame.jpg',
          width: 100,
          height: 100,
          rotationDegrees: 0,
        );
      },
    );

    await source.start();
    await source.start();
    expect(calls, 1);

    await source.stop();
    await source.stop();
    expect(source.running, isFalse);
  });

  test('unsubscribe stops delivery without stopping source', () async {
    var sequence = 0;
    final source = PollingCameraFrameSource(
      interval: const Duration(hours: 1),
      capture: () async => CapturedCameraSnapshot(
        uri: 'file:///tmp/${++sequence}.jpg',
        width: 100,
        height: 100,
        rotationDegrees: 0,
      ),
    );
    final frames = <CameraFrame>[];
    final unsubscribe = source.subscribe(frames.add);

    await source.start();
    unsubscribe();
    await source.captureNow();

    expect(frames, hasLength(1));
    expect(source.running, isTrue);

    await source.stop();
  });

  test('null invalid and failed captures are ignored safely', () async {
    var call = 0;
    final source = PollingCameraFrameSource(
      interval: const Duration(hours: 1),
      capture: () async {
        call++;
        if (call == 1) return null;
        if (call == 2) {
          return const CapturedCameraSnapshot(
            uri: '',
            width: 100,
            height: 100,
            rotationDegrees: 0,
          );
        }
        if (call == 3) throw StateError('camera busy');
        return const CapturedCameraSnapshot(
          uri: 'file:///tmp/ok.jpg',
          width: 100,
          height: 100,
          rotationDegrees: 0,
        );
      },
    );
    final frames = <CameraFrame>[];
    source.subscribe(frames.add);

    await source.start();
    await source.captureNow();
    await source.captureNow();
    await source.captureNow();

    expect(frames, hasLength(1));
    expect(frames.single.uri, 'file:///tmp/ok.jpg');

    await source.stop();
  });

  test('overlapping capture attempts do not create duplicate work', () async {
    final pending = Completer<CapturedCameraSnapshot?>();
    var calls = 0;
    final source = PollingCameraFrameSource(
      interval: const Duration(hours: 1),
      capture: () {
        calls++;
        return pending.future;
      },
    );

    final starting = source.start();
    await Future<void>.delayed(Duration.zero);
    final second = source.captureNow();
    await Future<void>.delayed(Duration.zero);

    expect(calls, 1);

    pending.complete(
      const CapturedCameraSnapshot(
        uri: 'file:///tmp/frame.jpg',
        width: 100,
        height: 100,
        rotationDegrees: 0,
      ),
    );
    await starting;
    await second;
    await source.stop();
  });

  test('stop during an in-flight capture suppresses late frame delivery', () async {
    final pending = Completer<CapturedCameraSnapshot?>();
    final source = PollingCameraFrameSource(
      interval: const Duration(hours: 1),
      capture: () => pending.future,
    );
    final frames = <CameraFrame>[];
    source.subscribe(frames.add);

    final starting = source.start();
    await Future<void>.delayed(Duration.zero);
    await source.stop();
    pending.complete(
      const CapturedCameraSnapshot(
        uri: 'file:///tmp/late.jpg',
        width: 100,
        height: 100,
        rotationDegrees: 0,
      ),
    );
    await starting;

    expect(frames, isEmpty);
  });

  test('non-positive polling interval is rejected before capture', () async {
    final source = PollingCameraFrameSource(
      interval: Duration.zero,
      capture: () async => null,
    );

    await expectLater(source.start(), throwsArgumentError);
    expect(source.running, isFalse);
  });
}
