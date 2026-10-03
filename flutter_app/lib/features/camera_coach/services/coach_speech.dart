class CoachSpeechOptions {
  const CoachSpeechOptions({
    this.interrupt = false,
    this.rate = 0.92,
  });

  final bool interrupt;
  final double rate;
}

abstract interface class CoachSpeech {
  Future<void> speak(
    String text, {
    CoachSpeechOptions options = const CoachSpeechOptions(),
  });

  Future<void> stop();
}
