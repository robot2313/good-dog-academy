import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/owner_voice_intent.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera_coach_runtime_controller.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera_coach_voice_command_router.dart';
import 'package:good_dog_academy/features/camera_coach/services/hands_free_coach_controller.dart';
import 'package:good_dog_academy/features/camera_coach/services/training_speech_recognizer.dart';
import 'package:good_dog_academy/features/lessons/session/training_session_record.dart';

class _FakeRecognizer implements TrainingSpeechRecognizer {
  SpeechResultListener? resultListener;
  SpeechErrorListener? errorListener;
  int starts = 0;
  int stops = 0;
  int aborts = 0;

  @override
  Future<SpeechRecognitionAvailability> getAvailability() async =>
      const SpeechRecognitionAvailability.available();

  @override
  Future<bool> requestPermission() async => true;

  @override
  Future<void> start({
    SpeechRecognitionOptions options = const SpeechRecognitionOptions(),
  }) async {
    starts++;
  }

  @override
  Future<void> stop() async {
    stops++;
  }

  @override
  Future<void> abort() async {
    aborts++;
  }

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

  void emit(String transcript, {double confidence = 0.9}) {
    resultListener?.call(
      SpeechRecognitionResult(
        transcript: transcript,
        confidence: confidence,
        isFinal: true,
        receivedAt: '2026-10-04T00:00:00Z',
      ),
    );
  }
}

class _FakeActions implements CameraCoachVoiceActions {
  @override
  CameraCoachRuntimeStatus status = CameraCoachRuntimeStatus.ready;

  @override
  bool framingReady = true;

  int begins = 0;
  int confirms = 0;
  int pauses = 0;
  int resumes = 0;
  int repeats = 0;
  int stops = 0;
  TrainingOutcome? lastOutcome;
  bool repeatResult = true;

  @override
  Future<bool> beginCue() async {
    begins++;
    status = CameraCoachRuntimeStatus.cueActive;
    return true;
  }

  @override
  Future<bool> confirmPending(TrainingOutcome outcome) async {
    confirms++;
    lastOutcome = outcome;
    status = CameraCoachRuntimeStatus.ready;
    return true;
  }

  @override
  Future<void> pause() async {
    pauses++;
    status = CameraCoachRuntimeStatus.paused;
  }

  @override
  Future<void> resume() async {
    resumes++;
    status = CameraCoachRuntimeStatus.ready;
  }

  @override
  Future<bool> repeatLastCoachMessage() async {
    repeats++;
    return repeatResult;
  }

  @override
  Future<void> stop() async {
    stops++;
    status = CameraCoachRuntimeStatus.complete;
  }
}

Future<void> _flush() async {
  await Future<void>.delayed(Duration.zero);
  await Future<void>.delayed(Duration.zero);
}

void main() {
  test('next rep requires ready state and safe framing', () async {
    final recognizer = _FakeRecognizer();
    final actions = _FakeActions()..framingReady = false;
    final router = CameraCoachVoiceCommandRouter(
      handsFree: HandsFreeCoachController(recognizer),
      actions: actions,
    );

    expect(await router.setEnabled(true), isTrue);
    recognizer.emit('next rep');
    await _flush();

    expect(actions.begins, 0);
    expect(router.feedback?.kind, CameraCoachVoiceFeedbackKind.blocked);
    expect(recognizer.starts, 2);

    actions.framingReady = true;
    recognizer.emit('next rep');
    await _flush();

    expect(actions.begins, 1);
    expect(actions.status, CameraCoachRuntimeStatus.cueActive);

    await router.shutdown();
    router.dispose();
  });

  test('scoring commands only confirm a pending owner decision', () async {
    final recognizer = _FakeRecognizer();
    final actions = _FakeActions();
    final router = CameraCoachVoiceCommandRouter(
      handsFree: HandsFreeCoachController(recognizer),
      actions: actions,
    );

    await router.setEnabled(true);
    recognizer.emit('yes');
    await _flush();
    expect(actions.confirms, 0);

    actions.status = CameraCoachRuntimeStatus.awaitingOwnerConfirmation;
    recognizer.emit('partial success');
    await _flush();

    expect(actions.confirms, 1);
    expect(actions.lastOutcome, TrainingOutcome.partialSuccess);

    await router.shutdown();
    router.dispose();
  });

  test('pause and resume obey current session state', () async {
    final recognizer = _FakeRecognizer();
    final actions = _FakeActions();
    final router = CameraCoachVoiceCommandRouter(
      handsFree: HandsFreeCoachController(recognizer),
      actions: actions,
    );

    await router.setEnabled(true);
    recognizer.emit('pause');
    await _flush();

    expect(actions.pauses, 1);
    expect(actions.status, CameraCoachRuntimeStatus.paused);

    recognizer.emit('resume');
    await _flush();

    expect(actions.resumes, 1);
    expect(actions.status, CameraCoachRuntimeStatus.ready);

    await router.shutdown();
    router.dispose();
  });

  test('repeat waits for action and then re-arms recognition', () async {
    final recognizer = _FakeRecognizer();
    final actions = _FakeActions();
    final router = CameraCoachVoiceCommandRouter(
      handsFree: HandsFreeCoachController(recognizer),
      actions: actions,
    );

    await router.setEnabled(true);
    recognizer.emit('repeat');
    await _flush();

    expect(actions.repeats, 1);
    expect(recognizer.stops, 1);
    expect(recognizer.starts, 2);

    await router.shutdown();
    router.dispose();
  });

  test('stop remains accepted at low confidence and never re-arms', () async {
    final recognizer = _FakeRecognizer();
    final actions = _FakeActions();
    final router = CameraCoachVoiceCommandRouter(
      handsFree: HandsFreeCoachController(recognizer),
      actions: actions,
    );

    await router.setEnabled(true);
    recognizer.emit('stop session', confidence: 0.1);
    await _flush();

    expect(actions.stops, 1);
    expect(actions.status, CameraCoachRuntimeStatus.complete);
    expect(router.enabled, isFalse);
    expect(recognizer.starts, 1);

    await router.shutdown();
    router.dispose();
  });

  test('unclear commands fail closed and re-arm listening', () async {
    final recognizer = _FakeRecognizer();
    final actions = _FakeActions();
    final router = CameraCoachVoiceCommandRouter(
      handsFree: HandsFreeCoachController(recognizer),
      actions: actions,
    );

    await router.setEnabled(true);
    recognizer.emit('something unrelated');
    await _flush();

    expect(router.feedback?.kind, CameraCoachVoiceFeedbackKind.unclear);
    expect(actions.begins, 0);
    expect(actions.confirms, 0);
    expect(recognizer.starts, 2);

    await router.shutdown();
    router.dispose();
  });
}
