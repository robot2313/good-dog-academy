import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/services/pose_shadow_performance.dart';

void main() {
  test('empty device run reports no invented latency or rates', () {
    final report = buildPoseShadowPerformanceReport(
      successfulLatencyMs: const <int>[],
      framesRequested: 0,
      framesAnalysed: 0,
      framesSkippedBusy: 0,
      inferenceErrors: 0,
    );

    expect(report.p50Ms, isNull);
    expect(report.p95Ms, isNull);
    expect(report.maxMs, isNull);
    expect(report.errorRate, isNull);
    expect(report.busySkipRate, isNull);
    expect(report.analysisYield, isNull);
  });

  test('reports deterministic P50 P95 max and frame rates', () {
    final report = buildPoseShadowPerformanceReport(
      successfulLatencyMs: const <int>[
        10,
        20,
        30,
        40,
        50,
        60,
        70,
        80,
        90,
        100,
      ],
      framesRequested: 20,
      framesAnalysed: 10,
      framesSkippedBusy: 8,
      inferenceErrors: 2,
    );

    expect(report.latencySamples, 10);
    expect(report.p50Ms, 60);
    expect(report.p95Ms, 100);
    expect(report.maxMs, 100);
    expect(report.analysisYield, 0.5);
    expect(report.busySkipRate, 0.4);
    expect(report.errorRate, 0.1);
  });

  test('negative latency samples are ignored', () {
    final report = buildPoseShadowPerformanceReport(
      successfulLatencyMs: const <int>[-4, 12, 18],
      framesRequested: 2,
      framesAnalysed: 2,
      framesSkippedBusy: 0,
      inferenceErrors: 0,
    );

    expect(report.latencySamples, 2);
    expect(report.p50Ms, 18);
    expect(report.maxMs, 18);
  });
}
