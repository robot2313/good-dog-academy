import 'package:flutter_tts/flutter_tts.dart';

import 'coach_speech.dart';

abstract interface class FlutterTtsDriver {
  Future<void> setLanguage(String language);
  Future<void> setSpeechRate(double rate);
  Future<void> setVolume(double volume);
  Future<void> setPitch(double pitch);
  Future<void> speak(String text);
  Future<void> stop();
}

class PluginFlutterTtsDriver implements FlutterTtsDriver {
  PluginFlutterTtsDriver([FlutterTts? tts]) : _tts = tts ?? FlutterTts();

  final FlutterTts _tts;

  @override
  Future<void> setLanguage(String language) async {
    await _tts.setLanguage(language);
  }

  @override
  Future<void> setSpeechRate(double rate) async {
    await _tts.setSpeechRate(rate);
  }

  @override
  Future<void> setVolume(double volume) async {
    await _tts.setVolume(volume);
  }

  @override
  Future<void> setPitch(double pitch) async {
    await _tts.setPitch(pitch);
  }

  @override
  Future<void> speak(String text) async {
    await _tts.speak(text);
  }

  @override
  Future<void> stop() async {
    await _tts.stop();
  }
}

/// Native trainer speech backed by flutter_tts.
///
/// Voice is optional Camera Coach infrastructure. Native TTS failures are
/// intentionally fail-open: training remains usable through the visual and
/// button controls even when the platform speech engine is unavailable.
class FlutterCoachSpeech implements CoachSpeech {
  FlutterCoachSpeech({
    FlutterTtsDriver? driver,
    this.locale = 'en-AU',
  }) : _driver = driver ?? PluginFlutterTtsDriver();

  final FlutterTtsDriver _driver;
  final String locale;

  bool _configured = false;
  bool _available = true;
  Object? _lastError;

  bool get available => _available;
  Object? get lastError => _lastError;

  @override
  Future<void> speak(
    String text, {
    CoachSpeechOptions options = const CoachSpeechOptions(),
  }) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || !_available) return;

    try {
      await _configureOnce();
      if (options.interrupt) {
        await _driver.stop();
      }
      await _driver.setSpeechRate(_normaliseRate(options.rate));
      await _driver.speak(trimmed);
    } catch (cause) {
      _available = false;
      _lastError = cause;
      try {
        await _driver.stop();
      } catch (_) {
        // Voice is optional; cleanup failure must not fail training.
      }
    }
  }

  @override
  Future<void> stop() async {
    try {
      await _driver.stop();
    } catch (cause) {
      _lastError = cause;
    }
  }

  Future<void> _configureOnce() async {
    if (_configured) return;

    await _bestEffort(() => _driver.setLanguage(locale));
    await _bestEffort(() => _driver.setVolume(1));
    await _bestEffort(() => _driver.setPitch(1));
    _configured = true;
  }

  Future<void> _bestEffort(Future<void> Function() action) async {
    try {
      await action();
    } catch (_) {
      // Keep platform defaults. A missing requested locale does not prove that
      // speech itself is unavailable.
    }
  }

  double _normaliseRate(double rate) {
    if (!rate.isFinite) return 0.92;
    if (rate < 0.1) return 0.1;
    if (rate > 1) return 1;
    return rate;
  }
}
