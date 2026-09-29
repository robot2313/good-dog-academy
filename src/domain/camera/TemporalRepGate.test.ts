import { TemporalRepGate } from './TemporalRepGate';

describe('TemporalRepGate', () => {
  it('allows one clean entry into the expected posture', () => {
    const gate = new TemporalRepGate();
    gate.beginCue('cue-1', 'sit_like');

    expect(gate.observe('sit_like', 'sit_like').readyToScore).toBe(true);
    expect(gate.observe('sit_like', 'sit_like').readyToScore).toBe(false);
  });

  it('requires the dog to leave the posture before another cue can score it', () => {
    const gate = new TemporalRepGate();
    gate.beginCue('cue-1', 'sit_like');
    expect(gate.observe('sit_like', 'sit_like').readyToScore).toBe(true);

    gate.beginCue('cue-2', 'sit_like');
    expect(gate.observe('sit_like', 'sit_like').waitingForTransition).toBe(true);
    expect(gate.observe('stand_like', 'sit_like').readyToScore).toBe(false);
    expect(gate.observe('sit_like', 'sit_like').readyToScore).toBe(true);
  });

  it('does not score the wrong posture', () => {
    const gate = new TemporalRepGate();
    gate.beginCue('cue-1', 'down_like');

    expect(gate.observe('sit_like', 'down_like').readyToScore).toBe(false);
    expect(gate.observe('down_like', 'down_like').readyToScore).toBe(true);
  });
});
