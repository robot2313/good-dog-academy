import {
  addRepToLiveSession,
  autonomousSessionDirector,
  createLiveCoachSession,
  diagnoseTrainingRep,
} from './LiveCoachEngine';
import type { TrainingRep } from '../models/TrainingEvidence';

const rep = (partial: Partial<TrainingRep> & { outcome?: 'success' | 'partial-success' | 'unsuccessful' } = {}): TrainingRep => ({
  id: partial.id ?? Math.random().toString(36),
  repNumber: partial.repNumber ?? 1,
  evidence: partial.evidence ?? {
    source: 'owner_confirmed',
    confidence: 1,
    observedOutcome: partial.outcome ?? 'success',
    observedAt: '2026-09-12T10:00:00.000Z',
    cueAt: '2026-09-12T10:00:00.000Z',
    responseAt: '2026-09-12T10:00:01.000Z',
    markerAt: null,
    rewardAt: null,
    cueCount: 1,
    signal: null,
    posture: null,
    poseConfidence: null,
    notes: null,
  },
  correction: partial.correction ?? null,
});

const stressRep = (n: number): TrainingRep => rep({
  repNumber: n,
  evidence: {
    source: 'multimodal_auto',
    confidence: 0.8,
    observedOutcome: 'success',
    observedAt: `2026-09-12T10:00:0${n}.000Z`,
    cueAt: null,
    responseAt: null,
    markerAt: null,
    rewardAt: null,
    cueCount: 1,
    signal: 'stress_signal',
    posture: 'down_like',
    poseConfidence: 0.75,
    notes: null,
  },
});

describe('LiveCoachEngine', () => {
  test('progresses after two clean successes', () => {
    let session = createLiveCoachSession({ id: 's1', dogId: 'd1', lessonId: 'l1', targetReps: 5 });
    session = addRepToLiveSession(session, rep({ repNumber: 1 }));
    session = addRepToLiveSession(session, rep({ repNumber: 2 }));
    const decision = autonomousSessionDirector(session);

    expect(decision.action).toBe('progress');
    expect(decision.nextDifficulty.duration).toBe(2);
  });

  test('eases after repeated unsuccessful reps', () => {
    let session = createLiveCoachSession({
      id: 's2',
      dogId: 'd1',
      lessonId: 'l1',
      targetReps: 5,
      startDifficulty: { distance: 2, duration: 2, distraction: 2 },
    });
    session = addRepToLiveSession(session, rep({ repNumber: 1, outcome: 'unsuccessful' }));
    session = addRepToLiveSession(session, rep({ repNumber: 2, outcome: 'unsuccessful' }));
    const decision = autonomousSessionDirector(session);

    expect(decision.action).toBe('ease');
    expect(decision.nextDifficulty.distraction).toBe(1);
  });

  test('owner correction drives the effective diagnosis', () => {
    const corrected = rep({
      evidence: {
        source: 'camera_auto',
        confidence: 0.9,
        observedOutcome: 'success',
        observedAt: '2026-09-12T10:00:00.000Z',
        cueAt: null,
        responseAt: null,
        markerAt: null,
        rewardAt: null,
        cueCount: 1,
        signal: null,
        posture: null,
        poseConfidence: null,
        notes: null,
      },
      correction: {
        correctedAt: '2026-09-12T10:00:02.000Z',
        correctedOutcome: 'unsuccessful',
        reason: 'Dog did not complete the behaviour',
        source: 'owner',
      },
    });

    expect(diagnoseTrainingRep(corrected).code).toBe('difficulty_too_high');
  });

  test('stress evidence takes priority over success and can end repeated-stress sessions', () => {
    expect(diagnoseTrainingRep(stressRep(1)).code).toBe('stress_or_discomfort');

    let session = createLiveCoachSession({ id: 's3', dogId: 'd1', lessonId: 'l1', targetReps: 5 });
    session = addRepToLiveSession(session, stressRep(1));
    expect(autonomousSessionDirector(session).action).toBe('break');
    session = addRepToLiveSession(session, stressRep(2));
    expect(session.status).toBe('complete');
    expect(session.endedEarly).toBe(true);
    expect(session.endReason).toBe('stress');
  });

  test('a stress signal on the final planned rep pauses instead of falsely completing the target', () => {
    let session = createLiveCoachSession({ id: 's4', dogId: 'd1', lessonId: 'l1', targetReps: 2 });
    session = addRepToLiveSession(session, rep({ repNumber: 1 }));
    session = addRepToLiveSession(session, stressRep(2));

    expect(session.status).toBe('active');
    expect(session.endReason).toBeNull();
    expect(session.endedEarly).toBe(false);
    expect(autonomousSessionDirector(session).action).toBe('break');
  });
});
