import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/tracked_dog_roi.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/camera_frame_source.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/flutter_frame_preprocessors.dart';
import 'package:image/image.dart' as img;

Future<File> _imageFile(
  Directory directory, {
  int width = 100,
  int height = 50,
  int red = 128,
  int green = 64,
  int blue = 32,
}) async {
  final image = img.Image(width: width, height: height, numChannels: 3);
  for (final pixel in image) {
    pixel
      ..r = red
      ..g = green
      ..b = blue;
  }
  final file = File(directory.path + '/frame.jpg');
  await file.writeAsBytes(img.encodeJpg(image, quality: 100));
  return file;
}

CameraFrame _frame(File file, {int width = 100, int height = 50}) {
  return CameraFrame(
    id: 'frame-1',
    capturedAt: '2026-10-04T10:00:00.000Z',
    width: width,
    height: height,
    rotationDegrees: 0,
    uri: file.uri.toString(),
  );
}

void main() {
  late Directory temp;

  setUp(() async {
    temp = await Directory.systemTemp.createTemp('gda-frame-preprocess-');
  });

  tearDown(() async {
    if (await temp.exists()) {
      await temp.delete(recursive: true);
    }
  });

  test('detector preprocessor stretches full frame to 640 and normalizes RGB',
      () async {
    final file = await _imageFile(temp);
    final prepared = await const FlutterFileDogDetectorPreprocessor().prepare(
      _frame(file),
    );

    expect(prepared.dimensions, <int>[1, 3, 640, 640]);
    expect(prepared.data, hasLength(3 * 640 * 640));

    const plane = 640 * 640;
    expect(prepared.data[0], closeTo(128 / 255, 0.025));
    expect(prepared.data[plane], closeTo(64 / 255, 0.025));
    expect(prepared.data[plane * 2], closeTo(32 / 255, 0.025));
    expect(prepared.data.every((value) => value >= 0 && value <= 1), isTrue);
  });

  test('pose preprocessor uses canonical tracked ROI and raw RGB magnitudes',
      () async {
    final file = await _imageFile(temp);
    const dogBox = NormalizedDogBox(
      left: 0.60,
      top: 0.20,
      width: 0.20,
      height: 0.40,
    );

    final prepared = await const FlutterFileQuadrupedPreprocessor().prepare(
      _frame(file),
      dogBox,
    );

    expect(prepared.dimensions, <int>[1, 3, 256, 256]);
    expect(prepared.data, hasLength(3 * 256 * 256));

    const plane = 256 * 256;
    expect(prepared.data[0], closeTo(128, 6));
    expect(prepared.data[plane], closeTo(64, 6));
    expect(prepared.data[plane * 2], closeTo(32, 6));
    expect(prepared.data[0], greaterThan(1));

    final expected = trackedDogSquareCrop(100, 50, dogBox).normalized(100, 50);
    expect(prepared.crop.left, closeTo(expected.left, 0.000001));
    expect(prepared.crop.top, closeTo(expected.top, 0.000001));
    expect(prepared.crop.width, closeTo(expected.width, 0.000001));
    expect(prepared.crop.height, closeTo(expected.height, 0.000001));
  });

  test('preprocessors reject frames without a local file URI', () async {
    final detector = const FlutterFileDogDetectorPreprocessor();
    final frame = CameraFrame(
      id: 'missing',
      capturedAt: '2026-10-04T10:00:00.000Z',
      width: 100,
      height: 50,
      rotationDegrees: 0,
      uri: 'https://example.com/frame.jpg',
    );

    await expectLater(detector.prepare(frame), throwsA(isA<StateError>()));
  });

  test('corrupt camera file fails closed during decode', () async {
    final file = File(temp.path + '/bad.jpg');
    await file.writeAsBytes(<int>[1, 2, 3, 4, 5]);

    await expectLater(
      const FlutterFileDogDetectorPreprocessor().prepare(_frame(file)),
      throwsA(isA<StateError>()),
    );
  });
}
