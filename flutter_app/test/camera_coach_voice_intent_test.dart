import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/owner_voice_intent.dart';

void main() {
  test('stop outranks other words in the same transcript', () {
    expect(
      parseOwnerVoiceIntent('yes stop session'),
      OwnerVoiceIntent.stop,
    );
  });

  test('pause and resume remain distinct from stop', () {
    expect(parseOwnerVoiceIntent('hold on'), OwnerVoiceIntent.pause);
    expect(parseOwnerVoiceIntent('carry on'), OwnerVoiceIntent.resume);
  });

  test('owner outcome language maps conservatively', () {
    expect(parseOwnerVoiceIntent('got it'), OwnerVoiceIntent.success);
    expect(parseOwnerVoiceIntent('almost'), OwnerVoiceIntent.partialSuccess);
    expect(parseOwnerVoiceIntent("didn't do it"), OwnerVoiceIntent.unsuccessful);
  });

  test('next and repeat commands are recognised', () {
    expect(parseOwnerVoiceIntent('ready for next'), OwnerVoiceIntent.nextRep);
    expect(parseOwnerVoiceIntent('say that again'), OwnerVoiceIntent.repeat);
  });

  test('unrecognised speech stays unknown', () {
    expect(
      parseOwnerVoiceIntent('the weather looks nice'),
      OwnerVoiceIntent.unknown,
    );
  });
}
