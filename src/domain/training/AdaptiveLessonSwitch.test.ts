import { decideAdaptiveLessonSwitch, type LessonCandidate } from './AdaptiveLessonSwitch';
import type { AdaptiveTrainingMemory, SessionHistoryRecord } from '../models/AdaptiveTrainingMemory';

const current: LessonCandidate = { lessonId: 'recall-advanced', skillId: 'recall', difficultyLevel: 4 };
const easier: LessonCandidate = { lessonId: 'recall-foundation', skillId: 'recall', difficultyLevel: 2 };

function memory(overrides: Partial<AdaptiveTrainingMemory['skills'][string]> = {}): AdaptiveTrainingMemory {
  return {
    schemaVersion: 1,
    dogId: 'dog-1',
    totalSessions: 4,
    updatedAt: '2026-09-12T12:00:00.000Z',
    skills: {
      recall: {
        skillId: 'recall',
        sessionsCompleted: 4,
        totalReps: 20,
        cleanRepRate: 0.75,
        repeatedCueRate: 0.1,
        slowResponseRate: 0.1,
        stressSignalRate: 0,
        correctedRepRate: 0,
        lastTrainedAt: '2026-09-12T12:00:00.000Z',
        lastEndedEarly: false,
        lastEndReason: 'target_reached',
        recommendedDifficulty: { distance: 3, duration: 2, distraction: 2 },
        ...overrides,
      },
    },
  };
}

function history(overrides: Partial<SessionHistoryRecord> = {}): SessionHistoryRecord[] {
  const base: SessionHistoryRecord = {
    id: 's1', dogId: 'dog-1', lessonId: current.lessonId, skillId: 'recall', completedAt: '2026-09-12T12:00:00.000Z',
    totalReps: 5, cleanRepRate: 0.8, repeatedCueRate: 0.1, slowResponseRate: 0.1, stressSignalRate: 0,
    correctedRepRate: 0, endedEarly: false, endReason: 'target_reached',
    startingDifficulty: { distance: 3, duration: 2, distraction: 2 }, endingDifficulty: { distance: 3, duration: 2, distraction: 2 },
    ...overrides,
  };
  return [base, { ...base, id: 's2', completedAt: '2026-09-11T12:00:00.000Z' }];
}

describe('decideAdaptiveLessonSwitch', () => {
  it('switches to an easier same-skill lesson when stress evidence appears', () => {
    const result = decideAdaptiveLessonSwitch({
      current,
      candidates: [current, easier],
      memory: memory(),
      history: history({ stressSignalRate: 0.4, endReason: 'stress' }),
    });
    expect(result).toMatchObject({ action: 'switch', lessonId: easier.lessonId, reason: 'safety_override' });
  });

  it('switches when recent clean performance is persistently low', () => {
    const result = decideAdaptiveLessonSwitch({
      current,
      candidates: [current, easier],
      memory: memory({ cleanRepRate: 0.5 }),
      history: history({ cleanRepRate: 0.45 }),
    });
    expect(result.reason).toBe('declining_performance');
    expect(result.lessonId).toBe(easier.lessonId);
  });

  it('stays on the current lesson when evidence is healthy', () => {
    const result = decideAdaptiveLessonSwitch({ current, candidates: [current, easier], memory: memory(), history: history() });
    expect(result).toMatchObject({ action: 'stay', lessonId: current.lessonId, reason: 'stay_current' });
  });

  it('does not switch without enough evidence', () => {
    const result = decideAdaptiveLessonSwitch({ current, candidates: [current, easier], memory: memory(), history: history().slice(0, 1) });
    expect(result.reason).toBe('insufficient_evidence');
  });
});
