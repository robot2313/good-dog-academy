class PoseShadowPerformanceReport {
  const PoseShadowPerformanceReport({
    required this.latencySamples,
    required this.p50Ms,
    required this.p95Ms,
    required this.maxMs,
    required this.framesRequested,
    required this.framesAnalysed,
    required this.framesSkippedBusy,
    required this.inferenceErrors,
    required this.errorRate,
    required this.busySkipRate,
    required this.analysisYield,
  });

  final int latencySamples;
  final int? p50Ms;
  final int? p95Ms;
  final int? maxMs;
  final int framesRequested;
  final int framesAnalysed;
  final int framesSkippedBusy;
  final int inferenceErrors;
  final double? errorRate;
  final double? busySkipRate;
  final double? analysisYield;
}

PoseShadowPerformanceReport buildPoseShadowPerformanceReport({
  required List<int> successfulLatencyMs,
  required int framesRequested,
  required int framesAnalysed,
  required int framesSkippedBusy,
  required int inferenceErrors,
}) {
  final latencies = successfulLatencyMs
      .where((value) => value >= 0)
      .toList(growable: false)
    ..sort();

  return PoseShadowPerformanceReport(
    latencySamples: latencies.length,
    p50Ms: _percentile(latencies, 0.50),
    p95Ms: _percentile(latencies, 0.95),
    maxMs: latencies.isEmpty ? null : latencies.last,
    framesRequested: framesRequested,
    framesAnalysed: framesAnalysed,
    framesSkippedBusy: framesSkippedBusy,
    inferenceErrors: inferenceErrors,
    errorRate: _rate(inferenceErrors, framesRequested),
    busySkipRate: _rate(framesSkippedBusy, framesRequested),
    analysisYield: _rate(framesAnalysed, framesRequested),
  );
}

int? _percentile(List<int> sorted, double percentile) {
  if (sorted.isEmpty) return null;
  if (sorted.length == 1) return sorted.single;

  final rawIndex = (sorted.length - 1) * percentile;
  final index = rawIndex.ceil().clamp(0, sorted.length - 1);
  return sorted[index];
}

double? _rate(int numerator, int denominator) {
  if (denominator <= 0) return null;
  return numerator / denominator;
}
