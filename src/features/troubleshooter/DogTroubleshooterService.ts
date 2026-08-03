import type { LessonLibraryService } from '../lessons/library/LessonLibraryService';
import type { LessonLibraryItem, LessonState } from '../lessons/library/lessonLibraryTypes';
import { concernForId, type TroubleshooterConcern, type TroubleshooterConcernId } from './troubleshooterCatalogue';

export type TroubleshooterRecommendation = {
  readonly lesson: LessonLibraryItem;
  readonly reason: string;
};

export type TroubleshooterResult = {
  readonly concern: TroubleshooterConcern;
  readonly primary: TroubleshooterRecommendation | null;
  readonly alternatives: readonly TroubleshooterRecommendation[];
};

const statePriority: Readonly<Record<LessonState, number>> = Object.freeze({
  IN_PROGRESS: 0,
  AVAILABLE: 1,
  COMPLETED: 2,
  LOCKED: 3,
});

export class DogTroubleshooterService {
  constructor(private readonly library: Pick<LessonLibraryService, 'getAllLessons'>) {}

  recommend(concernId: TroubleshooterConcernId): TroubleshooterResult {
    const concern = concernForId(concernId);
    const matching = this.library.getAllLessons()
      .filter((lesson) => lesson.skill === concern.id)
      .sort((a, b) => statePriority[a.state] - statePriority[b.state]
        || a.difficulty - b.difficulty
        || a.id.localeCompare(b.id));
    const recommendations = matching.slice(0, 3).map((lesson) => Object.freeze({
      lesson,
      reason: recommendationReason(lesson),
    }));

    return Object.freeze({
      concern,
      primary: recommendations[0] ?? null,
      alternatives: Object.freeze(recommendations.slice(1)),
    });
  }
}

function recommendationReason(lesson: LessonLibraryItem): string {
  switch (lesson.state) {
    case 'IN_PROGRESS':
      return 'Continue the lesson already in progress.';
    case 'AVAILABLE':
      return 'This is the next available lesson for this concern.';
    case 'COMPLETED':
      return 'Revisit this completed lesson to reinforce the skill.';
    case 'LOCKED':
      return `This lesson matches the concern, but ${lesson.lock.reason.charAt(0).toLowerCase()}${lesson.lock.reason.slice(1)}`;
  }
}
