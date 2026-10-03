import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/live_coach_engine.dart';
import 'package:good_dog_academy/features/camera_coach/domain/spoken_coach_policy.dart';
import 'package:good_dog_academy/features/camera_coach/services/coach_speech.dart';
import 'package:good_dog_academy/features/camera_coach/services/spoken_coach_controller.dart';

class _SpeechCall {
  const _SpeechCall(this.text, this.options);
  final String text;
  final CoachSpeechOptions options;
}

class _FakeSpeech implements CoachSpeech {
  final calls = <_SpeechCall>[];
  int stops = 0;

  @override
  Future<void> speak(
    String text, {
    CoachSpeechOptions options = const CoachSpeechOptions(),
  }) async {
    calls.add(_SpeechCall(text, options));
  }

  @override
  Future<void> stop() async {
    stops++;
  }
}

SessionDirectorDecision _decision(SessionDirectorAction action) =>
    SessionDirectorDecision(
      action: action,
      headline: action == SessionDirectorAction.safetyBreak
          ? 'Reduce pressure'
          : 'Ready to progress',
      reason: 'test',
      instruction: action == SessionDirectorAction.safetyBreak
          ? 'Give your dog more space.'
          : 'Increase one variable only.',
      nextDifficulty: const DifficultyVector(
        distance: 1,
        duration: 2,
        distraction: 1,
      ),
    );

void main() {
  test('normal coaching is spoken through the adapter', () async {
    final speech = _FakeSpeech();
    final controller = SpokenCoachController(speech);

    await controller.announce(const RepStartedCoachEvent(2));

    expect(speech.calls, hasLength(1));
    expect(speech.calls.single.text, 'Rep 2. Give the cue once, then wait.');
    expect(speech.calls.single.options.interrupt, isFalse);
    expect(speech.calls.single.options.rate, 0.92);
  });

  test('identical non-interrupting guidance is deduplicated', () async {
    final speech = _FakeSpeech();
    final controller = SpokenCoachController(speech);

    await controller.announce(const RepStartedCoachEvent(2));
    await controller.announce(const RepStartedCoachEvent(2));

    expect(speech.calls, hasLength(1));
  });

  test('repeat only works after something has been spoken', () async {
    final speech = _FakeSpeech();
    final controller = SpokenCoachController(speech);

    expect(await controller.repeatLast(), isFalse);
    await controller.announce(const RepStartedCoachEvent(2));
    expect(await controller.repeatLast(), isTrue);

    expect(speech.calls, hasLength(2));
    expect(speech.calls.last.options.interrupt, isTrue);
    expect(speech.calls.last.options.rate, 0.92);
  });

  test('safety coaching interrupts and uses the calmer rate', () async {
    final speech = _FakeSpeech();
    final controller = SpokenCoachController(speech);

    await controller.announce(
      DirectorDecisionCoachEvent(
        _decision(SessionDirectorAction.safetyBreak),
      ),
    );

    expect(speech.calls.single.text, 'Pause here. Give your dog more space.');
    expect(speech.calls.single.options.interrupt, isTrue);
    expect(speech.calls.single.options.rate, 0.88);
  });

  test('disabling voice stops speech and blocks announcements', () async {
    final speech = _FakeSpeech();
    final controller = SpokenCoachController(speech);

    await controller.setEnabled(false);
    await controller.announce(
      DirectorDecisionCoachEvent(
        _decision(SessionDirectorAction.progress),
      ),
    );

    expect(speech.stops, 1);
    expect(speech.calls, isEmpty);
  });
}
