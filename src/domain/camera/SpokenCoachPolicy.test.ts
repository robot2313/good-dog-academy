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
        reason: 'low_detection_confidence',
        vision: {
          frameId: 'frame-1',
          analysedAt: '2026-09-12T10:00:00.000Z',
          dogDetected: true,
          detectionConfidence: 0.4,
          posture: 'unknown',
          postureConfidence: null,
          stressSignal: 'none',
          stressConfidence: null,
        },
        observation: {
          outcome: 'partial-success',
          observedAt: '2026-09-12T10:00:00.000Z',
          cueAt: null,
          responseAt: null,
          markerAt: null,
          rewardAt: null,
          cueCount: 1,
          signal: null,
          notes: null,
        },
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

  it('explains pause without ending the session', () => {
    expect(spokenCoachMessage({ type: 'session_paused' })).toEqual({
      text: 'Training paused. No rep will be scored while paused. Say resume when you are ready.',
      priority: 'normal',
      interrupt: true,
    });
  });

  it('confirms the existing session resumes', () => {
    expect(spokenCoachMessage({ type: 'session_resumed' }).text).toContain('same session');
  });

  it('keeps ordinary progression coaching non-safety priority', () => {
    const message = spokenCoachMessage({ type: 'director_decision', decision: decision('progress') });
    expect(message.priority).toBe('normal');
    expect(message.interrupt).toBe(false);
    expect(message.text).toContain('Keep going');
  });
});
