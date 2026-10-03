import 'dart:typed_data';

import '../camera/camera_frame_source.dart';
import 'dog_detector.dart';
import 'yolo_detector_input_tensor.dart';
import 'yolo_dog_detection_decoder.dart';

class PreparedDogDetectorInput {
  const PreparedDogDetectorInput({
    required this.data,
    required this.dimensions,
  });

  final Float32List data;
  final List<int> dimensions;
}

abstract interface class DogDetectorFramePreprocessor {
  Future<PreparedDogDetectorInput> prepare(CameraFrame frame);
}

class DogDetectionTensorOutput {
  const DogDetectionTensorOutput({
    required this.data,
    required this.dimensions,
  });

  final Float32List data;
  final List<int> dimensions;
}

abstract interface class DogDetectionTensorRuntime {
  String get backendLabel;

  Future<void> warmup();

  Future<DogDetectionTensorOutput> run(
    Float32List input,
    List<int> dimensions,
  );

  Future<void> dispose();
}

/// Backend-neutral YOLO detector adapter.
///
/// The selected platform runtime is responsible only for executing a tensor.
/// Input validation, YOLO decoding, dog-class filtering and NMS stay in the
/// shared Camera Coach layer.
class YoloTensorDogDetector implements DogDetector {
  YoloTensorDogDetector({
    required this.preprocessor,
    required this.runtime,
    required this.modelLabel,
  });

  final DogDetectorFramePreprocessor preprocessor;
  final DogDetectionTensorRuntime runtime;
  final String modelLabel;

  @override
  Future<void> warmup() => runtime.warmup();

  @override
  Future<DogDetectorResult> detect(CameraFrame frame) async {
    final prepared = await preprocessor.prepare(frame);
    _validateInput(prepared);

    final stopwatch = Stopwatch()..start();
    final output = await runtime.run(
      prepared.data,
      List<int>.unmodifiable(prepared.dimensions),
    );
    stopwatch.stop();

    return DogDetectorResult(
      detections: decodeYoloDogDetections(
        output.data,
        output.dimensions,
      ),
      inferenceMs: stopwatch.elapsedMilliseconds,
      model: '$modelLabel/${runtime.backendLabel}',
    );
  }

  @override
  Future<void> dispose() => runtime.dispose();

  void _validateInput(PreparedDogDetectorInput prepared) {
    const expectedDimensions = <int>[1, 3, 640, 640];
    if (prepared.dimensions.length != expectedDimensions.length) {
      throw StateError(
        'Dog detector input must have shape [1, 3, 640, 640].',
      );
    }
    for (var index = 0; index < expectedDimensions.length; index++) {
      if (prepared.dimensions[index] != expectedDimensions[index]) {
        throw StateError(
          'Dog detector input must have shape [1, 3, 640, 640].',
        );
      }
    }

    const expectedValues =
        yoloDetectorTensorChannels *
        yoloDetectorTensorSize *
        yoloDetectorTensorSize;
    if (prepared.data.length != expectedValues) {
      throw StateError(
        'Dog detector input must contain $expectedValues float values.',
      );
    }
  }
}
