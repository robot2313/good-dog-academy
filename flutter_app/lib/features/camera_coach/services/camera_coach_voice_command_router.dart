import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../lessons/session/training_session_record.dart';
import '../domain/owner_voice_intent.dart';
import 'camera_coach_experience_controller.dart';
import 'camera_coach_runtime_controller.dart';
import 'hands_free_coach_controller.dart';

enum CameraCoachVoiceFeedbackKind {
  handled,
  blocked,
  unclear,
  error,
}

class CameraCoachVoiceFeedback {
  const CameraCoachVoiceFeedback({
    required this.kind,
    required this.message,
    this.transcript,
  });

  final CameraCoachVoiceFeedbackKind kind;
  final String message;
  final String? transcript;
}

abstract interface class CameraCoachVoiceActions {
  CameraCoachRuntimeStatus get status;
  bool get framingReady;

  Future<bool> beginCue();
  Future<bool> confirmPending(TrainingOutcome outcome);
  Future<void> pause();
  Future<void> resume();
  Future<bool> repeatLastCoachMessage();
  Future<void> stop();
}

class ExperienceCameraCoachVoiceActions implements CameraCoachVoiceActions {
  ExperienceCameraCoachVoiceActions(this.experience);

  final CameraCoachExperienceController experience;

  CameraCoachRuntimeController get _runtime => experience.runtime;

  @override
  CameraCoachRuntimeStatus get status => _runtime.status;

  @override
  bool get framingReady => _runtime.framing?.ready ?? false;

  @override
  Future<bool> beginCue() => experience.beginCue();

  @override
  Future<bool> confirmPending(TrainingOutcome outcome) =>
      experience.confirmPending(outcome);

  @override
  Future<void> pause() => experience.pause();

  @override
  Future<void> resume() => experience.resume();

  @override
  Future<bool> repeatLastCoachMessage() =>
      _runtime.repeatLastCoachMessage();

  @override
  Future<void> stop() => experience.stop();
}

/// Routes final owner voice intents through the same safety gates as buttons.
///
/// Voice never bypasses framing, pending-confirmation, pause, or completion
/// state. Recognition is re-armed only after the requested action (including
/// trainer speech) completes, reducing the chance of Camera Coach hearing its
/// own TTS response as the next owner command.
class CameraCoachVoiceCommandRouter extends ChangeNotifier {
  CameraCoachVoiceCommandRouter({
    required this.handsFree,
    required this.actions,
    this.sessionChanges,
  }) : _lastStatus = actions.status {
    _disposeEvent = handsFree.onEvent(_onHandsFreeEvent);
    sessionChanges?.addListener(_onSessionChanged);
  }

  final HandsFreeCoachController handsFree;
  final CameraCoachVoiceActions actions;
  final Listenable? sessionChanges;

  void Function()? _disposeEvent;
  Future<void> _serial = Future<void>.value();
  CameraCoachRuntimeStatus _lastStatus;
  bool _enabled = false;
  bool _disposed = false;
  bool _handlingEvent = false;

  CameraCoachVoiceFeedback? feedback;

  bool get enabled => _enabled;
  bool get listening => handsFree.isListening;

  Future<bool> setEnabled(bool enabled) async {
    if (_disposed) return false;

    if (!enabled) {
      _enabled = false;
      await handsFree.stop();
      _setFeedback(null);
      _notify();
      return true;
    }

    if (_enabled && handsFree.isListening) return true;

    _enabled = true;
    final started = await syncWithSessionState();
    if (!started && _enabled && !_shouldListen(actions.status)) {
      _setFeedback(
        const CameraCoachVoiceFeedback(
          kind: CameraCoachVoiceFeedbackKind.handled,
          message:
              'Hands-free commands are enabled and will listen at the next safe command point.',
        ),
      );
      _notify();
      return true;
    }
    return started;
  }

  Future<bool> syncWithSessionState() async {
    if (!_enabled || _disposed) return false;

    if (!_shouldListen(actions.status)) {
      await suspendListening();
      return false;
    }

    return _rearm();
  }

