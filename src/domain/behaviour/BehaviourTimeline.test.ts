import type { SessionHistoryRecord } from '../models/AdaptiveTrainingMemory';
import { buildBehaviourTimeline } from './BehaviourTimeline';

function record(id: string, completedAt: string, overrides: Partial<SessionHistoryRecord> = {}): SessionHistoryRecord {
  return {
    id,
    dogId: 'dog-1',
    lessonId: 'focus-check-in',
    skillId: 'focus',
    completedAt,
    totalReps: 5,
    cleanRepRate: 0.8,
    repeatedCueRate: 0.1,
    slowResponseRate: 0.1,
    stressSignalRate: 0,
    correctedRepRate: 0,
    endedEarly: false,
    endReason: 'target_reached',
    startingDifficulty: { distance: 1, duration: 1, distraction: 1 },
    endingDifficulty: { distance: 1, duration: 2, distraction: 1 },
    ...overrides,
  };
}

describe('BehaviourTimeline', () => {
  it('orders timeline events newest first and prioritises safety signals', () => {
    const timeline = buildBehaviourTimeline([
      record('old', '2026-09-10T10:00:00.000Z'),
      record('new', '2026-09-12T10:00:00.000Z', { stressSignalRate: 0.4, endReason: 'stress', endedEarly: true }),
    ]);

    expect(timeline.events.map((item) => item.id)).toEqual(['new', 'old']);
    expect(timeline.events[0]).toMatchObject({ severity: 'safety', title: 'Comfort signal changed the plan' });
  });

  it('detects repeated stress across recent sessions', () => {
    const timeline = buildBehaviourTimeline([
      record('s1', '2026-09-12T10:00:00.000Z', { stressSignalRate: 0.3 }),
      record('s2', '2026-09-11T10:00:00.000Z', { endReason: 'stress', endedEarly: true }),
      record('s3', '2026-09-10T10:00:00.000Z'),
    ]);

    expect(timeline.patterns).toContainEqual(expect.objectContaining({ id: 'stress_repeat', severity: 'safety' }));
  });

  it('detects persistent cue repetition without labelling it as a diagnosis', () => {
    const timeline = buildBehaviourTimeline([
      record('s1', '2026-09-12T10:00:00.000Z', { repeatedCueRate: 0.5 }),
      record('s2', '2026-09-11T10:00:00.000Z', { repeatedCueRate: 0.4 }),
      record('s3', '2026-09-10T10:00:00.000Z'),
    ]);

    expect(timeline.patterns).toContainEqual(expect.objectContaining({ id: 'cue_repeat', severity: 'watch' }));
  });

  it('recognises a three-session clean streak', () => {
    const timeline = buildBehaviourTimeline([
      record('s1', '2026-09-12T10:00:00.000Z', { cleanRepRate: 0.9 }),
      record('s2', '2026-09-11T10:00:00.000Z', { cleanRepRate: 0.85 }),
      record('s3', '2026-09-10T10:00:00.000Z', { cleanRepRate: 0.8 }),
    ]);

    expect(timeline.patterns).toContainEqual(expect.objectContaining({ id: 'clean_streak', severity: 'positive' }));
  });

  it('surfaces owner-correction patterns conservatively', () => {
    const timeline = buildBehaviourTimeline([
      record('s1', '2026-09-12T10:00:00.000Z', { correctedRepRate: 0.4 }),
      record('s2', '2026-09-11T10:00:00.000Z', { correctedRepRate: 0.3 }),
    ]);

    expect(timeline.patterns).toContainEqual(expect.objectContaining({ id: 'owner_correction' }));
    expect(timeline.events[0].title).toBe('Owner corrections protected accuracy');
  });
});
