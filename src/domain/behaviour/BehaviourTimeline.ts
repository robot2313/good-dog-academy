import type { SessionHistoryRecord } from '../models/AdaptiveTrainingMemory';

export type BehaviourTimelineSeverity = 'positive' | 'neutral' | 'watch' | 'safety';

export type BehaviourTimelineEvent = {
  id: string;
  occurredAt: string;
  skillId: string;
  lessonId: string;
  severity: BehaviourTimelineSeverity;
  title: string;
  detail: string;
};

export type BehaviourPattern = {
  id: 'stress_repeat' | 'cue_repeat' | 'slow_response' | 'owner_correction' | 'clean_streak';
  severity: BehaviourTimelineSeverity;
  title: string;
  detail: string;
};

export type BehaviourTimeline = {
  events: BehaviourTimelineEvent[];
  patterns: BehaviourPattern[];
};

function eventFor(record: SessionHistoryRecord): BehaviourTimelineEvent {
  if (record.endReason === 'stress' || record.stressSignalRate >= 0.2) {
    return {
      id: record.id,
      occurredAt: record.completedAt,
      skillId: record.skillId,
      lessonId: record.lessonId,
      severity: 'safety',
      title: 'Comfort signal changed the plan',
      detail: `Stress/discomfort-tagged evidence appeared in ${Math.round(record.stressSignalRate * 100)}% of recorded reps. Progression should pause until comfortable evidence returns.`,
    };
  }

  if (record.repeatedCueRate >= 0.35) {
    return {
      id: record.id,
      occurredAt: record.completedAt,
      skillId: record.skillId,
      lessonId: record.lessonId,
      severity: 'watch',
      title: 'Cue repetition increased',
      detail: `${Math.round(record.repeatedCueRate * 100)}% of reps used repeated cues. The next session should prioritise one clear cue and a pause before helping.`,
    };
  }

  if (record.slowResponseRate >= 0.35) {
    return {
      id: record.id,
      occurredAt: record.completedAt,
      skillId: record.skillId,
      lessonId: record.lessonId,
      severity: 'watch',
      title: 'Responses were slower',
      detail: `${Math.round(record.slowResponseRate * 100)}% of reps were slow after the cue. Keep or reduce difficulty until fluency improves.`,
    };
  }

  if (record.correctedRepRate >= 0.25) {
    return {
      id: record.id,
      occurredAt: record.completedAt,
      skillId: record.skillId,
      lessonId: record.lessonId,
      severity: 'neutral',
      title: 'Owner corrections protected accuracy',
      detail: `${Math.round(record.correctedRepRate * 100)}% of rep scores needed owner correction, so automatic conclusions should remain conservative.`,
    };
  }

  if (record.cleanRepRate >= 0.8) {
    return {
      id: record.id,
      occurredAt: record.completedAt,
      skillId: record.skillId,
      lessonId: record.lessonId,
      severity: 'positive',
      title: 'Strong clean session',
      detail: `${Math.round(record.cleanRepRate * 100)}% clean success with no stronger safety or breakdown signal.`,
    };
  }

  return {
    id: record.id,
    occurredAt: record.completedAt,
    skillId: record.skillId,
    lessonId: record.lessonId,
    severity: 'neutral',
    title: 'Training evidence added',
    detail: `${Math.round(record.cleanRepRate * 100)}% clean success. Keep collecting evidence before making a stronger adaptation.`,
  };
}

function recent(records: SessionHistoryRecord[], count: number): SessionHistoryRecord[] {
  return [...records]
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .slice(0, count);
}

export function buildBehaviourTimeline(records: SessionHistoryRecord[]): BehaviourTimeline {
  const sorted = [...records].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  const latest = recent(sorted, 4);
  const patterns: BehaviourPattern[] = [];

  const stressSessions = latest.filter((item) => item.endReason === 'stress' || item.stressSignalRate >= 0.2).length;
  if (stressSessions >= 2) {
    patterns.push({
      id: 'stress_repeat', severity: 'safety', title: 'Repeated comfort signal',
      detail: `${stressSessions} of the last ${latest.length} coached sessions contained stress/discomfort-tagged evidence. Keep the plan in recovery mode until this pattern clears.`,
    });
  }

  const cueRepeatSessions = latest.filter((item) => item.repeatedCueRate >= 0.35).length;
  if (cueRepeatSessions >= 2) {
    patterns.push({
      id: 'cue_repeat', severity: 'watch', title: 'Cue repetition is becoming a pattern',
      detail: `${cueRepeatSessions} recent sessions crossed the cue-repetition threshold. Coach one cue, pause, then help instead of repeating.`,
    });
  }

  const slowSessions = latest.filter((item) => item.slowResponseRate >= 0.35).length;
  if (slowSessions >= 2) {
    patterns.push({
      id: 'slow_response', severity: 'watch', title: 'Slow responses are persisting',
      detail: `${slowSessions} recent sessions showed frequent slow responses. Reduce demand and rebuild fluency before adding difficulty.`,
    });
  }

  const correctedSessions = latest.filter((item) => item.correctedRepRate >= 0.25).length;
  if (correctedSessions >= 2) {
    patterns.push({
      id: 'owner_correction', severity: 'neutral', title: 'Automation needs conservative confidence',
      detail: `${correctedSessions} recent sessions needed frequent owner corrections. Owner-confirmed evidence should continue to outrank automation.`,
    });
  }

  if (latest.length >= 3 && latest.slice(0, 3).every((item) => item.cleanRepRate >= 0.8 && item.stressSignalRate < 0.2)) {
    patterns.push({
      id: 'clean_streak', severity: 'positive', title: 'Three-session clean streak',
      detail: 'The last three coached sessions were consistently clean without a stronger comfort signal. Progress one challenge variable at a time.',
    });
  }

  return { events: sorted.map(eventFor), patterns };
}
