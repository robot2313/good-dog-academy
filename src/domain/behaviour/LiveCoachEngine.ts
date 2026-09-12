import type { TrainingOutcome } from '../models/TrainingSession';
import type { TrainingRep } from '../models/TrainingEvidence';
import { effectiveRepOutcome } from '../models/TrainingEvidence';

export type DifficultyVector = {
  distance: number;
  duration: number;
  distraction: number;
};

export type LiveCoachEndReason =
  | 'target_reached'
  | 'stress'
  | 'fatigue'
  | 'owner_stopped'
  | null;

export type LiveCoachSession = {
  id: string;
  dogId: string;
  lessonId: string;
  targetReps: number;
  reps: TrainingRep[];
  startingDifficulty: DifficultyVector;
  difficulty: DifficultyVector;
  cleanSuccessStreak: number;
  status: 'active' | 'complete';
  endedEarly: boolean;
  endReason: LiveCoachEndReason;
};

export type RepDiagnosisCode =
  | 'clean_rep'
  | 'stress_or_discomfort'
  | 'cue_repetition'
  | 'slow_response'
  | 'unclear_evidence'
  | 'difficulty_too_high';

export type RepDiagnosis = {
  code: RepDiagnosisCode;
  label: string;
  explanation: string;
  confidence: 'low' | 'medium' | 'high';
};

export type SessionDirectorAction =
  | 'repeat'
  | 'hold'
  | 'ease'
  | 'progress'
  | 'break'
  | 'finish';

export type SessionDirectorDecision = {
  action: SessionDirectorAction;
  headline: string;
  reason: string;
  instruction: string;
  nextDifficulty: DifficultyVector;
};

const clamp = (value: number) => Math.max(1, Math.min(5, Math.round(value)));

export function normaliseDifficulty(value: DifficultyVector): DifficultyVector {
  return {
    distance: clamp(value.distance),
    duration: clamp(value.duration),
    distraction: clamp(value.distraction),
  };
}

export function createLiveCoachSession(input: {
  id: string;
  dogId: string;
  lessonId: string;
  targetReps?: number;
  startDifficulty?: DifficultyVector;
}): LiveCoachSession {
  const start = normaliseDifficulty(input.startDifficulty ?? { distance: 1, duration: 1, distraction: 1 });
  return {
    id: input.id,
    dogId: input.dogId,
    lessonId: input.lessonId,
    targetReps: Math.max(1, input.targetReps ?? 5),
    reps: [],
    startingDifficulty: start,
    difficulty: start,
    cleanSuccessStreak: 0,
    status: 'active',
    endedEarly: false,
    endReason: null,
  };
}

function repHasStressSignal(rep: TrainingRep): boolean {
  const signal = rep.evidence.signal?.toLowerCase() ?? '';
  const notes = rep.evidence.notes?.toLowerCase() ?? '';
  return signal.includes('stress') || signal.includes('discomfort') || notes.includes('stress') || notes.includes('discomfort');
}

function repIsSlow(rep: TrainingRep): boolean {
  if (!rep.evidence.cueAt || !rep.evidence.responseAt) return false;
  const cue = new Date(rep.evidence.cueAt).getTime();
  const response = new Date(rep.evidence.responseAt).getTime();
  return Number.isFinite(cue) && Number.isFinite(response) && response - cue >= 4000;
}

export function diagnoseTrainingRep(rep: TrainingRep): RepDiagnosis {
  const outcome = effectiveRepOutcome(rep);

  if (repHasStressSignal(rep)) {
    return {
      code: 'stress_or_discomfort',
      label: 'Possible discomfort signal',
      explanation: 'The available evidence includes a stress/discomfort signal. Treat this as a reason to reduce pressure, not as a diagnosis.',
      confidence: rep.evidence.source === 'owner_confirmed' ? 'high' : 'medium',
    };
  }

  if ((rep.evidence.cueCount ?? 1) >= 2) {
    return {
      code: 'cue_repetition',
      label: 'Cue repeated',
      explanation: 'The cue was repeated before the response. Repeating can weaken cue clarity, so use one cue and then help instead.',
      confidence: 'high',
    };
  }

  if (repIsSlow(rep)) {
    return {
      code: 'slow_response',
      label: 'Slow response',
      explanation: 'The response arrived several seconds after the cue, suggesting the current setup may need simplifying or more practice.',
      confidence: 'medium',
    };
  }

  if (outcome === 'success') {
    return {
      code: 'clean_rep',
      label: 'Clean rep',
      explanation: 'The effective scored outcome is successful and no stronger breakdown signal is present.',
      confidence: rep.evidence.confidence !== null && rep.evidence.confidence >= 0.8 ? 'high' : 'medium',
    };
  }

  if (rep.evidence.confidence !== null && rep.evidence.confidence < 0.6 && !rep.correction) {
    return {
      code: 'unclear_evidence',
      label: 'Evidence unclear',
      explanation: 'Confidence is too low to make a strong training conclusion. Prefer owner confirmation before adapting aggressively.',
      confidence: 'low',
    };
  }

  return {
    code: 'difficulty_too_high',
    label: 'Current setup may be too difficult',
    explanation: 'The rep was not successful and no more specific breakdown explains it, so reduce one challenge variable and retest.',
    confidence: 'medium',
  };
}

