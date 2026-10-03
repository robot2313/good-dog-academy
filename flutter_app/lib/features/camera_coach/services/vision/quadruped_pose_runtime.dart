import 'dart:typed_data';

import '../../domain/dog_tracking.dart';
import '../../domain/quadruped_heatmap_decoder.dart';
import '../../domain/tracked_dog_roi.dart';
import '../camera/camera_frame_source.dart';
import 'quadruped_pose_model.dart';

class PreparedQuadrupedInput {
  const PreparedQuadrupedInput({
    required this.data,
    required this.dimensions,
    required this.crop,
  });

  final Float32List data;
  final List<int> dimensions;
  final NormalizedCropRect crop;
}

abstract interface class QuadrupedFramePreprocessor {
  Future<PreparedQuadrupedInput> prepare(
    CameraFrame frame,
    NormalizedDogBox dogBoundingBox,
  );
}

class QuadrupedHeatmapOutput {
  const QuadrupedHeatmapOutput({
    required this.data,
    required this.dimensions,
  });

  final Float32List data;
  final List<int> dimensions;
}

abstract interface class QuadrupedHeatmapRuntime {
  Future<void> warmup();

  Future<QuadrupedHeatmapOutput> run(
    Float32List input,
    List<int> dimensions,
  );

  Future<void> dispose();
}

/// Runtime-neutral pose-model adapter.
///
/// A platform backend (Core ML, LiteRT, ONNX, or another reviewed runtime)
/// only needs to implement [QuadrupedHeatmapRuntime]. The training contract,
/// output validation, heatmap decoding and crop remapping stay identical.
class HeatmapQuadrupedPoseModel implements QuadrupedPoseModel {
  HeatmapQuadrupedPoseModel({
    required this.preprocessor,
    required this.runtime,
  });

  final QuadrupedFramePreprocessor preprocessor;
  final QuadrupedHeatmapRuntime runtime;

  @override
  Future<void> warmup() => runtime.warmup();

  @override
  Future<QuadrupedPoseInference> infer(
    CameraFrame frame,
    NormalizedDogBox dogBoundingBox,
  ) async {
    final prepared = await preprocessor.prepare(frame, dogBoundingBox);
    _validateInput(prepared);

    final stopwatch = Stopwatch()..start();
    final output = await runtime.run(
      prepared.data,
      List<int>.unmodifiable(prepared.dimensions),
    );
    stopwatch.stop();

    if (!isExpectedQuadrupedHeatmapShape(output.dimensions)) {
      throw StateError(
        'Unexpected quadruped pose output shape: '
        '[${output.dimensions.join(', ')}].',
      );
    }

    final cropPose = decodeQuadrupedHeatmaps(output.data);
    final pose = mapQuadrupedPoseFromCrop(cropPose, prepared.crop);

    // Dog presence is inherited from the detector-certified ROI supplied by
    // the caller. Pose heatmaps never create an independent dog detection.
    return QuadrupedPoseInference(
      dogDetected: true,
      detectionConfidence: null,
      dogBoundingBox: dogBoundingBox,
      pose: pose,
      inferenceMs: stopwatch.elapsedMilliseconds,
    );
  }

  @override
  Future<void> dispose() => runtime.dispose();

  void _validateInput(PreparedQuadrupedInput prepared) {
    const expectedDimensions = <int>[1, 3, 256, 256];
    if (prepared.dimensions.length != expectedDimensions.length) {
      throw StateError('Quadruped pose input must have shape [1, 3, 256, 256].');
    }
    for (var index = 0; index < expectedDimensions.length; index++) {
      if (prepared.dimensions[index] != expectedDimensions[index]) {
        throw StateError(
          'Quadruped pose input must have shape [1, 3, 256, 256].',
        );
      }
    }

    const expectedValues = 3 * 256 * 256;
    if (prepared.data.length != expectedValues) {
      throw StateError(
        'Quadruped pose input must contain $expectedValues float values.',
      );
    }
  }
}
