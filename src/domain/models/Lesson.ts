export type LessonCategory = 'foundation' | 'recall' | 'lead-pulling' | 'jumping';
export type LessonDifficulty = 1 | 2 | 3 | 4 | 5;

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: LessonCategory;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  steps: string[];
  successCriteria: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};
