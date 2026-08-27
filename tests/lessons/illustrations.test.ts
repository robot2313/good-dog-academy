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

  it('locks every skill-level source to an approved photograph, never a category cartoon', () => {
    const expected = {
      barking: require('../../assets/lesson-images/by-lesson/barking-identify-triggers.jpg'),
      chewing: require('../../assets/lesson-images/by-lesson/chewing-appropriate-items.jpg'),
      confidence: require('../../assets/lesson-images/by-lesson/confidence-choice-and-exploration.jpg'),
      focus: require('../../assets/lesson-images/by-lesson/focus-check-in.jpg'),
      'house-training': require('../../assets/lesson-images/by-lesson/house-training-routine.jpg'),
      'impulse-control': require('../../assets/lesson-images/by-lesson/impulse-control-wait-for-reward.jpg'),
      jumping: require('../../assets/lesson-images/by-lesson/jumping-four-paws-down.jpg'),
      'loose-lead-walking': require('../../assets/lesson-images/by-lesson/loose-lead-reward-zone.jpg'),
      reactivity: require('../../assets/lesson-images/by-lesson/reactivity-safe-distance.jpg'),
      recall: require('../../assets/lesson-images/by-lesson/recall-name-response.jpg'),
    } as const;

    for (const skill of behaviourSkills) {
      expect(lessonIllustrationForSkill(skill).source).toBe(expected[skill]);
    }
  });
});
