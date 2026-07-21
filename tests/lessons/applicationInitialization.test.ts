import { LessonCatalogueError } from '../../src/features/lessons/catalogue';
import { initializeApplication } from '../../src/services/initialization';

describe('lesson catalogue application initialization', () => {
  it('validates the catalogue during normal initialization', async () => {
    const loadLessonCatalogue = jest.fn(() => undefined);
    await expect(initializeApplication({ migrate: jest.fn(async () => 4), loadLessonCatalogue, report: jest.fn() })).resolves.toEqual({ ok: true });
    expect(loadLessonCatalogue).toHaveBeenCalledTimes(1);
  });

  it('fails safely and reports a structured catalogue error', async () => {
    const report = jest.fn();
    const result = await initializeApplication({
      migrate: jest.fn(async () => 4),
      loadLessonCatalogue: () => { throw new LessonCatalogueError('DUPLICATE_LESSON_IDS', { lessonIds: ['duplicate-lesson'] }); },
      report,
    });
    expect(result).toMatchObject({ ok: false, error: { code: 'DUPLICATE_LESSON_IDS', context: { phase: 'lesson-catalogue-validation', lessonIds: ['duplicate-lesson'] } } });
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ code: 'DUPLICATE_LESSON_IDS' }));
  });
});
