import { loadBundledLessonCatalogue } from '../../src/features/lessons/catalogue';
import {
  createLessonFlow,
  lessonDiagramLabel,
  lessonEncouragement,
} from '../../src/features/lessons/coaching/lessonCoaching';

describe('lesson coaching guidance', () => {
  const lessons = loadBundledLessonCatalogue().definitions;

  it('builds a concise, immutable three-stage roadmap for every bundled lesson', () => {
    expect(lessons).toHaveLength(60);

    for (const lesson of lessons) {
      const flow = createLessonFlow(lesson);
      expect(flow.map((stage) => stage.title)).toEqual([
        'Set up',
        'Coach',
        'Finish well',
      ]);
      expect(
        flow.every(
          (stage) =>
            stage.description.length > 20 && stage.description.length <= 105,
        ),
      ).toBe(true);
      expect(Object.isFrozen(flow)).toBe(true);
      expect(flow.every(Object.isFrozen)).toBe(true);
      expect(lessonDiagramLabel(lesson)).not.toContain('..');
    }
  });

  it('provides encouragement that reflects the skill and lesson level', () => {
    const foundation = loadBundledLessonCatalogue().requireById('recall-name-response');
    const advanced = loadBundledLessonCatalogue().requireById(
      'reactivity-controlled-exposure',
    );

    expect(lessonEncouragement(foundation)).toContain('happy return');
    expect(lessonEncouragement(foundation)).toContain('first wins');
    expect(lessonEncouragement(advanced)).toContain('Creating distance');
    expect(lessonEncouragement(advanced)).toContain('Real-world reliability');
  });
});
