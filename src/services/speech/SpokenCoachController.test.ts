import type { CoachSpeech, CoachSpeechOptions } from './CoachSpeech';
import { SpokenCoachController } from './SpokenCoachController';

class FakeCoachSpeech implements CoachSpeech {
  readonly calls: Array<{ text: string; options?: CoachSpeechOptions }> = [];
  stops = 0;

  async speak(text: string, options?: CoachSpeechOptions): Promise<void> {
    this.calls.push({ text, options });
  }

  async stop(): Promise<void> {
    this.stops += 1;
  }
}

const decision = (action: 'progress' | 'break') => ({
  action,
  headline: action === 'break' ? 'Reduce pressure' : 'Ready to progress',
  reason: 'test',
  instruction: action === 'break' ? 'Give your dog more space.' : 'Increase one variable only.',
  nextDifficulty: { distance: 1, duration: 2, distraction: 1 },
});

describe('SpokenCoachController', () => {
  it('announces normal coaching through the speech adapter', async () => {
    const speech = new FakeCoachSpeech();
    const controller = new SpokenCoachController(speech);

    await controller.announce({ type: 'rep_started', repNumber: 2 });

    expect(speech.calls).toEqual([{
      text: 'Rep 2. Give the cue once, then wait.',
      options: { interrupt: false, rate: 0.92 },
    }]);
  });

  it('does not repeat identical non-interrupting guidance', async () => {
    const speech = new FakeCoachSpeech();
    const controller = new SpokenCoachController(speech);

    await controller.announce({ type: 'rep_started', repNumber: 2 });
    await controller.announce({ type: 'rep_started', repNumber: 2 });

    expect(speech.calls).toHaveLength(1);
  });

  it('repeats the last instruction only when explicitly requested', async () => {
    const speech = new FakeCoachSpeech();
    const controller = new SpokenCoachController(speech);

    await expect(controller.repeatLast()).resolves.toBe(false);
    await controller.announce({ type: 'rep_started', repNumber: 2 });
    await expect(controller.repeatLast()).resolves.toBe(true);

    expect(speech.calls).toEqual([
      { text: 'Rep 2. Give the cue once, then wait.', options: { interrupt: false, rate: 0.92 } },
      { text: 'Rep 2. Give the cue once, then wait.', options: { interrupt: true, rate: 0.92 } },
    ]);
  });

  it('marks safety coaching for interruption and a calmer rate', async () => {
    const speech = new FakeCoachSpeech();
    const controller = new SpokenCoachController(speech);

    await controller.announce({ type: 'director_decision', decision: decision('break') });

    expect(speech.calls[0]).toEqual({
      text: 'Pause here. Give your dog more space.',
      options: { interrupt: true, rate: 0.88 },
    });
  });

  it('stops speech immediately when voice coaching is disabled', async () => {
    const speech = new FakeCoachSpeech();
    const controller = new SpokenCoachController(speech);

    await controller.setEnabled(false);
    await controller.announce({ type: 'director_decision', decision: decision('progress') });

    expect(speech.stops).toBe(1);
    expect(speech.calls).toEqual([]);
  });
});
