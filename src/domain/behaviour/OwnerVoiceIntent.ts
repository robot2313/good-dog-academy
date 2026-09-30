export type OwnerVoiceIntent =
  | 'success'
  | 'partial-success'
  | 'unsuccessful'
  | 'next-rep'
  | 'pause'
  | 'resume'
  | 'repeat'
  | 'stop'
  | 'unknown';

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ').trim();

const containsAny = (text: string, phrases: string[]) => phrases.some((phrase) => text === phrase || text.includes(` ${phrase} `) || text.startsWith(`${phrase} `) || text.endsWith(` ${phrase}`));

export function parseOwnerVoiceIntent(transcript: string): OwnerVoiceIntent {
  const text = normalise(transcript);
  if (!text) return 'unknown';

  // Ending the session outranks every other command.
  if (containsAny(` ${text} `, ['stop', 'stop session', 'finish', 'end session'])) return 'stop';
  // A temporary pause is deliberately distinct from ending/stopping the session.
  if (containsAny(` ${text} `, ['pause', 'pause session', 'take a break', 'break for a moment', 'hold on'])) return 'pause';
  if (containsAny(` ${text} `, ['resume', 'resume session', 'continue', 'continue session', 'carry on'])) return 'resume';
  if (containsAny(` ${text} `, ['repeat', 'again', 'say that again', 'repeat that'])) return 'repeat';
  if (containsAny(` ${text} `, ['next', 'next rep', 'ready', 'ready for next', 'ready for the next rep'])) return 'next-rep';

  if (containsAny(` ${text} `, ['partial', 'partly', 'almost', 'sort of', 'kind of'])) return 'partial-success';
  if (containsAny(` ${text} `, ['not successful', 'failed', 'fail', 'no', 'nope', "didn't do it", 'did not do it', 'missed it'])) return 'unsuccessful';
  if (containsAny(` ${text} `, ['success', 'successful', 'yes', 'yep', 'good', 'got it', 'did it'])) return 'success';

  return 'unknown';
}
