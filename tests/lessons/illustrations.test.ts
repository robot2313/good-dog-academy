import { behaviourSkills } from '../../src/domain/models';
import { lessonIllustrationForSkill } from '../../src/features/lessons/coaching/LessonIllustration';

describe('lesson illustrations', () => {
  it('provides a bundled, accessible instructional image for every skill', () => {
    for (const skill of behaviourSkills) {
      const illustration = lessonIllustrationForSkill(skill);
      expect(illustration.source).toBeTruthy();
      expect(illustration.accessibilityLabel.length).toBeGreaterThan(60);
      expect(illustration.caption.length).toBeGreaterThan(50);
    }
  });

  it('keeps each image description specific to its skill', () => {
    const descriptions = behaviourSkills.map(
      (skill) => lessonIllustrationForSkill(skill).accessibilityLabel,
    );

    expect(new Set(descriptions).size).toBe(behaviourSkills.length);
    expect(lessonIllustrationForSkill('reactivity').caption).toContain('distance');
    expect(lessonIllustrationForSkill('confidence').caption).toContain('retreat');
  });
});
