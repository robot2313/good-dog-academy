import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';

import '../domain/camera_coach_models.dart';
import '../domain/pose_shadow_validation.dart';
import 'camera/camera_frame_source.dart';
import 'camera/polling_camera_frame_source.dart';
import 'pose_shadow_performance.dart';
import 'pose_shadow_validation_repository.dart';
import 'vision/dog_vision_engine.dart';
import 'vision_benchmark_repository.dart';

enum PoseShadowControllerStatus { off, loading, ready, error }

class PoseShadowDiagnostics {
  const PoseShadowDiagnostics({
    required this.framesRequested,
    required this.framesAnalysed,
    required this.framesSkippedBusy,
    required this.inferenceErrors,
    required this.lastInferenceAt,
    required this.lastTotalMs,
    required this.lastDetectionConfidence,
    required this.lastPostureConfidence,
  });

  const PoseShadowDiagnostics.empty()
    : framesRequested = 0,
      framesAnalysed = 0,
      framesSkippedBusy = 0,
      inferenceErrors = 0,
      lastInferenceAt = null,
      lastTotalMs = null,
      lastDetectionConfidence = null,
      lastPostureConfidence = null;

  final int framesRequested;
  final int framesAnalysed;
  final int framesSkippedBusy;
  final int inferenceErrors;
  final String? lastInferenceAt;
  final int? lastTotalMs;
  final double? lastDetectionConfidence;
  final double? lastPostureConfidence;

  PoseShadowDiagnostics copyWith({
    int? framesRequested,
    int? framesAnalysed,
    int? framesSkippedBusy,
    int? inferenceErrors,
    String? lastInferenceAt,
    int? lastTotalMs,
    double? lastDetectionConfidence,
    double? lastPostureConfidence,
  }) {
    return PoseShadowDiagnostics(
      framesRequested: framesRequested ?? this.framesRequested,
      framesAnalysed: framesAnalysed ?? this.framesAnalysed,
      framesSkippedBusy: framesSkippedBusy ?? this.framesSkippedBusy,
      inferenceErrors: inferenceErrors ?? this.inferenceErrors,
      lastInferenceAt: lastInferenceAt ?? this.lastInferenceAt,
      lastTotalMs: lastTotalMs ?? this.lastTotalMs,
      lastDetectionConfidence:
          lastDetectionConfidence ?? this.lastDetectionConfidence,
      lastPostureConfidence:
          lastPostureConfidence ?? this.lastPostureConfidence,
    );
  }
}

