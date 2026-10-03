import '../domain/spoken_coach_policy.dart';
import 'coach_speech.dart';

class SpokenCoachController {
  SpokenCoachController(this.speech);

  final CoachSpeech speech;
  bool _enabled = true;
  String? _lastText;

  bool get isEnabled => _enabled;

  Future<void> setEnabled(bool enabled) async {
    _enabled = enabled;
    _lastText = null;
    if (!enabled) await speech.stop();
  }

  Future<void> announce(SpokenCoachEvent event) async {
    if (!_enabled) return;

    final message = spokenCoachMessage(event);
    if (!message.interrupt && message.text == _lastText) return;

    _lastText = message.text;
    await speech.speak(
      message.text,
      options: CoachSpeechOptions(
        interrupt: message.interrupt,
        rate: message.priority == SpokenCoachPriority.safety ? 0.88 : 0.92,
      ),
    );
  }

  Future<bool> repeatLast() async {
    final text = _lastText;
    if (!_enabled || text == null) return false;

    await speech.speak(
      text,
      options: const CoachSpeechOptions(interrupt: true, rate: 0.92),
    );
    return true;
  }

  Future<void> stop() async {
    _lastText = null;
    await speech.stop();
  }
}
