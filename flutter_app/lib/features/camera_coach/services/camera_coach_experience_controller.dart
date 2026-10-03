import 'dart:async';

import 'package:flutter/foundation.dart';

import '../domain/camera_coach_qa_lessons.dart';
import '../domain/live_coach_engine.dart';
import 'camera_coach_runtime_controller.dart';
import 'camera_coach_session_persistence_service.dart';

enum CameraCoachSaveState {
  idle,
  saving,
  saved,
  qaComplete,
  noTrainingEvidence,
  error,
}

/// Product-level Camera Coach lifecycle.
///
/// This keeps the model-neutral runtime separate from app persistence while
/// ensuring completed production sessions are remembered exactly once.
class CameraCoachExperienceController extends ChangeNotifier {
  CameraCoachExperienceController({
    required this.runtime,
    required this.persister,
    required this.ownerId,
    required this.dogId,
    this.dailyPlanId,
    this.allowPrerequisiteBypass = false,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now {
    runtime.addListener(_runtimeChanged);
  }

  final CameraCoachRuntimeController runtime;
  final CameraCoachSessionPersister persister;
  final String ownerId;
  final String dogId;
  final String? dailyPlanId;
  final bool allowPrerequisiteBypass;
  final DateTime Function() _now;

  CameraCoachSaveState saveState = CameraCoachSaveState.idle;
  Object? saveError;

  DateTime? _startedAt;
  DateTime? _completedAt;
  Future<void>? _saveFuture;
  String? _savedSessionId;
  bool _disposed = false;

  DateTime? get startedAt => _startedAt;
  DateTime? get completedAt => _completedAt;
  bool get canRetrySave => saveState == CameraCoachSaveState.error;

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> start() async {
    _startedAt ??= _now().toUtc();
    await runtime.start();
    await _syncCompletion();
  }

  Future<bool> beginCue() => runtime.beginCue(now: _now());

  Future<bool> confirmPending(TrainingOutcome outcome) async {
    final confirmed = await runtime.confirmPending(outcome, now: _now());
    await _syncCompletion();
    return confirmed;
  }

  Future<void> pause() => runtime.pause();

  Future<void> resume() => runtime.resume();

  Future<void> stop() async {
    await runtime.stop();
    await _syncCompletion();
  }

  Future<bool> retrySave() async {
    if (saveState != CameraCoachSaveState.error) return false;
    _saveFuture = null;
    saveError = null;
    saveState = CameraCoachSaveState.idle;
    _notify();
    await _syncCompletion();
    return saveState == CameraCoachSaveState.saved ||
        saveState == CameraCoachSaveState.qaComplete ||
        saveState == CameraCoachSaveState.noTrainingEvidence;
  }

  Future<void> shutdown() async {
    runtime.removeListener(_runtimeChanged);
    await runtime.shutdown();
  }

  void _runtimeChanged() {
    _notify();
    if (runtime.status == CameraCoachRuntimeStatus.complete) {
      unawaited(_syncCompletion());
    }
  }

  Future<void> _syncCompletion() {
    if (runtime.status != CameraCoachRuntimeStatus.complete) {
      return Future<void>.value();
    }

    final session = runtime.session;
    if (_savedSessionId == session.id ||
        saveState == CameraCoachSaveState.saved ||
        saveState == CameraCoachSaveState.qaComplete ||
        saveState == CameraCoachSaveState.noTrainingEvidence) {
      return Future<void>.value();
    }

    final active = _saveFuture;
    if (active != null) return active;

    final future = _persistCompleted(session);
    _saveFuture = future;
    return future.whenComplete(() {
      if (identical(_saveFuture, future)) {
        _saveFuture = null;
      }
    });
  }

  Future<void> _persistCompleted(LiveCoachSession session) async {
    if (isCameraCoachQaLessonId(session.lessonId)) {
      saveState = CameraCoachSaveState.qaComplete;
      saveError = null;
      _notify();
      return;
    }

    if (session.reps.isEmpty) {
      saveState = CameraCoachSaveState.noTrainingEvidence;
      saveError = null;
      _notify();
      return;
    }

    final started = _startedAt;
    if (started == null) {
      saveState = CameraCoachSaveState.error;
      saveError = StateError(
        'Camera Coach completion is missing its session start time.',
      );
      _notify();
      return;
    }

    // Freeze completion time on the first save attempt. An idempotent retry
    // must submit byte-for-byte equivalent session identity fields.
    _completedAt ??= _now().toUtc();

    saveState = CameraCoachSaveState.saving;
    saveError = null;
    _notify();

    try {
      await persister.persistCompletedSession(
        ownerId: ownerId,
        dogId: dogId,
        session: session,
        startedAt: started.toIso8601String(),
        dailyPlanId: dailyPlanId,
        completedAt: _completedAt,
        notes: 'Completed with Camera Coach.',
        allowPrerequisiteBypass: allowPrerequisiteBypass,
      );
      _savedSessionId = session.id;
      saveState = CameraCoachSaveState.saved;
      saveError = null;
    } catch (cause) {
      saveState = CameraCoachSaveState.error;
      saveError = cause;
    }
    _notify();
  }

  @override
  void dispose() {
    _disposed = true;
    runtime.removeListener(_runtimeChanged);
    runtime.dispose();
    super.dispose();
  }
}