/// Isolated candidate-model validation runtime.
///
/// This controller never records lesson progress, training sessions, reps,
/// rewards, or adaptive-memory evidence. It exists only to collect labelled
/// real-device validation samples before a vision bundle can be approved.
class PoseShadowValidationController extends ChangeNotifier {
  PoseShadowValidationController({
    required this.frameSource,
    required this.visionEngine,
    required this.repository,
    required this.dogId,
    required this.lessonId,
    required this.expectedPosture,
    this.benchmarkContext,
    this.benchmarkRepository,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final CameraFrameSource frameSource;
  final DogVisionEngine visionEngine;
  final PoseShadowValidationRepository repository;
  final String dogId;
  final String lessonId;
  final DogPosture expectedPosture;
  final DateTime Function() _now;
  final VisionBenchmarkContext? benchmarkContext;
  final VisionBenchmarkRepository? benchmarkRepository;
  final List<Map<String, Object?>> _benchmarkLabels = [];
  List<Map<String, Object?>> get benchmarkLabels =>
      List.unmodifiable(_benchmarkLabels);
  Future<void> _lifecycle = Future<void>.value();
  Future<void>? _shutdown;
  Completer<void>? _inferenceDone;
  Future<void>? _labelWrite;
  bool _labelBusy = false;
  bool _labelFrozen = false;
  Timer? _freshnessTimer;
  bool _observationStale = false;
  bool get observationStale => _observationStale && !_labelFrozen;
  final List<Map<String, Object?>> _temporalEvidence = [];
  Uint8List? latestAnalysedImage;
  bool get labelFrozen => _labelFrozen;

  void freezeForLabel() {
    if (status != PoseShadowControllerStatus.ready ||
        observationStale ||
        latestObservation == null) {
      return;
    }
    _labelFrozen = true;
    _notify();
  }

  void resumeAfterLabel() {
    _labelFrozen = false;
    latestObservation = null;
    latestAnalysedImage = null;
    _notify();
  }

  int _generation = 0;
  int _postureChanges = 0;
  int _posturePairs = 0;
  String? _previousPosture;

  int? get captureBusySkips => frameSource is PollingCameraFrameSource
      ? (frameSource as PollingCameraFrameSource).captureBusySkips
      : null;
  int? get captureErrors => frameSource is PollingCameraFrameSource
      ? (frameSource as PollingCameraFrameSource).captureErrors
      : null;

  Map<String, Object?> get benchmarkMetrics {
    final report = performanceReport;
    return {
      'captureBusySkips': captureBusySkips,
      'captureErrors': captureErrors,
      'framesRequested': diagnostics.framesRequested,
      'framesAnalysed': diagnostics.framesAnalysed,
      'framesSkippedBusy': diagnostics.framesSkippedBusy,
      'inferenceErrors': diagnostics.inferenceErrors,
      'lastTotalMs': diagnostics.lastTotalMs,
      'p50Ms': report.p50Ms,
      'p95Ms': report.p95Ms,
      'maxMs': report.maxMs,
      'latencySamples': report.latencySamples,
      'analysisYield': report.analysisYield,
      'errorRate': report.errorRate,
      'postureChanges': _postureChanges,
      'posturePairs': _posturePairs,
      'postureChangeRate': _posturePairs == 0
          ? null
          : _postureChanges / _posturePairs,
      'errorRateDenominator': 'requested frames (including busy skips)',
      'timingScope':
          'preprocess+detect+track+pose+classify; excludes camera capture',
      'battery': null,
      'thermal': null,
      'temporalEvidence': List<Map<String, Object?>>.of(_temporalEvidence),
      'temporalEvidenceScope': 'last 120 analysed frames; structured joints only, no image/audio bytes',
    };
  }

  Future<void> saveBenchmarkSnapshot() async {
    await _labelWrite;
    await _saveBenchmark();
  }

  Future<void> _saveBenchmark() async {
    final context = benchmarkContext;
    if (context == null) return;
    final store = benchmarkRepository;
    if (store == null) throw StateError('Benchmark repository is missing.');
    await store.save(context, _benchmarkLabels, benchmarkMetrics);
  }

  Future<void> _serialize(Future<void> Function() action) {
    final next = _lifecycle.then((_) => action());
    _lifecycle = next.catchError((Object _) {});
    return next;
  }

  PoseShadowControllerStatus status = PoseShadowControllerStatus.off;
  PoseShadowDiagnostics diagnostics = const PoseShadowDiagnostics.empty();
  DogVisionResult? latestObservation;
  PoseShadowValidationSummary? summary;
  Object? error;

  static const int maximumPerformanceSamples = 600;

  CameraFrameSubscription? _unsubscribe;
  bool _running = false;
  bool _inFlight = false;
  bool _disposed = false;
  String? _lastLabelledFrameId;
  final List<int> _successfulLatencyMs = <int>[];

  bool get canLabel =>
      !_disposed &&
      !_labelBusy &&
      !observationStale &&
      (benchmarkContext == null || _labelFrozen) &&
      status == PoseShadowControllerStatus.ready &&
      latestObservation != null &&
      latestObservation!.frameId != _lastLabelledFrameId;

  PoseShadowPerformanceReport get performanceReport =>
      buildPoseShadowPerformanceReport(
        successfulLatencyMs: _successfulLatencyMs,
        framesRequested: diagnostics.framesRequested,
        framesAnalysed: diagnostics.framesAnalysed,
        framesSkippedBusy: diagnostics.framesSkippedBusy,
        inferenceErrors: diagnostics.inferenceErrors,
      );

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> start() => _serialize(_start);

  Future<void> _start() async {
    if (_disposed || _shutdown != null) return;
    if (benchmarkContext != null && benchmarkContext!.dogId != dogId) {
      throw StateError('Benchmark dog does not match the QA session.');
    }
    if ((benchmarkContext == null) != (benchmarkRepository == null)) {
      throw StateError(
        'Benchmark context and repository must be supplied together.',
      );
    }
    if (_running || status == PoseShadowControllerStatus.loading) return;
    if (visionEngine case final ResettableDogVisionEngine resettable) {
      resettable.resetTemporalState();
    }
    _observationStale = false;
    _freshnessTimer?.cancel();
    _freshnessTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (_disposed || !_running || _labelFrozen) return;
      final analysed = DateTime.tryParse(latestObservation?.analysedAt ?? '');
      final stale =
          analysed != null && _now().difference(analysed).inMilliseconds > 4000;
      if (stale != _observationStale) {
        _observationStale = stale;
        _notify();
      }
    });

    status = PoseShadowControllerStatus.loading;
    error = null;
    if (benchmarkContext == null) {
      diagnostics = const PoseShadowDiagnostics.empty();
    }
    latestObservation = null;
    _lastLabelledFrameId = null;
    if (benchmarkContext == null) _successfulLatencyMs.clear();
    _previousPosture = null;
    _labelFrozen = false;
    latestAnalysedImage = null;
    _notify();

    try {
      if (benchmarkContext == null) {
        summary = await repository.loadSummary(dogId);
      }
      await visionEngine.warmup();
      if (_disposed || _shutdown != null) return;
      _unsubscribe = frameSource.subscribe(processFrame);
      _running = true;
      status = PoseShadowControllerStatus.ready;
      _notify();
      await frameSource.start();
    } catch (cause) {
      _unsubscribe?.call();
      _unsubscribe = null;
      try {
        await frameSource.stop();
      } catch (_) {
        // Preserve the startup failure as the primary error.
      }
      _running = false;
      status = PoseShadowControllerStatus.error;
      error = cause;
      _notify();
    }
  }

