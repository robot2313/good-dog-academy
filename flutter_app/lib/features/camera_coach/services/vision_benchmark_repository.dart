import 'dart:convert';

import 'pose_shadow_validation_repository.dart';

import '../domain/vision_benchmark.dart';
export '../domain/vision_benchmark.dart';

/// One immutable session partition per model/dog/scenario/device/protocol.
/// The index holds only keys; metrics and labels never enter training storage.
class VisionBenchmarkRepository {
  VisionBenchmarkRepository(this.storage);
  final PoseShadowValidationStringStorage storage;
  static const prefix = 'good_dog_academy.flutter.vision_benchmark.v1';
  Future<void> _writes = Future<void>.value();

  Future<void> save(
    VisionBenchmarkContext context,
    List<Map<String, Object?>> labels,
    Map<String, Object?> metrics,
  ) {
    // Snapshot before queuing so callers cannot mutate an in-flight write.
    final encoded = jsonEncode({
      'schemaVersion': 1,
      'context': context.toJson(),
      'labels': labels,
      'metrics': metrics,
    });
    final next = _writes.then((_) async {
      final key = '$prefix.${context.partition}';
      final raw = await storage.read('$prefix.index');
      final keys = raw == null
          ? <String>[]
          : (jsonDecode(raw) as List).cast<String>();
      await storage.write(key, encoded);
      if (!keys.contains(key)) {
        await storage.write('$prefix.index', jsonEncode([...keys, key]));
      }
    });
    _writes = next.catchError((Object _) {});
    return next;
  }

  Future<List<Map<String, Object?>>> loadSessions() async {
    await _writes;
    final raw = await storage.read('$prefix.index');
    if (raw == null) return [];
    final result = <Map<String, Object?>>[];
    for (final key in (jsonDecode(raw) as List).cast<String>()) {
      if (!key.startsWith('$prefix.')) {
        throw const FormatException('Invalid QA key');
      }
      final record = await storage.read(key);
      if (record == null) continue;
      final value = (jsonDecode(record) as Map).cast<String, Object?>();
      if (value['schemaVersion'] != 1 ||
          value['context'] is! Map ||
          value['labels'] is! List ||
          value['metrics'] is! Map) {
        throw const FormatException('Invalid benchmark session');
      }
      final context = VisionBenchmarkContext.fromJson(
        (value['context'] as Map).cast<String, Object?>(),
      );
      if (key != '$prefix.${context.partition}') {
        throw const FormatException(
          'Benchmark context does not match partition',
        );
      }
      summarizeBenchmarkLabels(
        (value['labels'] as List)
            .map((label) => (label as Map).cast<String, Object?>())
            .toList(),
      );
      result.add(value);
    }
    return result;
  }
}
