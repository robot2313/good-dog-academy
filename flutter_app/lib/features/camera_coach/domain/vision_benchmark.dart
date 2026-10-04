import 'dart:convert';

/// Immutable partition and protocol metadata. Unknown device values are entered
/// explicitly, never presented as measured hardware/battery information.
class VisionBenchmarkContext {
  VisionBenchmarkContext({
    required this.modelId,
    required this.modelVersion,
    required this.dogId,
    required this.sessionId,
    required this.scenario,
    required this.device,
    this.protocol = 'live-jpeg-medium-800ms-v1',
  }) {
    if ([
      modelId,
      modelVersion,
      dogId,
      sessionId,
      scenario,
      device,
      protocol,
    ].any((value) => value.trim().isEmpty || value.length > 200)) {
      throw ArgumentError(
        'Benchmark metadata must be nonempty and <=200 characters.',
      );
    }
  }

  factory VisionBenchmarkContext.fromJson(Map<String, Object?> value) {
    String read(String key) {
      final item = value[key];
      if (item is! String) throw FormatException('Invalid benchmark $key');
      return item;
    }

    return VisionBenchmarkContext(
      modelId: read('modelId'),
      modelVersion: read('modelVersion'),
      dogId: read('dogId'),
      sessionId: read('sessionId'),
      scenario: read('scenario'),
      device: read('device'),
      protocol: read('protocol'),
    );
  }

  final String modelId,
      modelVersion,
      dogId,
      sessionId,
      scenario,
      device,
      protocol;
  String get partition => base64Url.encode(utf8.encode(jsonEncode(toJson())));
  Map<String, Object?> toJson() => {
    'modelId': modelId,
    'modelVersion': modelVersion,
    'dogId': dogId,
    'sessionId': sessionId,
    'scenario': scenario,
    'device': device,
    'protocol': protocol,
  };
}

/// Confusion includes UNKNOWN and NO_DOG as distinct predicted outcomes.
/// Unsure labels are retained in storage but excluded from quality denominators.
Map<String, Object?> summarizeBenchmarkLabels(
  List<Map<String, Object?>> labels,
) {
  var tp = 0, fp = 0, fn = 0, tn = 0, known = 0, dogSamples = 0;
  var labelled = 0;
  final matrix = <String, Map<String, int>>{};
  for (final sample in labels) {
    final truth = sample['truth'] as String;
    if (truth == 'unsure') continue;
    if (!['sitLike', 'standLike', 'downLike', 'noDog'].contains(truth)) {
      throw const FormatException('Invalid QA truth');
    }
    final detected = sample['dogDetected'] as bool;
    final posture = sample['posture'] as String?;
    if (posture != null &&
        !['sitLike', 'standLike', 'downLike'].contains(posture)) {
      throw const FormatException('Invalid QA prediction');
    }
    labelled++;
    final actualDog = truth != 'noDog';
    if (actualDog) {
      dogSamples++;
      if (detected) {
        tp++;
      } else {
        fn++;
      }
      if (detected && posture != null) known++;
    } else {
      if (detected) {
        fp++;
      } else {
        tn++;
      }
    }
    final predicted = !detected ? 'noDog' : posture ?? 'unknown';
    final row = matrix.putIfAbsent(truth, () => <String, int>{});
    row[predicted] = (row[predicted] ?? 0) + 1;
  }
  double? rate(int n, int d) => d == 0 ? null : n / d;
  final postureReports = <String, Object?>{};
  for (final posture in ['sitLike', 'standLike', 'downLike']) {
    final correct = matrix[posture]?[posture] ?? 0;
    var actual = 0, predicted = 0;
    for (final row in matrix.entries) {
      predicted += row.value[posture] ?? 0;
      if (row.key == posture) {
        actual = row.value.values.fold(0, (a, b) => a + b);
      }
    }
    final falsePositive = predicted - correct;
    postureReports[posture] = {
      'tp': correct,
      'fp': falsePositive,
      'fn': actual - correct,
      'precision': rate(correct, predicted),
      'recall': rate(correct, actual),
      'falsePositiveRate': rate(falsePositive, labelled - actual),
      'samples': actual,
    };
  }
  return {
    'samples': labelled,
    'unsure': labels.length - labelled,
    'dog': {
      'tp': tp,
      'fp': fp,
      'fn': fn,
      'tn': tn,
      'precision': rate(tp, tp + fp),
      'recall': rate(tp, tp + fn),
      'falsePositiveRate': rate(fp, fp + tn),
    },
    'coverage': rate(known, dogSamples),
    'postures': postureReports,
    'confusion': matrix,
  };
}
