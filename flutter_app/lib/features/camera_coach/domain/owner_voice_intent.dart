enum OwnerVoiceIntent {
  success,
  partialSuccess,
  unsuccessful,
  nextRep,
  pause,
  resume,
  repeat,
  stop,
  unknown,
}

OwnerVoiceIntent parseOwnerVoiceIntent(String transcript) {
  final text = _normalise(transcript);
  if (text.isEmpty) return OwnerVoiceIntent.unknown;
  final padded = ' $text ';

  // Ending the session outranks every other command.
  if (_containsAny(
    padded,
    const <String>['stop', 'stop session', 'finish', 'end session'],
  )) {
    return OwnerVoiceIntent.stop;
  }

  // Pausing is deliberately distinct from ending the session.
  if (_containsAny(
    padded,
    const <String>[
      'pause',
      'pause session',
      'take a break',
      'break for a moment',
      'hold on',
    ],
  )) {
    return OwnerVoiceIntent.pause;
  }

  if (_containsAny(
    padded,
    const <String>[
      'resume',
      'resume session',
      'continue',
      'continue session',
      'carry on',
    ],
  )) {
    return OwnerVoiceIntent.resume;
  }

  if (_containsAny(
    padded,
    const <String>['repeat', 'again', 'say that again', 'repeat that'],
  )) {
    return OwnerVoiceIntent.repeat;
  }

  if (_containsAny(
    padded,
    const <String>[
      'next',
      'next rep',
      'ready',
      'ready for next',
      'ready for the next rep',
    ],
  )) {
    return OwnerVoiceIntent.nextRep;
  }

  if (_containsAny(
    padded,
    const <String>['partial', 'partly', 'almost', 'sort of', 'kind of'],
  )) {
    return OwnerVoiceIntent.partialSuccess;
  }

  if (_containsAny(
    padded,
    const <String>[
      'not successful',
      'failed',
      'fail',
      'no',
      'nope',
      "didn't do it",
      'did not do it',
      'missed it',
    ],
  )) {
    return OwnerVoiceIntent.unsuccessful;
  }

  if (_containsAny(
    padded,
    const <String>[
      'success',
      'successful',
      'yes',
      'yep',
      'good',
      'got it',
      'did it',
    ],
  )) {
    return OwnerVoiceIntent.success;
  }

  return OwnerVoiceIntent.unknown;
}

String _normalise(String value) => value
    .toLowerCase()
    .replaceAll(RegExp(r"[^a-z0-9\s'-]"), ' ')
    .replaceAll(RegExp(r'\s+'), ' ')
    .trim();

bool _containsAny(String paddedText, List<String> phrases) {
  final text = paddedText.trim();
  for (final phrase in phrases) {
    if (text == phrase ||
        paddedText.contains(' $phrase ') ||
        text.startsWith('$phrase ') ||
        text.endsWith(' $phrase')) {
      return true;
    }
  }
  return false;
}
