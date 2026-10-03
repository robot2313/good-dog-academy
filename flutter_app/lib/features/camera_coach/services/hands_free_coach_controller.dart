import '../domain/owner_voice_intent.dart';
import 'training_speech_recognizer.dart';

sealed class HandsFreeCoachEvent {
  const HandsFreeCoachEvent();
}

class HandsFreeIntentEvent extends HandsFreeCoachEvent {
  const HandsFreeIntentEvent({
    required this.intent,
    required this.transcript,
  });

  final OwnerVoiceIntent intent;
  final String transcript;
}

class HandsFreeUnclearEvent extends HandsFreeCoachEvent {
  const HandsFreeUnclearEvent(this.transcript);
  final String transcript;
}

class HandsFreeErrorEvent extends HandsFreeCoachEvent {
  const HandsFreeErrorEvent(this.message);
  final String message;
}

typedef HandsFreeCoachListener = void Function(HandsFreeCoachEvent event);

class HandsFreeCoachController {
  HandsFreeCoachController(this.recognizer) {
    _disposeResult = recognizer.onResult(_handleResult);
    _disposeError = recognizer.onError(
      (message) => _listener?.call(HandsFreeErrorEvent(message)),
    );
  }

  final TrainingSpeechRecognizer recognizer;

  SpeechListenerDisposer? _disposeResult;
  SpeechListenerDisposer? _disposeError;
  HandsFreeCoachListener? _listener;
  bool _listening = false;

  bool get isListening => _listening;

  SpeechListenerDisposer onEvent(HandsFreeCoachListener listener) {
    _listener = listener;
    return () {
      if (identical(_listener, listener)) _listener = null;
    };
  }

  Future<SpeechRecognitionAvailability> getAvailability() =>
      recognizer.getAvailability();

  Future<bool> start() async {
    final availability = await recognizer.getAvailability();
    if (!availability.available) return false;

    final granted = await recognizer.requestPermission();
    if (!granted) return false;

    _listening = true;
    try {
      await recognizer.start(
        options: const SpeechRecognitionOptions(
          locale: 'en-AU',
          interimResults: false,
        ),
      );
      return true;
    } catch (_) {
      _listening = false;
      rethrow;
    }
  }

  Future<void> stop() async {
    _listening = false;
    await recognizer.stop();
  }

  Future<void> abort() async {
    _listening = false;
    await recognizer.abort();
  }

  void dispose() {
    _listening = false;
    _disposeResult?.call();
    _disposeError?.call();
    _disposeResult = null;
    _disposeError = null;
    _listener = null;
  }

  void _handleResult(SpeechRecognitionResult result) {
    if (!_listening || !result.isFinal) return;

    final intent = parseOwnerVoiceIntent(result.transcript);
    if (intent == OwnerVoiceIntent.unknown) {
      _listener?.call(HandsFreeUnclearEvent(result.transcript));
      return;
    }

    // Never suppress an explicit stop command because of recognizer
    // confidence. Other state-changing commands fail closed at low confidence.
    final confidence = result.confidence;
    if (intent != OwnerVoiceIntent.stop &&
        confidence != null &&
        confidence < 0.45) {
      _listener?.call(HandsFreeUnclearEvent(result.transcript));
      return;
    }

    _listener?.call(
      HandsFreeIntentEvent(
        intent: intent,
        transcript: result.transcript,
      ),
    );
  }
}
