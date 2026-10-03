import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/live_coach_engine.dart';
import 'package:good_dog_academy/features/camera_coach/domain/spoken_coach_policy.dart';

void main() {
  test('session start names the selected dog and interrupts stale speech', () {
    final message = spokenCoachMessage(
      const SessionStartedCoachEvent('Scout'),
    );

    expect(message.text, contains('Scout'));
    expect(message.interrupt, isTrue);
    expect(message.priority, SpokenCoachPriority.normal);
  });

  test('ordinary director decision remains normal priority', () {
    final message = spokenCoachMessage(
      const DirectorDecisionCoachEvent(
        SessionDirectorDecision(
          action: SessionDirectorAction.hold,
          headline: 'Hold this setup',
          reason: 'Need more evidence.',
          instruction: 'Repeat once more.',
          nextDifficulty: DifficultyVector(
            distance: 1,
            duration: 1,
            distraction: 1,
          ),
        ),
      ),
    );

    expect(message.priority, SpokenCoachPriority.normal);
    expect(message.interrupt, isFalse);
    expect(message.text, contains('Repeat once more.'));
  });

  test('safety break overrides normal coaching tone and interrupts', () {
    final message = spokenCoachMessage(
      const DirectorDecisionCoachEvent(
        SessionDirectorDecision(
          action: SessionDirectorAction.safetyBreak,
          headline: 'Reduce pressure',
          reason: 'Possible discomfort signal.',
          instruction: 'Give your dog more space.',
          nextDifficulty: DifficultyVector(
            distance: 1,
            duration: 1,
            distraction: 1,
          ),
        ),
      ),
    );

    expect(message.priority, SpokenCoachPriority.safety);
    expect(message.interrupt, isTrue);
    expect(message.text, startsWith('Pause here.'));
  });

  test('pause, resume and finish are explicit session messages', () {
    expect(
      spokenCoachMessage(const SessionPausedCoachEvent()).text,
      contains('No rep will be scored'),
    );
    expect(
      spokenCoachMessage(const SessionResumedCoachEvent()).text,
      contains('same session'),
    );
    expect(
      spokenCoachMessage(const SessionFinishedCoachEvent()).text,
      contains('Session complete'),
    );
  });
}
