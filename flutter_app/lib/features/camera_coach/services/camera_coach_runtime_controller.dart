import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../lessons/session/training_session_record.dart';
import '../domain/camera_coach_orchestrator.dart';
import '../domain/expected_cue_response.dart';
import '../domain/live_coach_engine.dart';
import '../domain/smart_framing.dart';
import '../domain/spoken_coach_policy.dart';
import 'camera/camera_frame_source.dart';
import 'spoken_coach_controller.dart';

enum CameraCoachRuntimeStatus {
  idle,
  warming,
  ready,
  cueActive,
  awaitingOwnerConfirmation,
  paused,
  complete,
  error,
}

/// App-facing runtime coordinator for the model-neutral Camera Coach pipeline.
///
/// It owns frame-source lifecycle, cue timing, framing guidance, owner
/// confirmation state, and optional spoken coaching. It does not know which
/// camera plugin, detector, pose runtime, or model vendor is used underneath.
class CameraCoachRuntimeController extends ChangeNotifier {
  CameraCoachRuntimeController({
    required this.frameSource,
    required this.orchestrator,
    required this.dogName,
    this.cueResponse,
    this.spokenCoach,
  });

  final CameraFrameSource frameSource;
  final CameraCoachOrchestrator orchestrator;
  final String dogName;
  final ExpectedCueResponse? cueResponse;
  final SpokenCoachController? spokenCoach;

  CameraCoachRuntimeStatus status = CameraCoachRuntimeStatus.idle;
  SmartFramingResult? framing;
  CameraCoachFrameResult? lastFrameResult;
  Object? error;

  CameraFrameSubscription? _unsubscribe;
  String? _activeCueAt;
  bool _disposed = false;
  bool _started = false;

  bool get automaticScoringEnabled => cueResponse != null;
  bool get hasActiveCue => _activeCueAt != null;
  LiveCoachSession get session => orchestrator.getSession();

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> start() async {
    if (_started || status == CameraCoachRuntimeStatus.warming) return;

    status = CameraCoachRuntimeStatus.warming;
    error = null;
    _notify();

    try {
      await orchestrator.warmup();
      _unsubscribe = frameSource.subscribe((frame) {
        unawaited(processFrame(frame));
      });
      await frameSource.start();
      _started = true;
      status = session.status == LiveCoachSessionStatus.complete
          ? CameraCoachRuntimeStatus.complete
          : CameraCoachRuntimeStatus.ready;
      _notify();
      await spokenCoach?.announce(SessionStartedCoachEvent(dogName));
    } catch (cause) {
      error = cause;
      status = CameraCoachRuntimeStatus.error;
      _notify();
    }
  }

  Future<bool> beginCue({DateTime? now}) async {
    if (!_started ||
        cueResponse == null ||
        status == CameraCoachRuntimeStatus.paused ||
        status == CameraCoachRuntimeStatus.awaitingOwnerConfirmation ||
        status == CameraCoachRuntimeStatus.complete ||
        status == CameraCoachRuntimeStatus.error) {
      return false;
    }

    final timestamp = (now ?? DateTime.now()).toUtc().toIso8601String();
    _activeCueAt = timestamp;
    status = CameraCoachRuntimeStatus.cueActive;
    error = null;
    _notify();

    await spokenCoach?.announce(
      RepStartedCoachEvent(session.reps.length + 1),
    );
    return true;
  }

  Future<void> processFrame(CameraFrame frame) async {
    if (!_started ||
        status == CameraCoachRuntimeStatus.warming ||
        status == CameraCoachRuntimeStatus.paused ||
        status == CameraCoachRuntimeStatus.complete ||
        status == CameraCoachRuntimeStatus.error ||
        status == CameraCoachRuntimeStatus.awaitingOwnerConfirmation) {
      return;
    }

    final expected = cueResponse;
    final cueAt = _activeCueAt;
    final observation = CameraRepObservation(
      outcome: TrainingOutcome.success,
      expectedPosture: expected?.expectedPosture,
      responseWindowMs: expected?.responseWindowMs,
      observedAt: frame.capturedAt,
      cueAt: cueAt,
      responseAt: cueAt == null ? null : frame.capturedAt,
      markerAt: null,
      rewardAt: null,
      cueCount: cueAt == null ? null : 1,
      signal: expected?.cueId,
    );

    try {
      final result = await orchestrator.processFrame(frame, observation);
      lastFrameResult = result;
      _refreshFraming();
      await _applyFrameResult(result);
      _notify();
    } catch (cause) {
      error = cause;
      status = CameraCoachRuntimeStatus.error;
      _notify();
    }
  }

