import { productionLessonDefinitions } from '../../src/features/lessons/catalogue/definitions';
import {
  lessonCollections,
  lessonsForDiscoveryScope,
  recommendedLessons,
  trainingCategories,
} from '../../src/features/lessons/discovery';
import type { LessonLibraryItem } from '../../src/features/lessons/library/lessonLibraryTypes';

describe('lesson discovery', () => {
  it('offers every production skill as a six-lesson training category', () => {
    expect(trainingCategories).toHaveLength(10);
    expect(new Set(trainingCategories.map((category) => category.skill)).size).toBe(10);

    for (const category of trainingCategories) {
      expect(productionLessonDefinitions.filter((lesson) => lesson.skill === category.skill)).toHaveLength(6);
      expect(productionLessonDefinitions.some((lesson) => lesson.id === category.anchorLessonId)).toBe(true);
    }
  });

  it('keeps puppy, adult, senior and rescue collections limited to real active lessons', () => {
    expect(lessonCollections.map((collection) => collection.id)).toEqual([
      'puppy',
      'adult',
      'senior',
      'rescue',
    ]);

    const activeIds = new Set(productionLessonDefinitions.filter((lesson) => lesson.isActive).map((lesson) => lesson.id));
    for (const collection of lessonCollections) {
      expect(collection.lessonIds.length).toBeGreaterThanOrEqual(12);
      expect(new Set(collection.lessonIds).size).toBe(collection.lessonIds.length);
      expect(activeIds.has(collection.anchorLessonId)).toBe(true);
      for (const lessonId of collection.lessonIds) expect(activeIds.has(lessonId)).toBe(true);
    }
  });

  it('recommends in-progress and available lessons first while varying skills', () => {
    const lessons = [
      item('recall-one', 'recall', 'AVAILABLE', 1),
      item('recall-two', 'recall', 'IN_PROGRESS', 2),
      item('focus-one', 'focus', 'AVAILABLE', 1),
      item('barking-one', 'barking', 'COMPLETED', 1),
      item('chewing-one', 'chewing', 'LOCKED', 1),
    ];

    const selected = recommendedLessons(lessons, 3);
    expect(selected.map((lesson) => lesson.id)).toEqual(['recall-two', 'focus-one', 'barking-one']);
    expect(selected.some((lesson) => lesson.state === 'LOCKED')).toBe(false);
  });

  it('scopes the library to a category, collection or recommendations without changing lesson state', () => {
    const lessons = productionLessonDefinitions.map((lesson) => item(
      lesson.id,
      lesson.skill,
      'AVAILABLE',
      lesson.difficultyLevel,
    ));

    const houseTraining = lessonsForDiscoveryScope(lessons, { type: 'skill', skill: 'house-training' });
    expect(houseTraining).toHaveLength(6);
    expect(houseTraining.every((lesson) => lesson.skill === 'house-training')).toBe(true);

    const puppy = lessonsForDiscoveryScope(lessons, { type: 'collection', collectionId: 'puppy' });
    expect(puppy.map((lesson) => lesson.id)).toEqual(expect.arrayContaining(lessonCollections[0].lessonIds));

    const recommended = lessonsForDiscoveryScope(lessons, { type: 'recommended' });
    expect(recommended).toHaveLength(12);
    expect(recommended.every((lesson) => lesson.state === 'AVAILABLE')).toBe(true);
  });
});

function item(
  id: string,
  skill: LessonLibraryItem['skill'],
  state: LessonLibraryItem['state'],
  difficulty: LessonLibraryItem['difficulty'],
): LessonLibraryItem {
  const base = {
    id,
    title: id,
    description: id,
    difficulty,
    estimatedMinutes: 5,
    skill,
    keywords: [],
  } as const;
  if (state === 'LOCKED') {
    return {
      ...base,
      state,
      lock: { reason: 'Locked', missingPrerequisiteIds: [], missingPrerequisiteNames: [] },
    };
  }
  return { ...base, state, lock: null };
}
