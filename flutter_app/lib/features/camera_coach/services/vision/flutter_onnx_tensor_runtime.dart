import 'dart:typed_data';

import 'package:flutter_onnxruntime/flutter_onnxruntime.dart';

import 'quadruped_pose_runtime.dart';
import 'yolo_dog_detector_runtime.dart';

enum FlutterOnnxModelSource { asset, file }

class FloatTensorResult {
  const FloatTensorResult({
    required this.data,
    required this.dimensions,
  });

  final Float32List data;
  final List<int> dimensions;
}

abstract interface class FloatTensorExecutor {
  String get backendLabel;

  Future<void> warmup();

  Future<FloatTensorResult> run(
    Float32List input,
    List<int> dimensions,
  );

  Future<void> dispose();
}

/// Thin ONNX Runtime executor shared by detector and pose adapters.
///
/// This class deliberately knows nothing about YOLO decoding, dog tracking,
/// pose heatmaps or Camera Coach scoring. It owns only session lifecycle and
/// float tensor execution so Core ML / LiteRT can replace it later without
/// changing the shared vision pipeline.
class FlutterOnnxFloatTensorExecutor implements FloatTensorExecutor {
  FlutterOnnxFloatTensorExecutor({
    required this.modelLocation,
    required this.modelSource,
    this.inputName,
    this.outputName,
    this.preferredProviders = const <OrtProvider>[
      OrtProvider.XNNPACK,
      OrtProvider.CPU,
    ],
    OnnxRuntime? runtime,
  }) : _runtime = runtime ?? OnnxRuntime();

  final String modelLocation;
  final FlutterOnnxModelSource modelSource;
  final String? inputName;
  final String? outputName;
  final List<OrtProvider> preferredProviders;
  final OnnxRuntime _runtime;

  OrtSession? _session;
  Future<void>? _opening;
  String? _resolvedInputName;
  String? _resolvedOutputName;
  String _backendLabel = 'onnxruntime/uninitialized';
  bool _disposed = false;

  @override
  String get backendLabel => _backendLabel;

  @override
  Future<void> warmup() {
    if (_disposed) {
      return Future<void>.error(
        StateError('ONNX tensor executor has been disposed.'),
      );
    }
    if (_session != null) return Future<void>.value();

    final existing = _opening;
    if (existing != null) return existing;

    final opening = _open();
    _opening = opening;
    return opening.whenComplete(() {
      _opening = null;
    });
  }

  Future<void> _open() async {
    if (modelLocation.trim().isEmpty) {
      throw ArgumentError.value(
        modelLocation,
        'modelLocation',
        'ONNX model location must not be empty.',
      );
    }

    final available = await _runtime.getAvailableProviders();
    var providers = preferredProviders
        .where(available.contains)
        .toList(growable: false);

    if (providers.isEmpty && available.contains(OrtProvider.CPU)) {
      providers = const <OrtProvider>[OrtProvider.CPU];
    }

    OrtSession? session;
    Object? firstFailure;
    try {
      session = await _createSession(providers);
    } catch (cause) {
      firstFailure = cause;
    }

    if (session == null) {
      final canFallback =
          providers.length != 1 ||
          providers.isEmpty ||
          providers.single != OrtProvider.CPU;
      if (!canFallback || !available.contains(OrtProvider.CPU)) {
        throw StateError(
          'Could not open ONNX model with available providers: $firstFailure',
        );
      }
      providers = const <OrtProvider>[OrtProvider.CPU];
      session = await _createSession(providers);
    }

    try {
      _resolvedInputName = _resolveName(
        configured: inputName,
        available: session.inputNames,
        kind: 'input',
      );
      _resolvedOutputName = _resolveName(
        configured: outputName,
        available: session.outputNames,
        kind: 'output',
      );
    } catch (_) {
      await session.close();
      rethrow;
    }

    _session = session;
    _backendLabel = providers.isEmpty
        ? 'onnxruntime/default'
        : 'onnxruntime/${providers.map((provider) => provider.name.toLowerCase()).join('+')}';
  }

