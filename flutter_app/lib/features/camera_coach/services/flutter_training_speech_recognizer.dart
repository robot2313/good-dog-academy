import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

import 'training_speech_recognizer.dart';

class NativeSpeechResult {
  const NativeSpeechResult({
    required this.transcript,
    required this.confidence,
    required this.hasConfidenceRating,
    required this.isFinal,
  });

  final String transcript;
  final double confidence;
  final bool hasConfidenceRating;
  final bool isFinal;
}

abstract interface class NativeTrainingSpeechDriver {
  Future<bool> initialize({
    required void Function(String message) onError,
  });

  Future<void> listen({
    required void Function(NativeSpeechResult result) onResult,
    required String locale,
    required bool partialResults,
  });

  Future<void> stop();
  Future<void> cancel();
}

class SpeechToTextDriver implements NativeTrainingSpeechDriver {
  SpeechToTextDriver([stt.SpeechToText? speech])
    : _speech = speech ?? stt.SpeechToText();

  final stt.SpeechToText _speech;

  @override
  Future<bool> initialize({
    required void Function(String message) onError,
  }) {
    return _speech.initialize(
      onError: (error) => onError(error.errorMsg),
      debugLogging: false,
      options: <stt.SpeechConfigOption>[
        stt.SpeechToText.androidNoBluetooth,
      ],
    );
  }

  @override
  Future<void> listen({
    required void Function(NativeSpeechResult result) onResult,
    required String locale,
    required bool partialResults,
  }) async {
    await _speech.listen(
      onResult: (result) {
        onResult(
          NativeSpeechResult(
            transcript: result.recognizedWords,
            confidence: result.confidence,
            hasConfidenceRating: result.hasConfidenceRating,
            isFinal: result.finalResult,
          ),
        );
      },
      listenOptions: stt.SpeechListenOptions(
        localeId: locale,
        partialResults: partialResults,
        cancelOnError: true,
        listenMode: stt.ListenMode.confirmation,
        pauseFor: const Duration(seconds: 3),
        listenFor: const Duration(seconds: 12),
        contextualPhrases: const <String>[
          'success',
          'partial success',
          'unsuccessful',
          'next rep',
          'pause',
          'resume',
          'repeat',
          'stop session',
        ],
      ),
    );
  }

  @override
  Future<void> stop() => _speech.stop();

  @override
  Future<void> cancel() => _speech.cancel();
}

/// speech_to_text adapter for Camera Coach owner commands.
///
/// Recognition is deliberately command-oriented and fail-closed. Failure to
/// initialize speech recognition leaves all visual/button controls available.
class FlutterTrainingSpeechRecognizer implements TrainingSpeechRecognizer {
  FlutterTrainingSpeechRecognizer({
    NativeTrainingSpeechDriver? driver,
    bool? platformSupported,
  }) : _driver = driver ?? SpeechToTextDriver(),
       _platformSupported =
           platformSupported ?? _defaultSpeechRecognitionPlatformSupported();

  final NativeTrainingSpeechDriver _driver;
  final bool _platformSupported;

  final Set<SpeechResultListener> _resultListeners =
      <SpeechResultListener>{};
  final Set<SpeechErrorListener> _errorListeners = <SpeechErrorListener>{};

  bool _initializeAttempted = false;
  bool _initialized = false;
  SpeechRecognitionUnavailableReason? _unavailableReason;

  @override
  Future<SpeechRecognitionAvailability> getAvailability() async {
    if (!_platformSupported) {
      return const SpeechRecognitionAvailability.unavailable(
        SpeechRecognitionUnavailableReason.unsupported,
      );
    }
    if (_initializeAttempted && !_initialized) {
      return SpeechRecognitionAvailability.unavailable(
        _unavailableReason ?? SpeechRecognitionUnavailableReason.unavailable,
      );
    }
    return const SpeechRecognitionAvailability.available();
  }

  @override
  Future<bool> requestPermission() => _ensureInitialized();

  @override
  Future<void> start({
    SpeechRecognitionOptions options = const SpeechRecognitionOptions(),
  }) async {
    if (!await _ensureInitialized()) {
      throw StateError('Speech recognition is unavailable.');
    }

    await _driver.listen(
      locale: options.locale,
      partialResults: options.interimResults,
      onResult: _handleNativeResult,
    );
  }

  @override
  Future<void> stop() async {
    try {
      await _driver.stop();
    } catch (cause) {
      _emitError('Speech recognition could not stop: $cause');
    }
  }

  @override
  Future<void> abort() async {
    try {
      await _driver.cancel();
    } catch (cause) {
      _emitError('Speech recognition could not cancel: $cause');
    }
  }

  @override
  SpeechListenerDisposer onResult(SpeechResultListener listener) {
    _resultListeners.add(listener);
    return () => _resultListeners.remove(listener);
  }

  @override
  SpeechListenerDisposer onError(SpeechErrorListener listener) {
    _errorListeners.add(listener);
    return () => _errorListeners.remove(listener);
  }

  void dispose() {
    _resultListeners.clear();
    _errorListeners.clear();
  }

  Future<bool> _ensureInitialized() async {
    if (!_platformSupported) return false;
    if (_initializeAttempted) return _initialized;

    _initializeAttempted = true;
    try {
      _initialized = await _driver.initialize(
        onError: (message) {
          _unavailableReason = _reasonForError(message);
          _emitError(message);
        },
      );
      if (!_initialized && _unavailableReason == null) {
        _unavailableReason = SpeechRecognitionUnavailableReason.unavailable;
      }
    } catch (cause) {
      _initialized = false;
      _unavailableReason = SpeechRecognitionUnavailableReason.unavailable;
      _emitError('Speech recognition initialization failed: $cause');
    }

    return _initialized;
  }

  void _handleNativeResult(NativeSpeechResult result) {
    final transcript = result.transcript.trim();
    if (transcript.isEmpty) return;

    final confidence = result.hasConfidenceRating
        ? result.confidence.clamp(0.0, 1.0).toDouble()
        : null;
    final mapped = SpeechRecognitionResult(
      transcript: transcript,
      confidence: confidence,
      isFinal: result.isFinal,
      receivedAt: DateTime.now().toUtc().toIso8601String(),
    );

    for (final listener in List<SpeechResultListener>.of(_resultListeners)) {
      listener(mapped);
    }
  }

  void _emitError(String message) {
    final safeMessage = message.trim().isEmpty
        ? 'Speech recognition failed.'
        : message.trim();
    for (final listener in List<SpeechErrorListener>.of(_errorListeners)) {
      listener(safeMessage);
    }
  }

  SpeechRecognitionUnavailableReason _reasonForError(String message) {
    final lower = message.toLowerCase();
    if (lower.contains('permission') ||
        lower.contains('not authorized') ||
        lower.contains('not_authorized')) {
      return SpeechRecognitionUnavailableReason.permissionDenied;
    }
    return SpeechRecognitionUnavailableReason.unavailable;
  }
}

bool _defaultSpeechRecognitionPlatformSupported() {
  if (kIsWeb) return true;
  return switch (defaultTargetPlatform) {
    TargetPlatform.android ||
    TargetPlatform.iOS ||
    TargetPlatform.macOS ||
    TargetPlatform.windows => true,
    TargetPlatform.linux || TargetPlatform.fuchsia => false,
  };
}