  Future<void> suspendListening() async {
    if (handsFree.isListening) {
      await handsFree.stop();
    }
  }

  void _onSessionChanged() {
    final next = actions.status;
    final previous = _lastStatus;
    _lastStatus = next;

    if (!_enabled || _disposed || _handlingEvent || next == previous) return;

    if (!_shouldListen(next)) {
      unawaited(suspendListening());
      return;
    }

    // Pause/resume notify before their trainer speech finishes. The caller
    // explicitly re-synchronizes after those actions complete.
    if (next == CameraCoachRuntimeStatus.paused ||
        previous == CameraCoachRuntimeStatus.paused) {
      unawaited(suspendListening());
      return;
    }

    // Frame-driven transitions to owner confirmation or the next ready state
    // happen after spoken coaching completes, so it is safe to listen again.
    unawaited(syncWithSessionState());
  }

  void _onHandsFreeEvent(HandsFreeCoachEvent event) {
    if (!_enabled || _disposed) return;

    _serial = _serial.then((_) => _handle(event)).catchError((
      Object cause,
      StackTrace _,
    ) {
      if (_disposed) return;
      _setFeedback(
        CameraCoachVoiceFeedback(
          kind: CameraCoachVoiceFeedbackKind.error,
          message: 'Voice command failed: $cause',
        ),
      );
      _notify();
    });
  }

  Future<void> _handle(HandsFreeCoachEvent event) async {
    if (!_enabled || _disposed) return;

    _handlingEvent = true;
    try {
      // Stop the current one-shot recognizer before performing an action that
      // may itself speak. We re-arm after the action completes.
      await handsFree.stop();

    if (event is HandsFreeErrorEvent) {
      _setFeedback(
        CameraCoachVoiceFeedback(
          kind: CameraCoachVoiceFeedbackKind.error,
          message: event.message,
        ),
      );
      _enabled = false;
      _notify();
      return;
    }

    if (event is HandsFreeUnclearEvent) {
      _setFeedback(
        CameraCoachVoiceFeedback(
          kind: CameraCoachVoiceFeedbackKind.unclear,
          message: 'I did not catch that command.',
          transcript: event.transcript,
        ),
      );
      _notify();
      await _rearm();
      return;
    }

    final intentEvent = event as HandsFreeIntentEvent;
    final intent = intentEvent.intent;
    var shouldRearm = true;

    switch (intent) {
      case OwnerVoiceIntent.success:
        await _confirm(
          TrainingOutcome.success,
          intentEvent.transcript,
        );
        break;
      case OwnerVoiceIntent.partialSuccess:
        await _confirm(
          TrainingOutcome.partialSuccess,
          intentEvent.transcript,
        );
        break;
      case OwnerVoiceIntent.unsuccessful:
        await _confirm(
          TrainingOutcome.unsuccessful,
          intentEvent.transcript,
        );
        break;
      case OwnerVoiceIntent.nextRep:
        if (actions.status != CameraCoachRuntimeStatus.ready) {
          _blocked(
            'Finish the current Camera Coach step before starting another rep.',
            intentEvent.transcript,
          );
        } else if (!actions.framingReady) {
          _blocked(
            'Keep your dog safely in frame before starting the next rep.',
            intentEvent.transcript,
          );
        } else if (await actions.beginCue()) {
          _handled('Next rep started.', intentEvent.transcript);
          // Do not listen while the dog rep is being watched. Recognition
          // re-arms when Camera Coach reaches the next safe command state.
          shouldRearm = false;
        } else {
          _blocked(
            'Camera Coach is not ready to start the next rep yet.',
            intentEvent.transcript,
          );
        }
        break;
      case OwnerVoiceIntent.pause:
        if (_canPause(actions.status)) {
          await actions.pause();
          _handled('Camera Coach paused.', intentEvent.transcript);
        } else {
          _blocked(
            'Camera Coach cannot pause from the current state.',
            intentEvent.transcript,
          );
        }
        break;
      case OwnerVoiceIntent.resume:
        if (actions.status == CameraCoachRuntimeStatus.paused) {
          await actions.resume();
          _handled('Camera Coach resumed.', intentEvent.transcript);
        } else {
          _blocked(
            'Camera Coach is not paused.',
            intentEvent.transcript,
          );
        }
        break;
      case OwnerVoiceIntent.repeat:
        if (await actions.repeatLastCoachMessage()) {
          _handled('Repeated the last trainer message.', intentEvent.transcript);
        } else {
          _blocked(
            'There is no trainer message to repeat yet.',
            intentEvent.transcript,
          );
        }
        break;
      case OwnerVoiceIntent.stop:
        if (actions.status != CameraCoachRuntimeStatus.complete) {
          await actions.stop();
          _handled('Camera Coach session ended.', intentEvent.transcript);
        }
        shouldRearm = false;
        _enabled = false;
        break;
      case OwnerVoiceIntent.unknown:
        _setFeedback(
          CameraCoachVoiceFeedback(
            kind: CameraCoachVoiceFeedbackKind.unclear,
            message: 'I did not catch that command.',
            transcript: intentEvent.transcript,
          ),
        );
        break;
    }

      _notify();
      if (shouldRearm) {
        await _rearm();
      }
    } finally {
      _handlingEvent = false;
    }
  }

