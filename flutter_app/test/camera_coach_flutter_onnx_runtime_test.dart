import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/flutter_onnx_tensor_runtime.dart';

class _FakeExecutor implements FloatTensorExecutor {
  String label = 'fake/cpu';
  int warmups = 0;
  int runs = 0;
  int disposals = 0;
  Float32List? lastInput;
  List<int>? lastDimensions;
  FloatTensorResult result = FloatTensorResult(
    data: Float32List.fromList(<double>[1, 2, 3]),
    dimensions: const <int>[1, 3],
  );

  @override
  String get backendLabel => label;

  @override
  Future<void> warmup() async {
    warmups++;
  }

  @override
  Future<FloatTensorResult> run(
    Float32List input,
    List<int> dimensions,
  ) async {
    runs++;
    lastInput = input;
    lastDimensions = List<int>.from(dimensions);
    return result;
  }

  @override
  Future<void> dispose() async {
    disposals++;
  }
}

void main() {
  test('dog detector ONNX adapter preserves tensor data and shape', () async {
    final executor = _FakeExecutor();
    final runtime = OnnxDogDetectionTensorRuntime(executor);
    final input = Float32List.fromList(<double>[0.1, 0.2]);

    await runtime.warmup();
    final output = await runtime.run(input, const <int>[1, 2]);

    expect(runtime.backendLabel, 'fake/cpu');
    expect(executor.warmups, 1);
    expect(executor.runs, 1);
    expect(executor.lastInput, same(input));
    expect(executor.lastDimensions, <int>[1, 2]);
    expect(output.data, <double>[1, 2, 3]);
    expect(output.dimensions, <int>[1, 3]);

    await runtime.dispose();
    expect(executor.disposals, 1);
  });

  test('pose ONNX adapter preserves heatmap tensor data and shape', () async {
    final executor = _FakeExecutor()
      ..result = FloatTensorResult(
        data: Float32List.fromList(<double>[0.9, 0.8]),
        dimensions: const <int>[1, 17, 1, 2],
      );
    final runtime = OnnxQuadrupedHeatmapRuntime(executor);

    final output = await runtime.run(
      Float32List.fromList(<double>[255, 128]),
      const <int>[1, 2],
    );

    expect(output.data, <double>[0.9, 0.8]);
    expect(output.dimensions, <int>[1, 17, 1, 2]);

    await runtime.dispose();
    expect(executor.disposals, 1);
  });

  test('model source configuration remains inert until warmup', () {
    final asset = FlutterOnnxFloatTensorExecutor(
      modelLocation: 'assets/models/reviewed.onnx',
      modelSource: FlutterOnnxModelSource.asset,
    );
    final file = FlutterOnnxFloatTensorExecutor(
      modelLocation: '/tmp/reviewed.onnx',
      modelSource: FlutterOnnxModelSource.file,
    );

    expect(asset.backendLabel, 'onnxruntime/uninitialized');
    expect(file.backendLabel, 'onnxruntime/uninitialized');
  });
}
