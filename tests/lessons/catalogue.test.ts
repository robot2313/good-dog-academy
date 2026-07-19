import { validateLessonDefinition } from '../../src/domain/validation';
import { LessonCatalogue, LessonCatalogueError } from '../../src/features/lessons/catalogue';
import { advancedLesson, foundationLesson, lessonDefinitions, recallLesson } from '../support/lessonFixtures';

describe('LessonDefinition validation and immutable catalogue', () => {
  it('accepts a complete valid definition and rejects malformed or unsupported values', () => {
    expect(validateLessonDefinition(foundationLesson)).toMatchObject({ valid: true });
    expect(validateLessonDefinition({ ...foundationLesson, title: '' }).valid).toBe(false);
    expect(validateLessonDefinition({ ...foundationLesson, skill: 'unsupported' }).valid).toBe(false);
    expect(validateLessonDefinition({ ...foundationLesson, difficultyLevel: 6 }).valid).toBe(false);
  });

  it('loads an empty catalogue', () => expect(LessonCatalogue.load([]).definitions).toEqual([]));

  it('rejects duplicate lesson IDs with structured context', () => {
    expect(() => LessonCatalogue.load([foundationLesson, { ...recallLesson, id: foundationLesson.id }])).toThrow(expect.objectContaining<Partial<LessonCatalogueError>>({ code: 'DUPLICATE_LESSON_IDS' }));
  });

  it('rejects missing prerequisite references', () => {
    expect(() => LessonCatalogue.load([recallLesson])).toThrow(expect.objectContaining<Partial<LessonCatalogueError>>({ code: 'MISSING_LESSON_PREREQUISITES' }));
  });

  it('rejects circular prerequisite chains', () => {
    const first = { ...foundationLesson, prerequisites: [{ lessonId: recallLesson.id, minimumSuccessfulCompletions: 1 }] };
    expect(() => LessonCatalogue.load([first, recallLesson])).toThrow(expect.objectContaining<Partial<LessonCatalogueError>>({ code: 'CIRCULAR_LESSON_PREREQUISITES' }));
  });

  it('orders deterministically by difficulty then stable ID and returns immutable definitions', () => {
    const catalogue = LessonCatalogue.load(lessonDefinitions);
    expect(catalogue.definitions.map((lesson) => lesson.id)).toEqual([foundationLesson.id, recallLesson.id, advancedLesson.id]);
    expect(catalogue.findById(recallLesson.id)?.title).toBe(recallLesson.title);
    expect(Object.isFrozen(catalogue.definitions)).toBe(true);
    expect(Object.isFrozen(catalogue.definitions[0].steps)).toBe(true);
  });
});
