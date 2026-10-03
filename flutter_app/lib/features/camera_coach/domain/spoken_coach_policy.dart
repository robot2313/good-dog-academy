import 'camera_coach_orchestrator.dart';
import 'live_coach_engine.dart';

enum SpokenCoachPriority { normal, safety }

class SpokenCoachMessage {
  const SpokenCoachMessage({
    required this.text,
    required this.priority,
    required this.interrupt,
  });

  final String text;
  final SpokenCoachPriority priority;
  final bool interrupt;
}

sealed class SpokenCoachEvent {
  const SpokenCoachEvent();
}

class SessionStartedCoachEvent extends SpokenCoachEvent {
  const SessionStartedCoachEvent(this.dogName);
  final String dogName;
}

class RepStartedCoachEvent extends SpokenCoachEvent {
  const RepStartedCoachEvent(this.repNumber);
  final int repNumber;
}

class OwnerConfirmationCoachEvent extends SpokenCoachEvent {
  const OwnerConfirmationCoachEvent(this.pending);
  final CameraCoachPendingConfirmation pending;
}

class DirectorDecisionCoachEvent extends SpokenCoachEvent {
  const DirectorDecisionCoachEvent(this.decision);
  final SessionDirectorDecision decision;
}

class SessionPausedCoachEvent extends SpokenCoachEvent {
  const SessionPausedCoachEvent();
}

class SessionResumedCoachEvent extends SpokenCoachEvent {
  const SessionResumedCoachEvent();
}

class SessionFinishedCoachEvent extends SpokenCoachEvent {
  const SessionFinishedCoachEvent();
}

SpokenCoachMessage spokenCoachMessage(SpokenCoachEvent event) {
  return switch (event) {
    SessionStartedCoachEvent(:final dogName) => SpokenCoachMessage(
        text:
            'Camera Coach is ready for $dogName. Give each cue once, then wait for the response.',
        priority: SpokenCoachPriority.normal,
        interrupt: true,
      ),
    RepStartedCoachEvent(:final repNumber) => SpokenCoachMessage(
        text: 'Rep $repNumber. Give the cue once, then wait.',
        priority: SpokenCoachPriority.normal,
        interrupt: false,
      ),
    OwnerConfirmationCoachEvent() => const SpokenCoachMessage(
        text:
            'I am not confident enough to score that rep automatically. Please confirm what happened.',
        priority: SpokenCoachPriority.normal,
        interrupt: true,
      ),
    DirectorDecisionCoachEvent(:final decision) => SpokenCoachMessage(
        text: decision.action == SessionDirectorAction.safetyBreak
            ? 'Pause here. ${decision.instruction}'
            : '${decision.headline}. ${decision.instruction}',
        priority: decision.action == SessionDirectorAction.safetyBreak
            ? SpokenCoachPriority.safety
            : SpokenCoachPriority.normal,
        interrupt:
            decision.action == SessionDirectorAction.safetyBreak ||
            decision.action == SessionDirectorAction.finish,
      ),
    SessionPausedCoachEvent() => const SpokenCoachMessage(
        text:
            'Training paused. No rep will be scored while paused. Say resume when you are ready.',
        priority: SpokenCoachPriority.normal,
        interrupt: true,
      ),
    SessionResumedCoachEvent() => const SpokenCoachMessage(
        text:
            'Training resumed. We will continue from the same session.',
        priority: SpokenCoachPriority.normal,
        interrupt: true,
      ),
    SessionFinishedCoachEvent() => const SpokenCoachMessage(
        text:
            'Session complete. Finish on a calm note and let your dog reset.',
        priority: SpokenCoachPriority.normal,
        interrupt: true,
      ),
  };
}
