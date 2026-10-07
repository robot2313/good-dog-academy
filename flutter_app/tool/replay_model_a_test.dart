// Invoke explicitly with GDA_REPLAY_MANIFEST, GDA_REPLAY_MODELS,
// GDA_REPLAY_BRIDGE, GDA_REPLAY_OUTPUT. Private frames are never committed.
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/camera_frame_source.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/flutter_onnx_tensor_runtime.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/rtm_qa_vision_engine.dart';

class LocalOrtBridge {
  Process? process;
  late StreamIterator<String> lines;
  late Directory work;
  int index = 0;
  Future<void> open() async {
    if (process != null) return;
    work = await Directory.systemTemp.createTemp('gda-real-replay-');
    process = await Process.start('python3', [
      Platform.environment['GDA_REPLAY_BRIDGE']!,
      Platform.environment['GDA_REPLAY_MODELS']!,
    ]);
    process!.stderr.transform(utf8.decoder).listen(stderr.write);
    lines = StreamIterator(
      process!.stdout.transform(utf8.decoder).transform(const LineSplitter()),
    );
    if (!await lines.moveNext() || jsonDecode(lines.current)['ready'] != true) {
      throw StateError('Local real-model runtime did not open');
    }
  }

  Future<FloatTensorResult> run(
    String role,
    Float32List input,
    List<int> shape,
  ) async {
    await open();
    final prefix = '${work.path}/${index++}';
    await File('$prefix-in').writeAsBytes(
      input.buffer.asUint8List(input.offsetInBytes, input.lengthInBytes),
    );
    process!.stdin.writeln(
      jsonEncode({
        'role': role,
        'shape': shape,
        'input': '$prefix-in',
        'output': '$prefix-out',
      }),
    );
    await process!.stdin.flush();
    if (!await lines.moveNext()) throw StateError('Real ONNX runtime stopped');
    final response = jsonDecode(lines.current) as Map<String, dynamic>;
    final bytes = await File('$prefix-out').readAsBytes();
    await File('$prefix-in').delete();
    await File('$prefix-out').delete();
    return FloatTensorResult(
      data: bytes.buffer.asFloat32List(
        bytes.offsetInBytes,
        bytes.lengthInBytes ~/ 4,
      ),
      dimensions: (response['shape'] as List).cast<int>(),
    );
  }

  Future<void> close() async {
    if (process == null) return;
    await process!.stdin.close();
    await process!.exitCode;
    await lines.cancel();
    await work.delete(recursive: true);
  }
}

class LocalOrtExecutor implements FloatTensorExecutor {
  LocalOrtExecutor(this.bridge, this.role);
  final LocalOrtBridge bridge;
  final String role;
  @override
  String get backendLabel => 'real-onnxruntime-cpu-desktop';
  @override
  Future<void> warmup() => bridge.open();
  @override
  Future<FloatTensorResult> run(Float32List input, List<int> dimensions) =>
      bridge.run(role, input, dimensions);
  @override
  Future<void> dispose() async {}
}

void main() {
  test(
    'real graphs through Flutter preprocessing, tracking, pose and diagnostics',
    () async {
      final manifest = jsonDecode(
        await File(Platform.environment['GDA_REPLAY_MANIFEST']!).readAsString(),
      ) as Map<String, dynamic>;
      final bridge = LocalOrtBridge();
      // Open serially: detector and pose share a local inference transport.
      await bridge.open();
      final improved = Platform.environment['GDA_REPLAY_IMPROVED'] == 'true';
      final engine = composeRtmQaEngine(
        detectorExecutor: LocalOrtExecutor(bridge, 'detector'),
        poseExecutor: LocalOrtExecutor(bridge, 'pose'),
        improved: improved,
      );
      final records = <Map<String, Object?>>[];
      try {
        for (final value in manifest['frames'] as List) {
          final entry = (value as Map).cast<String, dynamic>();
          if (manifest['sequence'] != true) engine.resetTracking();
          for (
            var repeat = 0;
            repeat < (manifest['repeats'] as int? ?? 3);
            repeat++
          ) {
            final timer = Stopwatch()..start();
            final result = await engine.detect(
              CameraFrame(
                id: '${entry['id']}-$repeat',
                capturedAt: DateTime.now().toUtc().toIso8601String(),
                width: 1,
                height: 1,
                rotationDegrees: 0,
                uri: entry['file'] as String,
              ),
            );
            records.add({
              ...entry,
              'repeat': repeat,
              'rawDogDetected': result.rawDogDetected,
              'trackedDog': result.dogDetected,
              'box': result.dogBoundingBox == null
                  ? null
                  : {
                      'left': result.dogBoundingBox!.left,
                      'top': result.dogBoundingBox!.top,
                      'width': result.dogBoundingBox!.width,
                      'height': result.dogBoundingBox!.height,
                    },
              'detectorScore': result.detectionConfidence,
              'trackingState': result.trackingState?.name,
              'trackingScore': result.trackingConfidence,
              'posture': result.posture?.name,
              'postureScore': result.postureConfidence,
              'pose': result.poseDiagnostics?.toJson(),
              'analysisMs': timer.elapsedMilliseconds,
            });
          }
        }
        await File(Platform.environment['GDA_REPLAY_OUTPUT']!).writeAsString(
          const JsonEncoder.withIndent('  ').convert({
            'baselineCommit': '56184bb6e5bd09feb1868846370fa74c2b649117',
            'mode': improved ? 'temporal-quality-v3' : 'limb-v2',
            'scope': 'real ONNX graphs and Flutter adapters on desktop; three repeats per still are NOT video',
            'records': records,
          }),
        );
        expect(records, isNotEmpty);
        expect(records.any((r) => r['trackedDog'] == true), isTrue);
      } finally {
        await engine.dispose();
        await bridge.close();
      }
    },
    timeout: const Timeout(Duration(minutes: 10)),
  );
}