  Future<void> processFrame(CameraFrame frame) async {
    if (!_running ||
        status != PoseShadowControllerStatus.ready ||
        _labelFrozen) {
      return;
    }

    diagnostics = diagnostics.copyWith(
      framesRequested: diagnostics.framesRequested + 1,
    );
    if (_inFlight) {
      diagnostics = diagnostics.copyWith(
        framesSkippedBusy: diagnostics.framesSkippedBusy + 1,
      );
      _notify();
      return;
    }

    _inFlight = true;
    final generation = _generation;
    _inferenceDone = Completer<void>();
    final stopwatch = Stopwatch()..start();
    try {
      Uint8List? image;
      if (benchmarkContext != null && frame.uri != null) {
        final uri = Uri.parse(frame.uri!);
        if (uri.scheme != 'file' && uri.scheme.isNotEmpty) {
          throw StateError('QA snapshot requires a local file.');
        }
        image =
            await (uri.scheme.isEmpty ? File(frame.uri!) : File.fromUri(uri))
                .readAsBytes();
      }
      final result = await visionEngine.detect(frame);
      if (result.frameId != frame.id ||
          [
            result.detectionConfidence,
            result.postureConfidence,
            result.trackingConfidence,
          ].any(
            (value) =>
                value != null && (!value.isFinite || value < 0 || value > 1),
          ) ||
          (!result.dogDetected && result.posture != null) ||
          (result.poseInferenceFailed && result.posture != null)) {
        throw StateError('Invalid or inconsistent QA vision output.');
      }
      stopwatch.stop();
      if (!_running || generation != _generation || _disposed || _labelFrozen) {
        return;
      }
      latestAnalysedImage = image;
      latestObservation = result;
      _observationStale = false;
      if (benchmarkContext != null) {
        _temporalEvidence.add({
          'frameId': frame.id,
          'capturedAt': frame.capturedAt,
          'analysedAt': result.analysedAt,
          'modelVersion': benchmarkContext!.modelVersion,
          'trackingState': result.trackingState?.name,
          'trackingScore': result.trackingConfidence,
          'detectorScore': result.detectionConfidence,
          'posture': result.posture?.name,
          'postureScore': result.postureConfidence,
          'pose': result.poseDiagnostics?.toJson(),
        });
        if (_temporalEvidence.length > 120) _temporalEvidence.removeAt(0);
      }
      final posture = !result.dogDetected
          ? 'noDog'
          : result.posture?.name ?? 'unknown';
      if (_previousPosture != null) {
        _posturePairs++;
        if (_previousPosture != posture) _postureChanges++;
      }
      _previousPosture = posture;
      _successfulLatencyMs.add(stopwatch.elapsedMilliseconds);
      if (_successfulLatencyMs.length > maximumPerformanceSamples) {
        _successfulLatencyMs.removeAt(0);
      }
      diagnostics = diagnostics.copyWith(
        framesAnalysed: diagnostics.framesAnalysed + 1,
        inferenceErrors:
            diagnostics.inferenceErrors + (result.poseInferenceFailed ? 1 : 0),
        lastInferenceAt: result.analysedAt,
        lastTotalMs: stopwatch.elapsedMilliseconds,
        lastDetectionConfidence: result.detectionConfidence,
        lastPostureConfidence: result.postureConfidence,
      );
      _notify();
    } catch (cause) {
      stopwatch.stop();
      if (!_running || generation != _generation || _disposed) return;
      latestObservation = null;
      diagnostics = diagnostics.copyWith(
        inferenceErrors: diagnostics.inferenceErrors + 1,
        lastTotalMs: stopwatch.elapsedMilliseconds,
      );
      status = PoseShadowControllerStatus.error;
      error = cause;
      _notify();
      await _stopFrameSource();
      await _labelWrite;
      await _saveBenchmark();
    } finally {
      _inFlight = false;
      _inferenceDone?.complete();
      _inferenceDone = null;
    }
  }