function easier(d: DifficultyVector): DifficultyVector {
  if (d.distraction > 1) return { ...d, distraction: d.distraction - 1 };
  if (d.distance > 1) return { ...d, distance: d.distance - 1 };
  if (d.duration > 1) return { ...d, duration: d.duration - 1 };
  return d;
}

function harder(d: DifficultyVector): DifficultyVector {
  if (d.duration < 5) return { ...d, duration: d.duration + 1 };
  if (d.distance < 5) return { ...d, distance: d.distance + 1 };
  if (d.distraction < 5) return { ...d, distraction: d.distraction + 1 };
  return d;
}

function recentFailureCount(session: LiveCoachSession, take = 3): number {
  return session.reps
    .slice(-take)
    .filter((rep) => effectiveRepOutcome(rep) !== 'success').length;
}

function recentStressCount(session: LiveCoachSession, take = 3): number {
  return session.reps.slice(-take).filter(repHasStressSignal).length;
}

export function autonomousSessionDirector(session: LiveCoachSession): SessionDirectorDecision {
  const current = normaliseDifficulty(session.difficulty);
  const total = session.reps.length;

  if (session.status === 'complete') {
    return {
      action: 'finish',
      headline: 'Session complete',
      reason: 'This session has already been closed.',
      instruction: 'Save the session evidence and finish on a calm note.',
      nextDifficulty: current,
    };
  }

  // Safety/comfort outranks progression and even normal target completion.
  if (recentStressCount(session) >= 1) {
    return {
      action: 'break',
      headline: 'Reduce pressure',
      reason: 'A recent rep contains possible stress or discomfort evidence.',
      instruction: 'Pause, give the dog more space, and only continue if the dog settles comfortably.',
      nextDifficulty: easier(current),
    };
  }

  if (total >= session.targetReps) {
    return {
      action: 'finish',
      headline: 'Session complete',
      reason: 'The planned rep target has been reached.',
      instruction: 'Finish on a calm note and save the session evidence.',
      nextDifficulty: current,
    };
  }

  if (recentFailureCount(session) >= 2) {
    const next = easier(current);
    return {
      action: 'ease',
      headline: 'Make the next rep easier',
      reason: 'Two or more of the most recent reps were not clean successes.',
      instruction: 'Reduce one challenge variable and run the same skill again.',
      nextDifficulty: next,
    };
  }

  if (session.cleanSuccessStreak >= 2) {
    const next = harder(current);
    return {
      action: 'progress',
      headline: 'Ready for a small progression',
      reason: 'The dog has produced consecutive clean successful reps.',
      instruction: 'Increase only one challenge variable for the next rep.',
      nextDifficulty: next,
    };
  }

  if (total === 0) {
    return {
      action: 'repeat',
      headline: 'Run the first rep',
      reason: 'No evidence has been collected yet.',
      instruction: 'Use the planned setup and score the first response.',
      nextDifficulty: current,
    };
  }

  return {
    action: 'hold',
    headline: 'Hold this setup',
    reason: 'The evidence is not strong enough to justify making the exercise harder or easier yet.',
    instruction: 'Repeat at the same difficulty and collect another clean data point.',
    nextDifficulty: current,
  };
}

export function addRepToLiveSession(session: LiveCoachSession, rep: TrainingRep): LiveCoachSession {
  if (session.status === 'complete') return session;

  const reps = [...session.reps, rep];
  const outcome: TrainingOutcome = effectiveRepOutcome(rep);
  const cleanSuccessStreak = outcome === 'success' && !repHasStressSignal(rep)
    ? session.cleanSuccessStreak + 1
    : 0;

  const provisional: LiveCoachSession = {
    ...session,
    reps,
    cleanSuccessStreak,
  };

  const decision = autonomousSessionDirector(provisional);
  const reachedTarget = reps.length >= session.targetReps;
  const repeatedStress = recentStressCount(provisional) >= 2;

  return {
    ...provisional,
    difficulty: decision.nextDifficulty,
    status: reachedTarget || repeatedStress ? 'complete' : 'active',
    endedEarly: repeatedStress && !reachedTarget,
    endReason: repeatedStress ? 'stress' : reachedTarget ? 'target_reached' : null,
  };
}

export function stopLiveCoachSession(session: LiveCoachSession): LiveCoachSession {
  if (session.status === 'complete') return session;
  return { ...session, status: 'complete', endedEarly: true, endReason: 'owner_stopped' };
}
