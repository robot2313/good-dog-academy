import { behaviourSkills } from '../../src/domain/models';
import { DogTroubleshooterService } from '../../src/features/troubleshooter/DogTroubleshooterService';
import { troubleshooterConcerns } from '../../src/features/troubleshooter/troubleshooterCatalogue';
import type { LessonLibraryItem, LessonState } from '../../src/features/lessons/library/lessonLibraryTypes';

describe('DogTroubleshooterService', () => {
  it('offers one concern for every behaviour skill without creating a second skill catalogue', () => {
    expect(troubleshooterConcerns.map((concern) => concern.id).sort()).toEqual([...behaviourSkills].sort());
    expect(new Set(troubleshooterConcerns.map((concern) => concern.id)).size).toBe(behaviourSkills.length);
  });

  it('prioritises in-progress and available lessons for the selected concern only', () => {
    const lessons = [
      lesson('recall-locked', 'recall', 'LOCKED', 3),
      lesson('focus-available', 'focus', 'AVAILABLE', 1),
      lesson('recall-completed', 'recall', 'COMPLETED', 1),
      lesson('recall-available', 'recall', 'AVAILABLE', 2),
      lesson('recall-in-progress', 'recall', 'IN_PROGRESS', 2),
    ];
    const service = new DogTroubleshooterService({ getAllLessons: () => lessons });

    const result = service.recommend('recall');

    expect(result.primary?.lesson.id).toBe('recall-in-progress');
    expect(result.primary?.reason).toBe('Continue the lesson already in progress.');
    expect(result.alternatives.map((item) => item.lesson.id)).toEqual(['recall-available', 'recall-completed']);
    expect([result.primary, ...result.alternatives].every((item) => item?.lesson.skill === 'recall')).toBe(true);
  });

  it('includes explicit safety escalation for high-risk concerns', () => {
    const service = new DogTroubleshooterService({ getAllLessons: () => [lesson('reactivity-foundation', 'reactivity', 'AVAILABLE', 1)] });

    const result = service.recommend('reactivity');

    expect(result.concern.safetyMessage).toMatch(/Do not force a greeting/);
    expect(result.concern.safetyMessage).toMatch(/qualified force-free trainer or veterinary behaviour professional/);
  });
});

function lesson(id: string, skill: LessonLibraryItem['skill'], state: LessonState, difficulty: LessonLibraryItem['difficulty']): LessonLibraryItem {
  const metadata = {
    id,
    title: id,
    description: `${id} description`,
    difficulty,
    estimatedMinutes: 5,
    skill,
    keywords: [skill],
  };
  return state === 'LOCKED'
    ? { ...metadata, state, lock: { reason: 'Complete the foundation first.', missingPrerequisiteIds: [], missingPrerequisiteNames: [] } }
    : { ...metadata, state, lock: null };
}
