import type { AdaptiveTrainingMemory, SessionHistoryRecord } from '../models/AdaptiveTrainingMemory';
import { buildAdaptiveTrainingProgram, deriveDogTwinState } from './AdaptiveTrainingProgram';

function memory(overrides: Partial<AdaptiveTrainingMemory> = {}): AdaptiveTrainingMemory {
  return {
    schemaVersion: 1,
    dogId: 'dog-1',
    totalSessions: 4,
    updatedAt: '2026-09-12T10:00:00.000Z',
    skills: {
      focus: {
        skillId: 'focus',
        sessionsCompleted: 4,
        totalReps: 20,
        cleanRepRate: 0.8,
        repeatedCueRate: 0.1,
        slowResponseRate: 0.1,
        stressSignalRate: 0,
        correctedRepRate: 0.05,
        lastTrainedAt: '2026-09-12T10:00:00.000Z',
        lastEndedEarly: false,
        lastEndReason: 'target_reached',
        recommendedDifficulty: { distance: 2, duration: 2, distraction: 2 },
      },
    },
    ...overrides,
  };
}

function history(overrides: Partial<SessionHistoryRecord> = {}): SessionHistoryRecord {
  return {
    id: 'session-1',
    dogId: 'dog-1',
    lessonId: 'focus',
    skillId: 'focus',
    completedAt: '2026-09-12T10:00:00.000Z',
    totalReps: 5,
    cleanRepRate: 0.8,
    repeatedCueRate: 0.1,
    slowResponseRate: 0.1,
    stressSignalRate: 0,
    correctedRepRate: 0,
    endedEarly: false,
    endReason: 'target_reached',
    startingDifficulty: { distance: 2, duration: 2, distraction: 2 },
    endingDifficulty: { distance: 2, duration: 2, distraction: 2 },
    ...overrides,
  };
}

describe('AdaptiveTrainingProgram', () => {
  it('puts safety recovery above progression when recent stress evidence exists', () => {
    const records = [history({ stressSignalRate: 0.4, endReason: 'stress', endedEarly: true })];

    expect(deriveDogTwinState(memory(), records)).toBe('recover');

    const program = buildAdaptiveTrainingProgram(memory(), records, '2026-09-12T12:00:00.000Z');
    expect(program.state).toBe('recover');
    expect(program.days[0]).toMatchObject({
      mode: 'recovery',
      skillId: 'focus',
      difficulty: { distance: 2, duration: 2, distraction: 1 },
    });
    expect(program.days.some((item) => item.mode === 'rest')).toBe(true);
  });

  it('builds baseline evidence before aggressive adaptation', () => {
    const starting = memory({ totalSessions: 2 });
    expect(deriveDogTwinState(starting, [history()])).toBe('build');

    const program = buildAdaptiveTrainingProgram(starting, [history()], '2026-09-12T12:00:00.000Z');
    expect(program.days).toHaveLength(7);
    expect(program.days.filter((item) => item.mode === 'train')).toHaveLength(3);
    expect(program.days.find((item) => item.mode === 'train')?.difficulty).toEqual({ distance: 2, duration: 2, distraction: 2 });
  });

  it('consolidates when reliability evidence is weak', () => {
    const weak = memory({
      skills: {
        focus: {
          ...memory().skills.focus,
          cleanRepRate: 0.55,
          repeatedCueRate: 0.4,
        },
      },
    });

    expect(deriveDogTwinState(weak, [history()])).toBe('consolidate');
    const program = buildAdaptiveTrainingProgram(weak, [history()], '2026-09-12T12:00:00.000Z');
    expect(program.state).toBe('consolidate');
    expect(program.days.find((item) => item.mode === 'train')?.difficulty).toEqual({ distance: 2, duration: 2, distraction: 2 });
  });

  it('progresses exactly one difficulty variable when evidence is stable', () => {
    const program = buildAdaptiveTrainingProgram(memory(), [history()], '2026-09-12T12:00:00.000Z');

    expect(program.state).toBe('progress');
    const trainingDay = program.days.find((item) => item.mode === 'train');
    expect(trainingDay?.difficulty).toEqual({ distance: 2, duration: 3, distraction: 2 });
  });

  it('selects the highest-risk skill as the weekly focus', () => {
    const mixed = memory({
      skills: {
        focus: memory().skills.focus,
        recall: {
          ...memory().skills.focus,
          skillId: 'recall',
          cleanRepRate: 0.5,
          repeatedCueRate: 0.4,
          recommendedDifficulty: { distance: 3, duration: 2, distraction: 2 },
        },
      },
    });

    const program = buildAdaptiveTrainingProgram(mixed, [history()], '2026-09-12T12:00:00.000Z');
    expect(program.focusSkillId).toBe('recall');
  });
});
