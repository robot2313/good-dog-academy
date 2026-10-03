import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/dog_tracking.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_heatmap_decoder.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_input_tensor.dart';
import 'package:good_dog_academy/features/camera_coach/domain/quadruped_pose.dart';
import 'package:good_dog_academy/features/camera_coach/domain/tracked_dog_roi.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/camera_frame_source.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/quadruped_pose_runtime.dart';

class _Preprocessor implements QuadrupedFramePreprocessor {
  _Preprocessor({
    this.dimensions = const <int>[1, 3, 256, 256],
  });

  final List<int> dimensions;
  int calls = 0;

  @override
  Future<PreparedQuadrupedInput> prepare(
    CameraFrame frame,
    NormalizedDogBox dogBoundingBox,
  ) async {
    calls++;
    return PreparedQuadrupedInput(
      data: Float32List(
        quadrupedInputChannels * quadrupedInputSize * quadrupedInputSize,
      ),
      dimensions: dimensions,
      crop: const NormalizedCropRect(
        left: 0.20,
        top: 0.10,
        width: 0.40,
        height: 0.50,
      ),
    );
  }
}

class _Runtime implements QuadrupedHeatmapRuntime {
  _Runtime({
    this.outputDimensions = const <int>[1, 17, 64, 64],
  });

  final List<int> outputDimensions;
  int warmups = 0;
  int calls = 0;
  int disposals = 0;
  List<int>? receivedDimensions;

  @override
  Future<void> warmup() async {
    warmups++;
  }

  @override
  Future<QuadrupedHeatmapOutput> run(
    Float32List input,
    List<int> dimensions,
  ) async {
    calls++;
    receivedDimensions = dimensions;
    final channelSize = quadrupedHeatmapSize * quadrupedHeatmapSize;
    final data = Float32List(quadrupedKeypointCount * channelSize);
    for (var channel = 0; channel < quadrupedKeypointCount; channel++) {
      data[channel * channelSize + 32 * quadrupedHeatmapSize + 16] = 0.9;
    }
    return QuadrupedHeatmapOutput(
      data: data,
      dimensions: outputDimensions,
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

const _box = NormalizedDogBox(
  left: 0.2,
  top: 0.2,
  width: 0.4,
  height: 0.5,
);

void main() {
  test('warmup and dispose are delegated to the selected backend', () async {
    final runtime = _Runtime();
    final model = HeatmapQuadrupedPoseModel(
      preprocessor: _Preprocessor(),
      runtime: runtime,
    );

    await model.warmup();
    await model.dispose();

    expect(runtime.warmups, 1);
    expect(runtime.disposals, 1);
  });

  test('valid heatmaps decode and map back into the tracked frame crop', () async {
    final runtime = _Runtime();
    final model = HeatmapQuadrupedPoseModel(
      preprocessor: _Preprocessor(),
      runtime: runtime,
    );

    final result = await model.infer(_frame, _box);

    expect(runtime.calls, 1);
    expect(runtime.receivedDimensions, <int>[1, 3, 256, 256]);
    expect(result.dogDetected, isTrue);
    expect(result.dogBoundingBox, _box);

    final leftEye = result.pose!.point(QuadrupedJoint.leftEye);
    expect(leftEye.x, closeTo(0.30, 0.01));
    expect(leftEye.y, closeTo(0.35, 0.01));
    expect(leftEye.confidence, closeTo(0.9, 0.01));
  });

  test('unexpected model output shape fails closed before evidence decoding',
      () async {
    final model = HeatmapQuadrupedPoseModel(
      preprocessor: _Preprocessor(),
      runtime: _Runtime(
        outputDimensions: const <int>[1, 17, 32, 32],
      ),
    );

    await expectLater(
      model.infer(_frame, _box),
      throwsA(isA<StateError>()),
    );
  });

  test('unexpected model input shape never reaches the runtime', () async {
    final runtime = _Runtime();
    final model = HeatmapQuadrupedPoseModel(
      preprocessor: _Preprocessor(
        dimensions: const <int>[1, 3, 128, 128],
      ),
      runtime: runtime,
    );

    await expectLater(
      model.infer(_frame, _box),
      throwsA(isA<StateError>()),
    );
    expect(runtime.calls, 0);
  });
}
