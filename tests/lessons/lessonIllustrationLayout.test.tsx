import { render } from '@testing-library/react-native';

import {
  LessonIllustration,
  lessonIllustrationForSkill,
} from '../../src/features/lessons/coaching/LessonIllustration';
import { getLessonImageSource } from '../../src/features/lessons/coaching/lessonImageManifest';
import { styles } from '../../src/theme/styles';

describe('lesson illustration layout', () => {
  it('uses a 3:2 landscape aspect ratio with no conflicting fixed height', () => {
    const style = styles.lessonIllustration as Record<string, unknown>;
    expect(style.aspectRatio).toBe(3 / 2);
    expect(style.width).toBe('100%');
    // A fixed tall height would fight the aspect ratio and crop the landscape image.
    expect('height' in style).toBe(false);
  });

  it('keeps rounded corners and clipping on the illustration wrapper', () => {
    const card = styles.lessonIllustrationCard as Record<string, unknown>;
    expect(card.overflow).toBe('hidden');
    expect(typeof card.borderRadius).toBe('number');
  });

  it('renders the lesson-specific image resolved by lesson id, shown in full without distortion', () => {
    const lessonId = 'recall-name-response';
    const skill = 'recall' as const;
    const label = lessonIllustrationForSkill(skill).accessibilityLabel;

    const view = render(
      <LessonIllustration skill={skill} lessonId={lessonId} commonMistake="Some mistake" />,
    );
    const image = view.getByLabelText(label);

    expect(image.props.source).toBe(getLessonImageSource(lessonId, skill));
    // contain guarantees the whole training action stays visible (no aggressive crop).
    expect(image.props.resizeMode).toBe('contain');

    const imageStyle = image.props.style as Record<string, unknown>;
    expect(imageStyle.aspectRatio).toBe(3 / 2);
    expect(imageStyle.width).toBe('100%');
    expect('height' in imageStyle).toBe(false);
  });

  it('preserves the accessibility label on the illustration image', () => {
    const label = lessonIllustrationForSkill('reactivity').accessibilityLabel;
    const view = render(
      <LessonIllustration skill="reactivity" lessonId="reactivity-safe-distance" />,
    );
    expect(view.getByLabelText(label)).toBeTruthy();
    expect(label.length).toBeGreaterThan(0);
  });
});
