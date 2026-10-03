enum SpeechRecognitionUnavailableReason {
  unsupported,
  permissionDenied,
  unavailable,
  nativeModuleMissing,
}

class SpeechRecognitionAvailability {
  const SpeechRecognitionAvailability.available()
      : available = true,
        reason = null;

  const SpeechRecognitionAvailability.unavailable(this.reason)
      : available = false;

  final bool available;
  final SpeechRecognitionUnavailableReason? reason;
}

class SpeechRecognitionResult {
  const SpeechRecognitionResult({
    required this.transcript,
    required this.confidence,
    required this.isFinal,
    required this.receivedAt,
  });

  final String transcript;
  final double? confidence;
  final bool isFinal;
  final String receivedAt;
}

class SpeechRecognitionOptions {
  const SpeechRecognitionOptions({
    this.locale = 'en-AU',
    this.interimResults = false,
  });

  final String locale;
  final bool interimResults;
}

typedef SpeechResultListener = void Function(SpeechRecognitionResult result);
typedef SpeechErrorListener = void Function(String message);
typedef SpeechListenerDisposer = void Function();

abstract interface class TrainingSpeechRecognizer {
  Future<SpeechRecognitionAvailability> getAvailability();
  Future<bool> requestPermission();
  Future<void> start({
    SpeechRecognitionOptions options = const SpeechRecognitionOptions(),
  });
  Future<void> stop();
  Future<void> abort();
  SpeechListenerDisposer onResult(SpeechResultListener listener);
  SpeechListenerDisposer onError(SpeechErrorListener listener);
}
