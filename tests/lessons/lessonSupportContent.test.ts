import { productionLessonDefinitions } from '../../src/features/lessons/catalogue/definitions';
import { lessonSupportContent } from '../../src/features/lessons/session/lessonSupportContent';

describe('lessonSupportContent', () => {
  it('reorganises real lesson content without inventing or discarding advice', () => {
    for (const lesson of productionLessonDefinitions) {
      const support = lessonSupportContent(lesson);

      // Overview and aim come straight from the lesson definition.
      expect(support.overview).toBe(lesson.goal.trim());

      // Every unique coaching tip is preserved.
      for (const tip of lesson.tips) {
        expect(support.coachingTips).toContain(tip.trim());
      }
      // Every unique common mistake and troubleshooting problem is preserved
      // under "things that might go wrong".
      for (const mistake of lesson.commonMistakes) {
        expect(support.thingsThatMightGoWrong).toContain(mistake.trim());
      }
      for (const item of lesson.troubleshooting) {
        expect(support.thingsThatMightGoWrong).toContain(item.problem.trim());
        // Every troubleshooting solution is preserved as an "easier" adjustment.
        expect(support.waysToMakeEasier).toContain(item.solution.trim());
      }
    }
  });

  it('de-duplicates repeated advice while keeping the first wording', () => {
    const lesson = {
      ...productionLessonDefinitions[0],
      tips: ['Keep sessions short.', 'keep sessions short.', 'Reward calm choices.'],
    };

    const support = lessonSupportContent(lesson);

    expect(support.coachingTips).toEqual(['Keep sessions short.', 'Reward calm choices.']);
  });
});