  Future<PersistedPoseShadowValidationSample?> recordGroundTruth(
    PoseShadowGroundTruth groundTruth,
  ) async {
    final observation = latestObservation;
    if (!canLabel || observation == null) return null;

    _labelBusy = true;
    final recordedAt = _now().toUtc();
    final sample = PersistedPoseShadowValidationSample(
      id: 'shadow-${observation.frameId}-${recordedAt.microsecondsSinceEpoch}',
      dogId: dogId,
      lessonId: lessonId,
      expectedPosture: expectedPosture,
      predictedPosture: observation.posture,
      confidence: observation.postureConfidence,
      groundTruth: groundTruth,
      recordedAt: recordedAt.toIso8601String(),
    );

    final write = () async {
      // Mark before the first await to reject duplicate taps for this frame.
      _lastLabelledFrameId = observation.frameId;
      if (benchmarkContext != null) {
        _benchmarkLabels.add({
          'frameId': observation.frameId,
          'recordedAt': sample.recordedAt,
          'truth': groundTruth.name,
          'dogDetected': observation.rawDogDetected ?? observation.dogDetected,
          'trackedDog': observation.dogDetected,
          'poseInferenceFailed': observation.poseInferenceFailed,
          'detectionConfidence': observation.detectionConfidence,
          'posture': observation.posture?.name,
          'postureConfidence': observation.postureConfidence,
          'trackingState': observation.trackingState?.name,
          'poseDiagnostics': observation.poseDiagnostics?.toJson(),
          'analysisMs': diagnostics.lastTotalMs,
        });
        try {
          await _saveBenchmark();
        } catch (_) {
          _benchmarkLabels.removeLast();
          _lastLabelledFrameId = null;
          rethrow;
        }
      } else {
        await repository.record(sample);
        summary = await repository.loadSummary(dogId);
      }
    }();
    _labelWrite = write;
    try {
      await write;
      if (benchmarkContext != null) resumeAfterLabel();
      return sample;
    } finally {
      _labelBusy = false;
      _labelWrite = null;
      _notify();
    }
  }

  Future<void> stop() => _serialize(_stop);

  Future<void> _stop() async {
    await _stopFrameSource();
    await _inferenceDone?.future;
    if (frameSource is PollingCameraFrameSource) {
      await (frameSource as PollingCameraFrameSource).drain();
    }
    await _labelWrite;
    await _saveBenchmark();
    if (status != PoseShadowControllerStatus.error) {
      status = PoseShadowControllerStatus.off;
      _notify();
    }
  }

  Future<void> shutdown() => _shutdown ??= _serialize(() async {
    try {
      await _stop();
    } finally {
      await visionEngine.dispose();
      status = PoseShadowControllerStatus.off;
      _notify();
    }
  });

  Future<void> _stopFrameSource() async {
    _freshnessTimer?.cancel();
    _freshnessTimer = null;
    _unsubscribe?.call();
    _unsubscribe = null;
    _generation++;
    latestObservation = null;
    latestAnalysedImage = null;
    if (!_running) return;
    _running = false;
    await frameSource.stop();
  }

  @override
  void dispose() {
    _disposed = true;
    _freshnessTimer?.cancel();
    unawaited(shutdown().catchError((Object _) {}));
    super.dispose();
  }
}
