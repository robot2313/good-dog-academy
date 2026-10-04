import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/services/flutter_training_speech_recognizer.dart';
import 'package:good_dog_academy/features/camera_coach/services/training_speech_recognizer.dart';

class _FakeDriver implements NativeTrainingSpeechDriver {
  bool initializeResult = true;
  String? initializeError;
  int initializeCalls = 0;
  int listenCalls = 0;
  int stopCalls = 0;
  int cancelCalls = 0;
  String? locale;
  bool? partialResults;
  void Function(String message)? errorListener;
  void Function(NativeSpeechResult result)? resultListener;

  @override
  Future<bool> initialize({
    required void Function(String message) onError,
  }) async {
    initializeCalls++;
    errorListener = onError;
    final error = initializeError;
    if (error != null) onError(error);
    return initializeResult;
  }

  @override
  Future<void> listen({
    required void Function(NativeSpeechResult result) onResult,
    required String locale,
    required bool partialResults,
  }) async {
    listenCalls++;
    resultListener = onResult;
    this.locale = locale;
    this.partialResults = partialResults;
  }

  @override
  Future<void> stop() async {
    stopCalls++;
  }

  @override
  Future<void> cancel() async {
    cancelCalls++;
  }
}

void main() {
  test('unsupported platform fails closed before native initialization', () async {
    final driver = _FakeDriver();
    final recognizer = FlutterTrainingSpeechRecognizer(
      driver: driver,
      platformSupported: false,
    );

    final availability = await recognizer.getAvailability();

    expect(availability.available, isFalse);
    expect(
      availability.reason,
      SpeechRecognitionUnavailableReason.unsupported,
    );
    expect(await recognizer.requestPermission(), isFalse);
    expect(driver.initializeCalls, 0);
  });

  test('permission initialization happens once and start uses en-AU options', () async {
    final driver = _FakeDriver();
    final recognizer = FlutterTrainingSpeechRecognizer(
      driver: driver,
      platformSupported: true,
    );

    expect(await recognizer.requestPermission(), isTrue);
    expect(await recognizer.requestPermission(), isTrue);

    await recognizer.start();

    expect(driver.initializeCalls, 1);
    expect(driver.listenCalls, 1);
    expect(driver.locale, 'en-AU');
    expect(driver.partialResults, isFalse);
  });

  test('native results map transcript confidence and final state', () async {
    final driver = _FakeDriver();
    final recognizer = FlutterTrainingSpeechRecognizer(
      driver: driver,
      platformSupported: true,
    );
    final results = <SpeechRecognitionResult>[];
    recognizer.onResult(results.add);

    await recognizer.start(
      options: const SpeechRecognitionOptions(
        locale: 'en-AU',
        interimResults: true,
      ),
    );
    driver.resultListener!(
      const NativeSpeechResult(
        transcript: '  next rep  ',
        confidence: 1.4,
        hasConfidenceRating: true,
        isFinal: true,
      ),
    );

    expect(results, hasLength(1));
    expect(results.single.transcript, 'next rep');
    expect(results.single.confidence, 1);
    expect(results.single.isFinal, isTrue);
    expect(DateTime.tryParse(results.single.receivedAt), isNotNull);
    expect(driver.partialResults, isTrue);
  });

  test('missing native confidence becomes null instead of fake certainty', () async {
    final driver = _FakeDriver();
    final recognizer = FlutterTrainingSpeechRecognizer(
      driver: driver,
      platformSupported: true,
    );
    final results = <SpeechRecognitionResult>[];
    recognizer.onResult(results.add);

    await recognizer.start();
    driver.resultListener!(
      const NativeSpeechResult(
        transcript: 'stop',
        confidence: 0,
        hasConfidenceRating: false,
        isFinal: true,
      ),
    );

    expect(results.single.confidence, isNull);
  });

  test('permission error is remembered as unavailable without throwing', () async {
    final driver = _FakeDriver()
      ..initializeResult = false
      ..initializeError = 'error_permission';
    final recognizer = FlutterTrainingSpeechRecognizer(
      driver: driver,
      platformSupported: true,
    );
    final errors = <String>[];
    recognizer.onError(errors.add);

    expect(await recognizer.requestPermission(), isFalse);

    final availability = await recognizer.getAvailability();
    expect(availability.available, isFalse);
    expect(
      availability.reason,
      SpeechRecognitionUnavailableReason.permissionDenied,
    );
    expect(errors, contains('error_permission'));
  });

  test('stop and abort map to native stop and cancel', () async {
    final driver = _FakeDriver();
    final recognizer = FlutterTrainingSpeechRecognizer(
      driver: driver,
      platformSupported: true,
    );

    await recognizer.stop();
    await recognizer.abort();

    expect(driver.stopCalls, 1);
    expect(driver.cancelCalls, 1);
  });

  test('blank native transcripts are discarded', () async {
    final driver = _FakeDriver();
    final recognizer = FlutterTrainingSpeechRecognizer(
      driver: driver,
      platformSupported: true,
    );
    final results = <SpeechRecognitionResult>[];
    recognizer.onResult(results.add);

    await recognizer.start();
    driver.resultListener!(
      const NativeSpeechResult(
        transcript: '   ',
        confidence: 0.9,
        hasConfidenceRating: true,
        isFinal: true,
      ),
    );

    expect(results, isEmpty);
  });
}
