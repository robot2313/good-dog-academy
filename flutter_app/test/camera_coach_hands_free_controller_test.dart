import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/owner_voice_intent.dart';
import 'package:good_dog_academy/features/camera_coach/services/hands_free_coach_controller.dart';
import 'package:good_dog_academy/features/camera_coach/services/training_speech_recognizer.dart';

class _FakeRecognizer implements TrainingSpeechRecognizer {
  SpeechResultListener? resultListener;
  SpeechErrorListener? errorListener;
  bool available = true;
  bool permission = true;
  final starts = <SpeechRecognitionOptions>[];

  @override
  Future<SpeechRecognitionAvailability> getAvailability() async => available
      ? const SpeechRecognitionAvailability.available()
      : const SpeechRecognitionAvailability.unavailable(
          SpeechRecognitionUnavailableReason.unsupported,
        );

  @override
  Future<bool> requestPermission() async => permission;

  @override
  Future<void> start({
    SpeechRecognitionOptions options = const SpeechRecognitionOptions(),
  }) async {
    starts.add(options);
  }

  @override
  Future<void> stop() async {}

  @override
  Future<void> abort() async {}

  @override
  SpeechListenerDisposer onResult(SpeechResultListener listener) {
    resultListener = listener;
    return () => resultListener = null;
  }

  @override
  SpeechListenerDisposer onError(SpeechErrorListener listener) {
    errorListener = listener;
    return () => errorListener = null;
  }

  void emit(
    String transcript, {
    double? confidence = 0.9,
    bool isFinal = true,
  }) {
    resultListener?.call(
      SpeechRecognitionResult(
        transcript: transcript,
        confidence: confidence,
        isFinal: isFinal,
        receivedAt: '2026-10-04T00:00:00Z',
      ),
    );
  }

  void fail(String message) => errorListener?.call(message);
}

void main() {
  test('starts only when recognition exists and permission is granted', () async {
    final recognizer = _FakeRecognizer();
    final controller = HandsFreeCoachController(recognizer);

    expect(await controller.start(), isTrue);
    expect(recognizer.starts, hasLength(1));
    expect(recognizer.starts.single.locale, 'en-AU');
    expect(recognizer.starts.single.interimResults, isFalse);
  });

  test('fails closed when recognition is unavailable', () async {
    final recognizer = _FakeRecognizer()..available = false;
    final controller = HandsFreeCoachController(recognizer);

    expect(await controller.start(), isFalse);
    expect(recognizer.starts, isEmpty);
  });

  test('only final confident speech emits a scoring intent', () async {
    final recognizer = _FakeRecognizer();
    final controller = HandsFreeCoachController(recognizer);
    final events = <HandsFreeCoachEvent>[];
    controller.onEvent(events.add);
    await controller.start();

    recognizer.emit('yes', isFinal: false);
    recognizer.emit('yes');

    expect(events, hasLength(1));
    final event = events.single as HandsFreeIntentEvent;
    expect(event.intent, OwnerVoiceIntent.success);
    expect(event.transcript, 'yes');
  });

  test('low-confidence scoring speech becomes unclear', () async {
    final recognizer = _FakeRecognizer();
    final controller = HandsFreeCoachController(recognizer);
    final events = <HandsFreeCoachEvent>[];
    controller.onEvent(events.add);
    await controller.start();

    recognizer.emit('success', confidence: 0.2);

    expect(events.single, isA<HandsFreeUnclearEvent>());
    expect((events.single as HandsFreeUnclearEvent).transcript, 'success');
  });

  test('stop is always surfaced even at low confidence', () async {
    final recognizer = _FakeRecognizer();
    final controller = HandsFreeCoachController(recognizer);
    final events = <HandsFreeCoachEvent>[];
    controller.onEvent(events.add);
    await controller.start();

    recognizer.emit('stop the session', confidence: 0.1);

    final event = events.single as HandsFreeIntentEvent;
    expect(event.intent, OwnerVoiceIntent.stop);
  });

  test('recognizer errors pass through to the UI layer', () async {
    final recognizer = _FakeRecognizer();
    final controller = HandsFreeCoachController(recognizer);
    final events = <HandsFreeCoachEvent>[];
    controller.onEvent(events.add);
    await controller.start();

    recognizer.fail('microphone unavailable');

    expect(events.single, isA<HandsFreeErrorEvent>());
    expect(
      (events.single as HandsFreeErrorEvent).message,
      'microphone unavailable',
    );
  });
}
