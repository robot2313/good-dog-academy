import type { DifficultyVector } from '../behaviour/LiveCoachEngine';
import type { AdaptiveTrainingMemory, SessionHistoryRecord, SkillTrainingMemory } from '../models/AdaptiveTrainingMemory';

export type DogTwinState = 'recover' | 'build' | 'consolidate' | 'progress';
export type ProgramDayMode = 'train' | 'refresher' | 'recovery' | 'rest';

export type AdaptiveProgramDay = {
  dayIndex: number;
  mode: ProgramDayMode;
  skillId: string | null;
  difficulty: DifficultyVector | null;
  rationale: string;
};

export type AdaptiveTrainingProgram = {
  dogId: string;
  generatedAt: string;
  state: DogTwinState;
  focusSkillId: string | null;
  days: AdaptiveProgramDay[];
};

const clamp = (value: number) => Math.max(1, Math.min(5, Math.round(value)));

function easier(value: DifficultyVector): DifficultyVector {
  if (value.distraction > 1) return { ...value, distraction: value.distraction - 1 };
  if (value.distance > 1) return { ...value, distance: value.distance - 1 };
  if (value.duration > 1) return { ...value, duration: value.duration - 1 };
  return value;
}

function progressOneVariable(value: DifficultyVector): DifficultyVector {
  if (value.duration < 5) return { ...value, duration: clamp(value.duration + 1) };
  if (value.distance < 5) return { ...value, distance: clamp(value.distance + 1) };
  if (value.distraction < 5) return { ...value, distraction: clamp(value.distraction + 1) };
  return value;
}

function recentHistory(history: SessionHistoryRecord[], count = 3): SessionHistoryRecord[] {
  return [...history]
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .slice(0, count);
}

function hasRecentSafetySignal(history: SessionHistoryRecord[]): boolean {
  return recentHistory(history).some((record) =>
    record.endReason === 'stress'
      || record.stressSignalRate >= 0.2,
  );
}

function skillRisk(skill: SkillTrainingMemory): number {
  return (
    (1 - skill.cleanRepRate) * 2
    + skill.stressSignalRate * 3
    + skill.repeatedCueRate
    + skill.slowResponseRate
    + skill.correctedRepRate * 0.5
    + (skill.lastEndedEarly ? 1 : 0)
  );
}

function chooseFocusSkill(memory: AdaptiveTrainingMemory): SkillTrainingMemory | null {
  return Object.values(memory.skills)
    .sort((a, b) => skillRisk(b) - skillRisk(a))[0] ?? null;
}

export function deriveDogTwinState(
  memory: AdaptiveTrainingMemory,
  history: SessionHistoryRecord[],
): DogTwinState {
  if (hasRecentSafetySignal(history)) return 'recover';
  if (memory.totalSessions < 3) return 'build';

  const skills = Object.values(memory.skills);
  if (skills.some((skill) => skill.cleanRepRate < 0.65 || skill.repeatedCueRate >= 0.35 || skill.slowResponseRate >= 0.35)) {
    return 'consolidate';
  }

  return 'progress';
}

function day(
  dayIndex: number,
  mode: ProgramDayMode,
  skill: SkillTrainingMemory | null,
  state: DogTwinState,
): AdaptiveProgramDay {
  if (!skill || mode === 'rest') {
    return {
      dayIndex,
      mode,
      skillId: null,
      difficulty: null,
      rationale: mode === 'rest'
        ? 'Rest protects recovery and keeps the weekly plan sustainable.'
        : 'More training evidence is needed before assigning a skill-specific session.',
    };
  }

  const base = skill.recommendedDifficulty;
  if (mode === 'recovery') {
    return {
      dayIndex,
      mode,
      skillId: skill.skillId,
      difficulty: easier(base),
      rationale: 'Recent safety or stress evidence takes priority, so this session reduces pressure rather than progressing difficulty.',
    };
  }

  if (mode === 'refresher') {
    return {
      dayIndex,
      mode,
      skillId: skill.skillId,
      difficulty: easier(base),
      rationale: 'A short easier refresher protects fluency before the next full training session.',
    };
  }

  const difficulty = state === 'progress' ? progressOneVariable(base) : base;
  return {
    dayIndex,
    mode,
    skillId: skill.skillId,
    difficulty,
    rationale: state === 'progress'
      ? 'Evidence is stable enough to increase exactly one challenge variable while keeping the others unchanged.'
      : state === 'build'
        ? 'The program is collecting reliable baseline evidence before making stronger adaptations.'
        : 'The program keeps difficulty stable while rebuilding consistency in the priority skill.',
  };
}

function patternForState(state: DogTwinState): ProgramDayMode[] {
  return state === 'recover'
    ? ['recovery', 'rest', 'recovery', 'rest', 'refresher', 'rest', 'recovery']
    : state === 'build'
      ? ['train', 'rest', 'train', 'refresher', 'rest', 'train', 'rest']
      : state === 'consolidate'
        ? ['train', 'refresher', 'rest', 'train', 'rest', 'refresher', 'train']
        : ['train', 'rest', 'train', 'refresher', 'train', 'rest', 'train'];
}

export function buildAdaptiveTrainingProgram(
  memory: AdaptiveTrainingMemory,
  history: SessionHistoryRecord[],
  generatedAt: string,
): AdaptiveTrainingProgram {
  const state = deriveDogTwinState(memory, history);
  const focus = chooseFocusSkill(memory);
  const pattern = patternForState(state);

  return {
    dogId: memory.dogId,
    generatedAt,
    state,
    focusSkillId: focus?.skillId ?? null,
    days: pattern.map((mode, index) => day(index + 1, mode, focus, state)),
  };
}

export function regenerateRemainingAdaptiveProgram(input: {
  previous: AdaptiveTrainingProgram;
  completedThroughDay: number;
  memory: AdaptiveTrainingMemory;
  history: SessionHistoryRecord[];
  generatedAt: string;
}): AdaptiveTrainingProgram {
  const completedThroughDay = Math.max(0, Math.min(7, Math.floor(input.completedThroughDay)));
  const rebuilt = buildAdaptiveTrainingProgram(input.memory, input.history, input.generatedAt);
  const preserved = input.previous.days.filter((item) => item.dayIndex <= completedThroughDay);
  const replacement = rebuilt.days
    .filter((item) => item.dayIndex > completedThroughDay)
    .map((item) => ({ ...item }));

  return {
    ...rebuilt,
    days: [...preserved, ...replacement].sort((a, b) => a.dayIndex - b.dayIndex),
  };
}
