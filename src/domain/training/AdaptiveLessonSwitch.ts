import type { AdaptiveTrainingMemory, SessionHistoryRecord } from '../models/AdaptiveTrainingMemory';

export type LessonSwitchReason =
  | 'stay_current'
  | 'safety_override'
  | 'declining_performance'
  | 'cue_repetition'
  | 'slow_response'
  | 'insufficient_evidence';

export type LessonCandidate = {
  lessonId: string;
  skillId: string;
  difficultyLevel: number;
};

export type AdaptiveLessonSwitchDecision = {
  action: 'stay' | 'switch';
  lessonId: string;
  reason: LessonSwitchReason;
  explanation: string;
};

function recentForSkill(history: SessionHistoryRecord[], skillId: string): SessionHistoryRecord[] {
  return history
    .filter((record) => record.skillId === skillId)
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .slice(0, 3);
}

function saferCandidate(current: LessonCandidate, candidates: LessonCandidate[]): LessonCandidate | null {
  return candidates
    .filter((candidate) => candidate.skillId === current.skillId && candidate.lessonId !== current.lessonId && candidate.difficultyLevel <= current.difficultyLevel)
    .sort((a, b) => a.difficultyLevel - b.difficultyLevel)[0] ?? null;
}

export function decideAdaptiveLessonSwitch(input: {
  current: LessonCandidate;
  candidates: LessonCandidate[];
  memory: AdaptiveTrainingMemory;
  history: SessionHistoryRecord[];
}): AdaptiveLessonSwitchDecision {
  const { current, candidates, memory, history } = input;
  const recent = recentForSkill(history, current.skillId);
  const skill = memory.skills[current.skillId];
  const fallback = saferCandidate(current, candidates);

  if (!skill || recent.length < 2) {
    return {
      action: 'stay',
      lessonId: current.lessonId,
      reason: 'insufficient_evidence',
      explanation: 'There is not enough recent evidence to change lessons safely.',
    };
  }

  const recentStress = recent.some((record) => record.endReason === 'stress' || record.stressSignalRate >= 0.2);
  if (recentStress && fallback) {
    return {
      action: 'switch',
      lessonId: fallback.lessonId,
      reason: 'safety_override',
      explanation: 'Recent stress or discomfort-tagged evidence overrides progression, so the plan switches to an easier lesson for the same skill.',
    };
  }

  const recentClean = recent.reduce((sum, record) => sum + record.cleanRepRate, 0) / recent.length;
  if (recentClean < 0.55 && fallback) {
    return {
      action: 'switch',
      lessonId: fallback.lessonId,
      reason: 'declining_performance',
      explanation: 'Recent clean-rep performance is below the reliability threshold, so the plan returns to an easier lesson.',
    };
  }

  if (skill.repeatedCueRate >= 0.4 && fallback) {
    return {
      action: 'switch',
      lessonId: fallback.lessonId,
      reason: 'cue_repetition',
      explanation: 'Repeated cues are common enough that a simpler lesson is preferred before adding challenge.',
    };
  }

  if (skill.slowResponseRate >= 0.4 && fallback) {
    return {
      action: 'switch',
      lessonId: fallback.lessonId,
      reason: 'slow_response',
      explanation: 'Responses are frequently slow, so the plan switches to a lower-demand lesson to rebuild fluency.',
    };
  }

  return {
    action: 'stay',
    lessonId: current.lessonId,
    reason: 'stay_current',
    explanation: 'Current evidence does not justify changing lessons.',
  };
}