  Future<OrtSession> _createSession(List<OrtProvider> providers) {
    final options = OrtSessionOptions(
      providers: providers.isEmpty ? null : providers,
      intraOpNumThreads: 1,
      interOpNumThreads: 1,
    );

    return switch (modelSource) {
      FlutterOnnxModelSource.asset => _runtime.createSessionFromAsset(
        modelLocation,
        options: options,
      ),
      FlutterOnnxModelSource.file => _runtime.createSession(
        modelLocation,
        options: options,
      ),
    };
  }

  @override
  Future<FloatTensorResult> run(
    Float32List input,
    List<int> dimensions,
  ) async {
    await warmup();

    final session = _session;
    final inputKey = _resolvedInputName;
    final outputKey = _resolvedOutputName;
    if (session == null || inputKey == null || outputKey == null) {
      throw StateError('ONNX session is not ready.');
    }

    final inputValue = await OrtValue.fromList(input, dimensions);
    Map<String, OrtValue>? outputs;
    try {
      outputs = await session.run(<String, OrtValue>{
        inputKey: inputValue,
      });

      final output = outputs[outputKey];
      if (output == null) {
        throw StateError('ONNX session did not return output "$outputKey".');
      }

      final flattened = await output.asFlattenedList();
      final data = Float32List(flattened.length);
      for (var index = 0; index < flattened.length; index++) {
        final value = flattened[index];
        if (value is! num) {
          throw StateError(
            'ONNX output "$outputKey" contained non-numeric tensor data.',
          );
        }
        data[index] = value.toDouble();
      }

      return FloatTensorResult(
        data: data,
        dimensions: List<int>.unmodifiable(output.shape),
      );
    } finally {
      await _safeDisposeValue(inputValue);
      if (outputs != null) {
        for (final output in outputs.values) {
          await _safeDisposeValue(output);
        }
      }
    }
  }

  @override
  Future<void> dispose() async {
    if (_disposed) return;
    _disposed = true;

    final opening = _opening;
    if (opening != null) {
      try {
        await opening;
      } catch (_) {
        // A failed open has no session to release.
      }
    }

    final session = _session;
    _session = null;
    _resolvedInputName = null;
    _resolvedOutputName = null;
    _backendLabel = 'onnxruntime/disposed';
    if (session != null) {
      await session.close();
    }
  }
}

class OnnxDogDetectionTensorRuntime implements DogDetectionTensorRuntime {
  const OnnxDogDetectionTensorRuntime(this.executor);

  final FloatTensorExecutor executor;

  @override
  String get backendLabel => executor.backendLabel;

  @override
  Future<void> warmup() => executor.warmup();

  @override
  Future<DogDetectionTensorOutput> run(
    Float32List input,
    List<int> dimensions,
  ) async {
    final output = await executor.run(input, dimensions);
    return DogDetectionTensorOutput(
      data: output.data,
      dimensions: output.dimensions,
    );
  }

  @override
  Future<void> dispose() => executor.dispose();
}

class OnnxQuadrupedHeatmapRuntime implements QuadrupedHeatmapRuntime {
  const OnnxQuadrupedHeatmapRuntime(this.executor);

  final FloatTensorExecutor executor;

  @override
  Future<void> warmup() => executor.warmup();

  @override
  Future<QuadrupedHeatmapOutput> run(
    Float32List input,
    List<int> dimensions,
  ) async {
    final output = await executor.run(input, dimensions);
    return QuadrupedHeatmapOutput(
      data: output.data,
      dimensions: output.dimensions,
    );
  }

  @override
  Future<void> dispose() => executor.dispose();
}

String _resolveName({
  required String? configured,
  required List<String> available,
  required String kind,
}) {
  if (configured != null) {
    if (!available.contains(configured)) {
      throw StateError(
        'Configured ONNX $kind "$configured" was not found. '
        'Available names: ${available.join(', ')}.',
      );
    }
    return configured;
  }

  if (available.length != 1) {
    throw StateError(
      'ONNX model must expose exactly one $kind when no explicit name is '
      'configured. Found: ${available.join(', ')}.',
    );
  }
  return available.single;
}

Future<void> _safeDisposeValue(OrtValue value) async {
  try {
    await value.dispose();
  } catch (_) {
    // Tensor cleanup must not replace the primary inference result/error.
  }
}
