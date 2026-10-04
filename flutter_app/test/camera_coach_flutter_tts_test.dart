import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/services/coach_speech.dart';
import 'package:good_dog_academy/features/camera_coach/services/flutter_coach_speech.dart';

class _FakeTtsDriver implements FlutterTtsDriver {
  final events = <String>[];
  final rates = <double>[];
  int languageCalls = 0;
  int volumeCalls = 0;
  int pitchCalls = 0;
  int speakCalls = 0;
  int stopCalls = 0;
  bool throwOnSpeak = false;

  @override
  Future<void> setLanguage(String language) async {
    languageCalls++;
    events.add('language:$language');
  }

  @override
  Future<void> setSpeechRate(double rate) async {
    rates.add(rate);
    events.add('rate');
  }

  @override
  Future<void> setVolume(double volume) async {
    volumeCalls++;
  }

  @override
  Future<void> setPitch(double pitch) async {
    pitchCalls++;
  }

  @override
  Future<void> speak(String text) async {
    speakCalls++;
    events.add('speak:$text');
    if (throwOnSpeak) throw StateError('native TTS unavailable');
  }

  @override
  Future<void> stop() async {
    stopCalls++;
    events.add('stop');
  }
}

void main() {
  test('configures Australian trainer voice once and speaks requested rate', () async {
    final driver = _FakeTtsDriver();
    final speech = FlutterCoachSpeech(driver: driver);

    await speech.speak('Good work');
    await speech.speak(
      'Try again',
      options: const CoachSpeechOptions(rate: 0.88),
    );

    expect(driver.languageCalls, 1);
    expect(driver.volumeCalls, 1);
    expect(driver.pitchCalls, 1);
    expect(driver.rates, <double>[0.92, 0.88]);
    expect(driver.speakCalls, 2);
    expect(speech.available, isTrue);
  });

  test('interrupting safety speech stops current speech before speaking', () async {
    final driver = _FakeTtsDriver();
    final speech = FlutterCoachSpeech(driver: driver);

    await speech.speak(
      'Pause here',
      options: const CoachSpeechOptions(
        interrupt: true,
        rate: 0.88,
      ),
    );

    final stopIndex = driver.events.indexOf('stop');
    final speakIndex = driver.events.indexOf('speak:Pause here');
    expect(stopIndex, greaterThanOrEqualTo(0));
    expect(speakIndex, greaterThan(stopIndex));
  });

  test('speech rates are clamped to native plugin range', () async {
    final driver = _FakeTtsDriver();
    final speech = FlutterCoachSpeech(driver: driver);

    await speech.speak(
      'Slow',
      options: const CoachSpeechOptions(rate: -2),
    );
    await speech.speak(
      'Fast',
      options: const CoachSpeechOptions(rate: 4),
    );

    expect(driver.rates, <double>[0.1, 1]);
  });

  test('native speech failure never escapes into Camera Coach', () async {
    final driver = _FakeTtsDriver()..throwOnSpeak = true;
    final speech = FlutterCoachSpeech(driver: driver);

    await speech.speak('Coach message');

    expect(speech.available, isFalse);
    expect(speech.lastError, isA<StateError>());
    expect(driver.speakCalls, 1);

    await speech.speak('Ignored after native failure');
    expect(driver.speakCalls, 1);
  });

  test('blank coaching text does not initialize the speech engine', () async {
    final driver = _FakeTtsDriver();
    final speech = FlutterCoachSpeech(driver: driver);

    await speech.speak('   ');

    expect(driver.languageCalls, 0);
    expect(driver.speakCalls, 0);
  });
}
