import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/camera_frame_source.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/yolo_detector_input_tensor.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/yolo_dog_detection_decoder.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/yolo_dog_detector_runtime.dart';

class _Preprocessor implements DogDetectorFramePreprocessor {
  _Preprocessor({
    this.dimensions = const <int>[1, 3, 640, 640],
  });

  final List<int> dimensions;
  int calls = 0;

  @override
  Future<PreparedDogDetectorInput> prepare(CameraFrame frame) async {
    calls++;
    return PreparedDogDetectorInput(
      data: Float32List(
        yoloDetectorTensorChannels *
            yoloDetectorTensorSize *
            yoloDetectorTensorSize,
      ),
      dimensions: dimensions,
    );
  }
}

class _Runtime implements DogDetectionTensorRuntime {
  int warmups = 0;
  int calls = 0;
  int disposals = 0;
  List<int>? receivedDimensions;

  @override
  String get backendLabel => 'fake-runtime';

  @override
  Future<void> warmup() async {
    warmups++;
  }

  @override
  Future<DogDetectionTensorOutput> run(
    Float32List input,
    List<int> dimensions,
  ) async {
    calls++;
    receivedDimensions = dimensions;

    final data = Float32List(300 * 6);
    data[0] = 64;
    data[1] = 128;
    data[2] = 320;
    data[3] = 512;
    data[4] = 0.9;
    data[5] = yoloDogClassId.toDouble();

    return DogDetectionTensorOutput(
      data: data,
      dimensions: const <int>[1, 300, 6],
    );
  }

  @override
  Future<void> dispose() async {
    disposals++;
  }
}

const _frame = CameraFrame(
  id: 'frame-1',
  capturedAt: '2026-10-04T10:00:00.000Z',
  width: 1280,
  height: 720,
  rotationDegrees: 0,
);

void main() {
  test('warmup and dispose are delegated to the selected backend', () async {
    final runtime = _Runtime();
    final detector = YoloTensorDogDetector(
      preprocessor: _Preprocessor(),
      runtime: runtime,
      modelLabel: 'candidate-detector',
    );

    await detector.warmup();
    await detector.dispose();

    expect(runtime.warmups, 1);
    expect(runtime.disposals, 1);
  });

  test('valid runtime output decodes into dog detections', () async {
    final runtime = _Runtime();
    final detector = YoloTensorDogDetector(
      preprocessor: _Preprocessor(),
      runtime: runtime,
      modelLabel: 'candidate-detector',
    );

    final result = await detector.detect(_frame);

    expect(runtime.calls, 1);
    expect(runtime.receivedDimensions, <int>[1, 3, 640, 640]);
    expect(result.detections, hasLength(1));
    expect(result.detections.single.confidence, closeTo(0.9, 0.0001));
    expect(result.model, 'candidate-detector/fake-runtime');
    expect(result.inferenceMs, isNotNull);
  });

  test('malformed detector input never reaches the runtime', () async {
    final runtime = _Runtime();
    final detector = YoloTensorDogDetector(
      preprocessor: _Preprocessor(
        dimensions: const <int>[1, 3, 320, 320],
      ),
      runtime: runtime,
      modelLabel: 'candidate-detector',
    );

    await expectLater(
      detector.detect(_frame),
      throwsA(isA<StateError>()),
    );
    expect(runtime.calls, 0);
  });
}
