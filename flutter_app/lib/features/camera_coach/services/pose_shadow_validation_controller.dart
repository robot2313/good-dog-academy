import 'dart:async';

import 'package:flutter/foundation.dart';

import '../domain/camera_coach_models.dart';
import '../domain/pose_shadow_validation.dart';
import 'camera/camera_frame_source.dart';
import 'pose_shadow_validation_repository.dart';
import 'vision/dog_vision_engine.dart';

enum PoseShadowControllerStatus {
  off,
  loading,
  ready,
  error,
}

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
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final CameraFrameSource frameSource;
  final DogVisionEngine visionEngine;
  final PoseShadowValidationRepository repository;
  final String dogId;
  final String lessonId;
  final DogPosture expectedPosture;
  final DateTime Function() _now;

  PoseShadowControllerStatus status = PoseShadowControllerStatus.off;
  PoseShadowDiagnostics diagnostics = const PoseShadowDiagnostics.empty();
  DogVisionResult? latestObservation;
  PoseShadowValidationSummary? summary;
  Object? error;

  CameraFrameSubscription? _unsubscribe;
  bool _running = false;
  bool _inFlight = false;
  bool _disposed = false;
  String? _lastLabelledFrameId;

  bool get canLabel =>
      status == PoseShadowControllerStatus.ready &&
      latestObservation != null &&
      latestObservation!.frameId != _lastLabelledFrameId;

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> start() async {
    if (_running || status == PoseShadowControllerStatus.loading) return;

    status = PoseShadowControllerStatus.loading;
    error = null;
    diagnostics = const PoseShadowDiagnostics.empty();
    latestObservation = null;
    _lastLabelledFrameId = null;
    _notify();

    try {
      summary = await repository.loadSummary(dogId);
      await visionEngine.warmup();
      _unsubscribe = frameSource.subscribe(processFrame);
      await frameSource.start();
      _running = true;
      status = PoseShadowControllerStatus.ready;
      _notify();
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
    if (!_running || status != PoseShadowControllerStatus.ready) return;

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
    final stopwatch = Stopwatch()..start();
    try {
      final result = await visionEngine.detect(frame);
      stopwatch.stop();
      latestObservation = result;
      diagnostics = diagnostics.copyWith(
        framesAnalysed: diagnostics.framesAnalysed + 1,
        lastInferenceAt: result.analysedAt,
        lastTotalMs: stopwatch.elapsedMilliseconds,
        lastDetectionConfidence: result.detectionConfidence,
        lastPostureConfidence: result.postureConfidence,
      );
      _notify();
    } catch (cause) {
      stopwatch.stop();
      diagnostics = diagnostics.copyWith(
        inferenceErrors: diagnostics.inferenceErrors + 1,
        lastTotalMs: stopwatch.elapsedMilliseconds,
      );
      status = PoseShadowControllerStatus.error;
      error = cause;
      _notify();
      await _stopFrameSource();
    } finally {
      _inFlight = false;
    }
  }

  Future<PersistedPoseShadowValidationSample?> recordGroundTruth(
    PoseShadowGroundTruth groundTruth,
  ) async {
    final observation = latestObservation;
    if (!canLabel || observation == null) return null;

    final recordedAt = _now().toUtc();
    final sample = PersistedPoseShadowValidationSample(
      id:
          'shadow-${observation.frameId}-${recordedAt.microsecondsSinceEpoch}',
      dogId: dogId,
      lessonId: lessonId,
      expectedPosture: expectedPosture,
      predictedPosture: observation.posture,
      confidence: observation.postureConfidence,
      groundTruth: groundTruth,
      recordedAt: recordedAt.toIso8601String(),
    );

    await repository.record(sample);
    _lastLabelledFrameId = observation.frameId;
    summary = await repository.loadSummary(dogId);
    _notify();
    return sample;
  }

  Future<void> stop() async {
    await _stopFrameSource();
    if (status != PoseShadowControllerStatus.error) {
      status = PoseShadowControllerStatus.off;
      _notify();
    }
  }

  Future<void> shutdown() async {
    await _stopFrameSource();
    await visionEngine.dispose();
    status = PoseShadowControllerStatus.off;
    _notify();
  }

  Future<void> _stopFrameSource() async {
    _unsubscribe?.call();
    _unsubscribe = null;
    if (!_running) return;

    try {
      await frameSource.stop();
    } finally {
      _running = false;
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _unsubscribe?.call();
    _unsubscribe = null;
    unawaited(frameSource.stop());
    unawaited(visionEngine.dispose());
    super.dispose();
  }
}
