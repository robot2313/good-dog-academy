import 'camera_coach_models.dart';

class TemporalRepGateResult {
  const TemporalRepGateResult({
    required this.stablePosture,
    required this.readyToScore,
    required this.waitingForTransition,
  });

  final DogPosture? stablePosture;
  final bool readyToScore;
  final bool waitingForTransition;
}

/// Prevents a held posture from being counted as multiple repetitions.
///
/// A new cue that begins while the dog is already in the expected posture must
/// observe a real departure and re-entry before it can score another rep.
class TemporalRepGate {
  String? _activeCueAt;
  bool _scoredForCue = false;
  DogPosture? _lastStablePosture;
  bool _hasLeftExpectedPosture = true;

  void beginCue(String cueAt, DogPosture expectedPosture) {
    if (_activeCueAt == cueAt) return;

    _activeCueAt = cueAt;
    _scoredForCue = false;
    _hasLeftExpectedPosture = _lastStablePosture != expectedPosture;
  }

  TemporalRepGateResult observe(
    DogPosture? stablePosture,
    DogPosture expectedPosture,
  ) {
    if (stablePosture != null) {
      if (stablePosture != expectedPosture) {
        _hasLeftExpectedPosture = true;
      }
      _lastStablePosture = stablePosture;
    }

    final readyToScore =
        stablePosture == expectedPosture &&
        !_scoredForCue &&
        _hasLeftExpectedPosture;

    if (readyToScore) {
      _scoredForCue = true;
    }

    return TemporalRepGateResult(
      stablePosture: stablePosture,
      readyToScore: readyToScore,
      // Any held expected posture that cannot score yet is waiting for a real
      // departure/re-entry. This also prevents duplicate scoring on the same
      // cue after the first rep has already been accepted.
      waitingForTransition:
          stablePosture == expectedPosture && !readyToScore,
    );
  }

  void reset() {
    _activeCueAt = null;
    _scoredForCue = false;
    _lastStablePosture = null;
    _hasLeftExpectedPosture = true;
  }
}
