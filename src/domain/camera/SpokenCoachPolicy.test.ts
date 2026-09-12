import { spokenCoachMessage } from './SpokenCoachPolicy';

const decision = (action: 'repeat' | 'hold' | 'ease' | 'progress' | 'break' | 'finish') => ({
  action,
  headline: action === 'break' ? 'Reduce pressure' : 'Keep going',
  reason: 'test',
  instruction: action === 'break' ? 'Give your dog more space and only continue after they settle.' : 'Repeat the setup once.',
  nextDifficulty: { distance: 1, duration: 1, distraction: 1 },
});

describe('SpokenCoachPolicy', () => {
  it('speaks one-cue guidance at the start of each rep', () => {
    expect(spokenCoachMessage({ type: 'rep_started', repNumber: 3 })).toEqual({
      text: 'Rep 3. Give the cue once, then wait.',
      priority: 'normal',
      interrupt: false,
    });
  });

  it('never pretends uncertain camera evidence is authoritative', () => {
    const message = spokenCoachMessage({
      type: 'owner_confirmation',
      pending: {
        reason: 'low_confidence',
        evidence: {
          source: 'camera_auto',
          observedAt: '2026-09-12T10:00:00.000Z',
          confidence: 0.4,
          cueAt: null,
          responseAt: null,
          markerAt: null,
          rewardAt: null,
          cueCount: 1,
          signal: null,
          notes: null,
          posture: null,
        },
        proposedOutcome: 'partial-success',
      },
    });

    expect(message.text).toContain('not confident enough');
    expect(message.interrupt).toBe(true);
  });

  it('interrupts ordinary speech for safety breaks', () => {
    expect(spokenCoachMessage({ type: 'director_decision', decision: decision('break') })).toEqual({
      text: 'Pause here. Give your dog more space and only continue after they settle.',
      priority: 'safety',
      interrupt: true,
    });
  });

  it('keeps ordinary progression coaching non-safety priority', () => {
    const message = spokenCoachMessage({ type: 'director_decision', decision: decision('progress') });
    expect(message.priority).toBe('normal');
    expect(message.interrupt).toBe(false);
    expect(message.text).toContain('Keep going');
  });
});
