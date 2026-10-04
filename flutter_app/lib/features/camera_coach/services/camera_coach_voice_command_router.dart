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
  }) {
    _disposeEvent = handsFree.onEvent(_onHandsFreeEvent);
  }

  final HandsFreeCoachController handsFree;
  final CameraCoachVoiceActions actions;

  void Function()? _disposeEvent;
  Future<void> _serial = Future<void>.value();
  bool _enabled = false;
  bool _disposed = false;

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

    try {
      final started = await handsFree.start();
      _enabled = started;
      if (!started) {
        _setFeedback(
          const CameraCoachVoiceFeedback(
            kind: CameraCoachVoiceFeedbackKind.blocked,
            message:
                'Hands-free commands are unavailable. Use the on-screen controls.',
          ),
        );
      } else {
        _setFeedback(
          const CameraCoachVoiceFeedback(
            kind: CameraCoachVoiceFeedbackKind.handled,
            message: 'Hands-free commands are listening.',
          ),
        );
      }
      _notify();
      return started;
    } catch (cause) {
      _enabled = false;
      _setFeedback(
        CameraCoachVoiceFeedback(
          kind: CameraCoachVoiceFeedbackKind.error,
          message: 'Hands-free commands could not start: $cause',
        ),
      );
      _notify();
      return false;
    }
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
      case OwnerVoiceIntent.partialSuccess:
        await _confirm(
          TrainingOutcome.partialSuccess,
          intentEvent.transcript,
        );
      case OwnerVoiceIntent.unsuccessful:
        await _confirm(
          TrainingOutcome.unsuccessful,
          intentEvent.transcript,
        );
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
        } else {
          _blocked(
            'Camera Coach is not ready to start the next rep yet.',
            intentEvent.transcript,
          );
        }
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
      case OwnerVoiceIntent.repeat:
        if (await actions.repeatLastCoachMessage()) {
          _handled('Repeated the last trainer message.', intentEvent.transcript);
        } else {
          _blocked(
            'There is no trainer message to repeat yet.',
            intentEvent.transcript,
          );
        }
      case OwnerVoiceIntent.stop:
        if (actions.status != CameraCoachRuntimeStatus.complete) {
          await actions.stop();
          _handled('Camera Coach session ended.', intentEvent.transcript);
        }
        shouldRearm = false;
        _enabled = false;
      case OwnerVoiceIntent.unknown:
        _setFeedback(
          CameraCoachVoiceFeedback(
            kind: CameraCoachVoiceFeedbackKind.unclear,
            message: 'I did not catch that command.',
            transcript: intentEvent.transcript,
          ),
        );
    }

    _notify();
    if (shouldRearm) {
      await _rearm();
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

  Future<void> _rearm() async {
    if (!_enabled ||
        _disposed ||
        actions.status == CameraCoachRuntimeStatus.complete) {
      return;
    }

    try {
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
      }
    } catch (cause) {
      _enabled = false;
      _setFeedback(
        CameraCoachVoiceFeedback(
          kind: CameraCoachVoiceFeedbackKind.error,
          message: 'Hands-free listening stopped: $cause',
        ),
      );
      _notify();
    }
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
    _disposeEvent?.call();
    _disposeEvent = null;
    await handsFree.abort();
    handsFree.dispose();
  }

  @override
  void dispose() {
    _disposed = true;
    _enabled = false;
    _disposeEvent?.call();
    _disposeEvent = null;
    handsFree.dispose();
    super.dispose();
  }
}
