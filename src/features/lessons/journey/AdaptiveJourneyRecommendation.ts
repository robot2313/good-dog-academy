import type { AdaptiveTrainingMemory, SessionHistoryRecord } from '../../../domain/models/AdaptiveTrainingMemory';
import {
  decideAdaptiveLessonSwitch,
  type AdaptiveLessonSwitchDecision,
  type LessonCandidate,
} from '../../../domain/training/AdaptiveLessonSwitch';
import type { LessonLibraryItem } from '../library/lessonLibraryTypes';

export type AdaptiveJourneyRecommendation = AdaptiveLessonSwitchDecision & {
  currentLessonId: string;
  currentLessonTitle: string;
  recommendedLessonTitle: string;
};

function candidateFor(lesson: LessonLibraryItem): LessonCandidate {
  return {
    lessonId: lesson.id,
    skillId: lesson.skill,
    difficultyLevel: lesson.difficulty,
  };
}

export function buildAdaptiveJourneyRecommendation(input: {
  lessons: readonly LessonLibraryItem[];
  memory: AdaptiveTrainingMemory;
  history: SessionHistoryRecord[];
}): AdaptiveJourneyRecommendation | null {
  const current = input.lessons.find((lesson) => lesson.state === 'IN_PROGRESS')
    ?? input.lessons.find((lesson) => lesson.state === 'AVAILABLE');
  if (!current) return null;

  const selectable = input.lessons.filter((lesson) => lesson.state !== 'LOCKED');
  const decision = decideAdaptiveLessonSwitch({
    current: candidateFor(current),
    candidates: selectable.map(candidateFor),
    memory: input.memory,
    history: input.history,
  });
  const recommended = input.lessons.find((lesson) => lesson.id === decision.lessonId) ?? current;

  return {
    ...decision,
    currentLessonId: current.id,
    currentLessonTitle: current.title,
    recommendedLessonTitle: recommended.title,
  };
}
