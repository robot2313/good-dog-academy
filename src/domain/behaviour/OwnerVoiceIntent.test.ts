import { parseOwnerVoiceIntent } from './OwnerVoiceIntent';

describe('parseOwnerVoiceIntent', () => {
  it.each([
    ['yes', 'success'],
    ['yep, he did it', 'success'],
    ['that was almost right', 'partial-success'],
    ["no, he didn't do it", 'unsuccessful'],
    ['ready for the next rep', 'next-rep'],
    ['next', 'next-rep'],
    ['repeat that please', 'repeat'],
    ['stop the session', 'stop'],
  ])('maps %s to %s', (transcript, expected) => {
    expect(parseOwnerVoiceIntent(transcript)).toBe(expected);
  });

  it('prioritises a stop request over scoring language', () => {
    expect(parseOwnerVoiceIntent('yes good, but stop the session')).toBe('stop');
  });

  it('keeps repeat distinct from moving to the next rep', () => {
    expect(parseOwnerVoiceIntent('say that again')).toBe('repeat');
    expect(parseOwnerVoiceIntent('ready for next')).toBe('next-rep');
  });

  it('fails closed when language is ambiguous', () => {
    expect(parseOwnerVoiceIntent('maybe I am not sure')).toBe('unknown');
  });
});
