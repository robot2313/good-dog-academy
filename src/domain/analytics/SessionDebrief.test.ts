import { createLiveCoachSession, applyRepToLiveSession } from '../behaviour/LiveCoachEngine';
import type { TrainingRep } from '../models/TrainingEvidence';
import { buildSessionDebrief } from './SessionDebrief';

function rep(input: Partial<TrainingRep> & Pick<TrainingRep, 'id' | 'repNumber'>): TrainingRep {
  return {
    id: input.id,
    repNumber: input.repNumber,
    outcome: input.outcome ?? 'success',
    evidence: input.evidence ?? {
      source: 'owner_confirmed',
      confidence: 1,
      observedOutcome: input.outcome ?? 'success',
      observedAt: `2026-09-12T10:00:0${input.repNumber}.000Z`,
      cueAt: `2026-09-12T10:00:0${input.repNumber}.000Z`,
      responseAt: `2026-09-12T10:00:0${input.repNumber}.800Z`,
      markerAt: null,
      rewardAt: null,
      cueCount: 1,
      signal: null,
      posture: null,
      poseConfidence: null,
      notes: null,
    },
    correction: input.correction ?? null,
  };
}

function sessionWith(reps: TrainingRep[]) {
  let session = createLiveCoachSession({ id: 'session-1', dogId: 'dog-1', lessonId: 'focus-check-in', targetReps: reps.length });
  for (const item of reps) session = applyRepToLiveSession(session, item).session;
  return session;
}

describe('SessionDebrief', () => {
  it('gives clean sessions a one-variable progression recommendation', () => {
    const debrief = buildSessionDebrief(sessionWith([
      rep({ id: 'r1', repNumber: 1 }),
      rep({ id: 'r2', repNumber: 2 }),
      rep({ id: 'r3', repNumber: 3 }),
    ]));

    expect(debrief.headline).toBe('Strong, clean session');
    expect(debrief.cleanRepRate).toBe(1);
    expect(debrief.nextSessionRecommendation).toContain('one challenge variable');
    expect(debrief.safetyNote).toBeNull();
  });

  it('puts stress evidence above clean performance', () => {
    const stress = rep({
      id: 'r2',
      repNumber: 2,
      evidence: {
        source: 'owner_confirmed', confidence: 1, observedOutcome: 'success',
        observedAt: '2026-09-12T10:00:02.000Z', cueAt: null, responseAt: null,
        markerAt: null, rewardAt: null, cueCount: 1, signal: 'stress: avoidance-like',
        posture: null, poseConfidence: null, notes: null,
      },
    });
    const debrief = buildSessionDebrief(sessionWith([
      rep({ id: 'r1', repNumber: 1 }), stress, rep({ id: 'r3', repNumber: 3 }),
    ]));

    expect(debrief.headline).toBe('Comfort comes first');
    expect(debrief.safetyNote).toContain('not a medical diagnosis');
    expect(debrief.nextSessionRecommendation).toContain('easier setup');
  });

  it('coaches the owner when cue repetition is the main breakdown', () => {
    const repeated = rep({
      id: 'r2', repNumber: 2, outcome: 'partial-success',
      evidence: {
        source: 'owner_confirmed', confidence: 1, observedOutcome: 'partial-success',
        observedAt: '2026-09-12T10:00:02.000Z', cueAt: null, responseAt: null,
        markerAt: null, rewardAt: null, cueCount: 2, signal: null,
        posture: null, poseConfidence: null, notes: null,
      },
    });
    const debrief = buildSessionDebrief(sessionWith([
      rep({ id: 'r1', repNumber: 1 }), repeated, rep({ id: 'r3', repNumber: 3 }),
    ]));

    expect(debrief.headline).toBe('Make the cue clearer');
    expect(debrief.ownerCoachingTip).toContain('Give the cue once');
  });

  it('stays conservative when owner corrections are common', () => {
    const corrected = (id: string, repNumber: number) => rep({
      id,
      repNumber,
      correction: {
        correctedAt: `2026-09-12T10:01:0${repNumber}.000Z`,
        outcome: 'success',
        reason: 'Owner corrected automatic score',
      },
    });
    const debrief = buildSessionDebrief(sessionWith([
      corrected('r1', 1), corrected('r2', 2), rep({ id: 'r3', repNumber: 3 }),
    ]));

    expect(debrief.headline).toBe('Collect cleaner evidence');
    expect(debrief.ownerCorrectionRate).toBeCloseTo(2 / 3);
    expect(debrief.summary).toContain('owner confirmation or correction');
  });
});
