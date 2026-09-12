import { buildTrainingIntelligence } from './TrainingIntelligence';
import type { AdaptiveTrainingMemory, SessionHistoryRecord } from '../models/AdaptiveTrainingMemory';

const memory: AdaptiveTrainingMemory = {
  schemaVersion: 1,
  dogId: 'dog-1',
  totalSessions: 4,
  updatedAt: '2026-09-12T10:00:00.000Z',
  skills: {
    recall: {
      skillId: 'recall',
      sessionsCompleted: 4,
      totalReps: 16,
      cleanRepRate: 0.7,
      repeatedCueRate: 0.4,
      slowResponseRate: 0.1,
      stressSignalRate: 0,
      correctedRepRate: 0.3,
      lastTrainedAt: '2026-09-12T10:00:00.000Z',
      lastEndedEarly: false,
      lastEndReason: 'target_reached',
      recommendedDifficulty: { distance: 2, duration: 1, distraction: 1 },
    },
  },
};

const history: SessionHistoryRecord[] = [
  { id: '4', dogId: 'dog-1', lessonId: 'l', skillId: 'recall', completedAt: '2026-09-12T10:00:00.000Z', totalReps: 4, cleanRepRate: 0.9, repeatedCueRate: 0.25, slowResponseRate: 0, stressSignalRate: 0, correctedRepRate: 0.25, endedEarly: false, endReason: 'target_reached', startingDifficulty: { distance: 1, duration: 1, distraction: 1 }, endingDifficulty: { distance: 2, duration: 1, distraction: 1 } },
  { id: '3', dogId: 'dog-1', lessonId: 'l', skillId: 'recall', completedAt: '2026-09-11T10:00:00.000Z', totalReps: 4, cleanRepRate: 0.8, repeatedCueRate: 0.25, slowResponseRate: 0, stressSignalRate: 0, correctedRepRate: 0.25, endedEarly: false, endReason: 'target_reached', startingDifficulty: { distance: 1, duration: 1, distraction: 1 }, endingDifficulty: { distance: 2, duration: 1, distraction: 1 } },
  { id: '2', dogId: 'dog-1', lessonId: 'l', skillId: 'recall', completedAt: '2026-09-10T10:00:00.000Z', totalReps: 4, cleanRepRate: 0.5, repeatedCueRate: 0.5, slowResponseRate: 0.25, stressSignalRate: 0, correctedRepRate: 0.25, endedEarly: false, endReason: 'target_reached', startingDifficulty: { distance: 1, duration: 1, distraction: 1 }, endingDifficulty: { distance: 1, duration: 1, distraction: 1 } },
  { id: '1', dogId: 'dog-1', lessonId: 'l', skillId: 'recall', completedAt: '2026-09-09T10:00:00.000Z', totalReps: 4, cleanRepRate: 0.4, repeatedCueRate: 0.5, slowResponseRate: 0.25, stressSignalRate: 0, correctedRepRate: 0.25, endedEarly: false, endReason: 'target_reached', startingDifficulty: { distance: 1, duration: 1, distraction: 1 }, endingDifficulty: { distance: 1, duration: 1, distraction: 1 } },
];

describe('buildTrainingIntelligence', () => {
  it('detects a meaningful improvement from recent versus earlier sessions', () => {
    const result = buildTrainingIntelligence(memory, history);
    expect(result.skills[0].direction).toBe('improving');
    expect(result.skills[0].delta).toBeCloseTo(0.4, 5);
  });

  it('warns when owner corrections are common', () => {
    const result = buildTrainingIntelligence(memory, history);
    expect(result.warnings.some((warning) => warning.includes('owner correction'))).toBe(true);
  });
});
