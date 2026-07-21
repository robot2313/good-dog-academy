import type { LessonDefinition } from '../../../domain/models';

type AuthoredLesson = Omit<LessonDefinition, 'contentVersion' | 'category' | 'minimumDogAgeMonths' | 'completionCriteria' | 'isActive'> & {
  minimumDogAgeMonths?: number | null;
  completionDescription: string;
};

export function authorLesson(input: AuthoredLesson): LessonDefinition {
  const { completionDescription, minimumDogAgeMonths = null, ...content } = input;
  const category = input.difficultyLevel === 1 ? 'foundation' : input.difficultyLevel === 2 ? 'life-skills' : 'behaviour';
  return {
    ...content,
    contentVersion: 1,
    category,
    minimumDogAgeMonths,
    completionCriteria: { description: completionDescription, minimumSuccessfulCompletions: 1, minimumPerformanceRating: null },
    isActive: true,
  };
}