  Future<bool> confirmPending(
    TrainingOutcome outcome, {
    DateTime? now,
  }) async {
    if (status != CameraCoachRuntimeStatus.awaitingOwnerConfirmation ||
        orchestrator.getPendingConfirmation() == null) {
      return false;
    }

    try {
      final result = orchestrator.confirmPendingByOwner(
        outcome,
        (now ?? DateTime.now()).toUtc().toIso8601String(),
      );
      lastFrameResult = result;
      await _handleRecordedRep(result);
      _notify();
      return true;
    } catch (cause) {
      error = cause;
      status = CameraCoachRuntimeStatus.error;
      _notify();
      return false;
    }
  }

  Future<void> pause() async {
    if (!_started ||
        status == CameraCoachRuntimeStatus.complete ||
        status == CameraCoachRuntimeStatus.error) {
      return;
    }

    // A paused cue is cancelled rather than allowing its response window to
    // continue silently in the background.
    _activeCueAt = null;
    status = CameraCoachRuntimeStatus.paused;
    _notify();
    await spokenCoach?.announce(const SessionPausedCoachEvent());
  }

  Future<void> resume() async {
    if (status != CameraCoachRuntimeStatus.paused) return;

    status = CameraCoachRuntimeStatus.ready;
    _notify();
    await spokenCoach?.announce(const SessionResumedCoachEvent());
  }

  Future<bool> repeatLastCoachMessage() async =>
      await spokenCoach?.repeatLast() ?? false;

  Future<void> setVoiceEnabled(bool enabled) async {
    await spokenCoach?.setEnabled(enabled);
  }

  Future<void> stop() async {
    if (status == CameraCoachRuntimeStatus.complete) return;

    _activeCueAt = null;
    orchestrator.stopByOwner();
    status = CameraCoachRuntimeStatus.complete;
    _notify();

    await _stopFrameSource();
    await spokenCoach?.announce(const SessionFinishedCoachEvent());
  }

  Future<void> shutdown() async {
    _activeCueAt = null;
    await _stopFrameSource();
    await spokenCoach?.stop();
    await orchestrator.dispose();
  }

  Future<void> _applyFrameResult(CameraCoachFrameResult result) async {
    switch (result.kind) {
      case CameraCoachFrameKind.ownerConfirmation:
        status = CameraCoachRuntimeStatus.awaitingOwnerConfirmation;
        await spokenCoach?.announce(
          OwnerConfirmationCoachEvent(result.pending!),
        );
      case CameraCoachFrameKind.repRecorded:
        await _handleRecordedRep(result);
      case CameraCoachFrameKind.sessionComplete:
        _activeCueAt = null;
        status = CameraCoachRuntimeStatus.complete;
        await _stopFrameSource();
        await spokenCoach?.announce(const SessionFinishedCoachEvent());
      case CameraCoachFrameKind.throttled:
      case CameraCoachFrameKind.busy:
      case CameraCoachFrameKind.waitingForTemporal:
      case CameraCoachFrameKind.waitingForTransition:
      case CameraCoachFrameKind.dogNotInView:
        status = _activeCueAt == null
            ? CameraCoachRuntimeStatus.ready
            : CameraCoachRuntimeStatus.cueActive;
    }
  }

  Future<void> _handleRecordedRep(CameraCoachFrameResult result) async {
    _activeCueAt = null;
    final decision = result.decision;
    if (decision != null) {
      await spokenCoach?.announce(DirectorDecisionCoachEvent(decision));
    }

    if (result.session.status == LiveCoachSessionStatus.complete) {
      status = CameraCoachRuntimeStatus.complete;
      await _stopFrameSource();
      await spokenCoach?.announce(const SessionFinishedCoachEvent());
    } else {
      status = CameraCoachRuntimeStatus.ready;
    }
  }

  void _refreshFraming() {
    final vision = orchestrator.getLastVisionResult();
    if (vision == null) return;

    framing = analyseSmartFraming(
      vision.dogBoundingBox,
      vision.trackingConfidence ?? 0,
      trackingState: vision.trackingState,
    );
  }

  Future<void> _stopFrameSource() async {
    if (!_started) return;
    _unsubscribe?.call();
    _unsubscribe = null;
    await frameSource.stop();
    _started = false;
  }

  @override
  void dispose() {
    _disposed = true;
    _unsubscribe?.call();
    _unsubscribe = null;
    unawaited(frameSource.stop());
    unawaited(spokenCoach?.stop());
    unawaited(orchestrator.dispose());
    super.dispose();
  }
}
