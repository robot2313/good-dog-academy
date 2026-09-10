import { productionLessonDefinitions } from '../../src/features/lessons/catalogue/definitions';
import {
  getLessonStepVisual,
  lessonHasStepVisuals,
} from '../../src/features/lessons/coaching/lessonStepVisuals';

describe('lesson step visual coverage', () => {
  it('keeps the production catalogue at exactly 60 lessons', () => {
    expect(productionLessonDefinitions).toHaveLength(60);
  });

  it('keeps every production lesson on an approved 5-step or 10-step sequence', () => {
    for (const lesson of productionLessonDefinitions) {
      expect([5, 10]).toContain(lesson.steps.length);
    }
  });

  it('provides a verified photo-backed visual for every step in every production lesson', () => {
    for (const lesson of productionLessonDefinitions) {
      expect(lessonHasStepVisuals(lesson.id)).toBe(true);

      lesson.steps.forEach((_step, stepIndex) => {
        const visual = getLessonStepVisual(lesson.id, stepIndex);
        expect(visual).not.toBeNull();
        expect(visual?.setupImage).toBeTruthy();
        expect(visual?.caption).toContain(lesson.title);
        expect(visual?.caption).toContain(`step ${stepIndex + 1}`);
      });
    }
  });
});