  Future<void> _confirm(
    TrainingOutcome outcome,
    String transcript,
  ) async {
    if (actions.status !=
        CameraCoachRuntimeStatus.awaitingOwnerConfirmation) {
      _blocked(
        'There is no rep waiting for owner confirmation.',
        transcript,
      );
      return;
    }

    if (await actions.confirmPending(outcome)) {
      _handled('Rep confirmed.', transcript);
    } else {
      _blocked('That rep could not be confirmed yet.', transcript);
    }
  }

  bool _canPause(CameraCoachRuntimeStatus status) {
    return status == CameraCoachRuntimeStatus.ready ||
        status == CameraCoachRuntimeStatus.cueActive ||
        status == CameraCoachRuntimeStatus.awaitingOwnerConfirmation;
  }

  Future<bool> _rearm() async {
    if (!_enabled || _disposed || !_shouldListen(actions.status)) {
      return false;
    }

    try {
      if (handsFree.isListening) {
        await handsFree.stop();
      }
      final started = await handsFree.start();
      if (!started) {
        _enabled = false;
        _setFeedback(
          const CameraCoachVoiceFeedback(
            kind: CameraCoachVoiceFeedbackKind.error,
            message:
                'Hands-free listening stopped. Use the on-screen controls.',
          ),
        );
        _notify();
        return false;
      }
      return true;
    } catch (cause) {
      _enabled = false;
      _setFeedback(
        CameraCoachVoiceFeedback(
          kind: CameraCoachVoiceFeedbackKind.error,
          message: 'Hands-free listening stopped: $cause',
        ),
      );
      _notify();
      return false;
    }
  }

  bool _shouldListen(CameraCoachRuntimeStatus status) {
    return status == CameraCoachRuntimeStatus.ready ||
        status == CameraCoachRuntimeStatus.awaitingOwnerConfirmation ||
        status == CameraCoachRuntimeStatus.paused;
  }

  void _handled(String message, String transcript) {
    _setFeedback(
      CameraCoachVoiceFeedback(
        kind: CameraCoachVoiceFeedbackKind.handled,
        message: message,
        transcript: transcript,
      ),
    );
  }

  void _blocked(String message, String transcript) {
    _setFeedback(
      CameraCoachVoiceFeedback(
        kind: CameraCoachVoiceFeedbackKind.blocked,
        message: message,
        transcript: transcript,
      ),
    );
  }

  void _setFeedback(CameraCoachVoiceFeedback? value) {
    feedback = value;
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> shutdown() async {
    _enabled = false;
    sessionChanges?.removeListener(_onSessionChanged);
    _disposeEvent?.call();
    _disposeEvent = null;
    await handsFree.abort();
    handsFree.dispose();
  }

  @override
  void dispose() {
    _disposed = true;
    _enabled = false;
    sessionChanges?.removeListener(_onSessionChanged);
    _disposeEvent?.call();
    _disposeEvent = null;
    handsFree.dispose();
    super.dispose();
  }
}
